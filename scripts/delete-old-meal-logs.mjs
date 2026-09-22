// 指定したお客様のmealLogsのうち、cutoff日時より前に作成されたもの
// (=古い重複データ)だけを削除する。
//
// 注意: 旧Supabase版から移行したmealLogsは、ドキュメントIDが当時の連番
// (例: "10")のままのものがあり、そのcreatedAtはimportAllData側で
// Timestamp.fromMillis(Number(id))として作り直されているため、実際の登録日時に
// 関わらず1970年前後の非常に古い値になっている(src/lib/db/import-export.ts の
// orderingTimestamp参照)。これをそのままcutoff判定に使うと、実際には最近まで
// 使っていた移行済みの記録まで「古い」と誤判定して削除してしまう恐れがあるため、
// このスクリプトはID形式が数字だけの行を自動削除の対象から除外し、
// 手動確認を促す。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/delete-old-meal-logs.mjs "<お客様名(部分一致)>" <cutoffのISO日時> [--dry-run]

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  terminate,
} from "firebase/firestore";
import { isLegacyNumericId } from "./lib/legacy-id.mjs";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `エラー: 環境変数 ${name} が設定されていません。--env-file=.env.local ` +
        `--env-file=.env.automation.local を付けて実行しているか確認してください。`,
    );
    process.exit(1);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
};
const botEmail = requireEnv("MEAL_LOG_BOT_EMAIL");
const botPassword = requireEnv("MEAL_LOG_BOT_PASSWORD");

const clientQuery = process.argv[2];
const cutoffRaw = process.argv[3];
const dryRun = process.argv.includes("--dry-run");

if (!clientQuery || !cutoffRaw) {
  console.error('使い方: node scripts/delete-old-meal-logs.mjs "<お客様名>" <cutoffのISO日時> [--dry-run]');
  process.exit(1);
}
const cutoff = new Date(cutoffRaw);
if (Number.isNaN(cutoff.getTime())) {
  console.error(`cutoffの日時が解析できません: ${cutoffRaw}`);
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, botEmail, botPassword);

  const clientsSnap = await getDocs(collection(db, "clients"));
  const candidates = clientsSnap.docs.filter((d) =>
    String(d.data().name ?? "").includes(clientQuery),
  );
  if (candidates.length === 0) {
    console.error(`お客様が見つかりません: ${clientQuery}`);
    process.exitCode = 1;
  } else if (candidates.length > 1) {
    console.error(
      `お客様名が複数件ヒットしました: ` +
        candidates.map((d) => `${d.data().name}(${d.id})`).join(", "),
    );
    process.exitCode = 1;
  } else {
    const client = candidates[0];
    const snap = await getDocs(
      query(collection(db, "mealLogs"), where("clientId", "==", client.id)),
    );

    const legacyIdDocs = [];
    const toDelete = [];
    for (const d of snap.docs) {
      if (isLegacyNumericId(d.id)) {
        legacyIdDocs.push(d);
        continue;
      }
      const created = d.data().createdAt?.toDate?.() ?? new Date(0);
      if (created < cutoff) toDelete.push(d);
    }

    console.log(`対象お客様: ${client.data().name}(${client.id})`);
    console.log(`削除対象: ${toDelete.length}件(cutoff=${cutoff.toISOString()}より前に作成)`);
    if (legacyIdDocs.length > 0) {
      console.log(
        `注意: 旧Supabase版からの移行データ(IDが数字のみ)が${legacyIdDocs.length}件あり、` +
          `createdAtが信用できないため自動削除の対象から除外しました。` +
          `削除したい場合はアプリの食事記録画面から個別に確認・削除してください。`,
      );
    }

    if (dryRun) {
      console.log("(--dry-run のため実際の削除は行いません)");
    } else {
      // 500件/バッチのFirestore上限を踏まえ、450件区切りでバッチ削除する。
      const CHUNK_SIZE = 450;
      for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        for (const d of toDelete.slice(i, i + CHUNK_SIZE)) {
          batch.delete(doc(db, "mealLogs", d.id));
        }
        await batch.commit();
      }
      console.log(`削除しました: ${toDelete.length}件`);
    }
  }
} finally {
  await terminate(db);
}
