#!/usr/bin/env node
// 全コレクションをJSONに書き出す簡易バックアップスクリプト。大きな一括書き込み
// (過去データ移行など)の前に、手元へ復元用のスナップショットを残しておくために使う。
//
// src/lib/db/import-export.tsのexportAllData()と同じ形(version付き、clientsの
// createdAtはISO文字列、それ以外のコレクションはcreatedAtを含まない)で書き出す
// ため、アプリの「データ管理」画面のインポート機能でそのまま復元できる
// (単にFirestoreの生データをダンプするだけだとversionが無く、インポート時に
// isExportedData()で弾かれて復元できないので注意)。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/backup-firestore.mjs --out path/to/backup.json

import { writeFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, terminate } from "firebase/firestore";

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

const outIndex = process.argv.indexOf("--out");
const outPath = outIndex !== -1 ? process.argv[outIndex + 1] : null;
if (!outPath) {
  console.error("使い方: node scripts/backup-firestore.mjs --out path/to/backup.json");
  process.exit(1);
}

// src/lib/db/import-export.tsのEXPORT_FORMAT_VERSIONと同じ値。アプリ側の
// バージョンが上がった場合はこちらも合わせて更新する。
const EXPORT_FORMAT_VERSION = 1;

// クライアント本体はcreatedAtをISO文字列として持つ(ClientRecordの形)。
// それ以外のコレクションは、インポート時にorderingTimestamp()で作り直される
// ためcreatedAtを含めない(exportAllData()と同じ扱い)。
const COLLECTIONS_WITHOUT_CREATED_AT = [
  "measurements",
  "foods",
  "mealLogs",
  "usualMeals",
  "protocolChecks",
  "exercises",
  "trainingLogs",
];

function stripCreatedAt(data) {
  const { createdAt: _createdAt, ...rest } = data;
  return rest;
}

const firebaseConfig = {
  apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
};
const botEmail = requireEnv("MEAL_LOG_BOT_EMAIL");
const botPassword = requireEnv("MEAL_LOG_BOT_PASSWORD");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, botEmail, botPassword);

  const out = { version: EXPORT_FORMAT_VERSION, exportedAt: new Date().toISOString() };

  const clientsSnap = await getDocs(collection(db, "clients"));
  out.clients = clientsSnap.docs.map((d) => {
    const { createdAt, ...rest } = d.data();
    return {
      ...rest,
      id: d.id,
      createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
    };
  });
  console.log(`clients: ${clientsSnap.size}件`);

  for (const collectionName of COLLECTIONS_WITHOUT_CREATED_AT) {
    const snap = await getDocs(collection(db, collectionName));
    out[collectionName] = snap.docs.map((d) => ({ id: d.id, ...stripCreatedAt(d.data()) }));
    console.log(`${collectionName}: ${snap.size}件`);
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`書き出しました: ${outPath}`);
} finally {
  await terminate(db);
}
