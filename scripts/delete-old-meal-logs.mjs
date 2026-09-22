// 指定したお客様のmealLogsのうち、cutoff日時より前に作成されたもの
// (=古い重複データ)だけを削除する。
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const botEmail = process.env.MEAL_LOG_BOT_EMAIL;
const botPassword = process.env.MEAL_LOG_BOT_PASSWORD;

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
    const toDelete = snap.docs.filter((d) => {
      const created = d.data().createdAt?.toDate?.() ?? new Date(0);
      return created < cutoff;
    });

    console.log(`対象お客様: ${client.data().name}(${client.id})`);
    console.log(`削除対象: ${toDelete.length}件(cutoff=${cutoff.toISOString()}より前に作成)`);

    if (dryRun) {
      console.log("(--dry-run のため実際の削除は行いません)");
    } else {
      const batch = writeBatch(db);
      for (const d of toDelete) {
        batch.delete(doc(db, "mealLogs", d.id));
      }
      await batch.commit();
      console.log(`削除しました: ${toDelete.length}件`);
    }
  }
} finally {
  await terminate(db);
}
