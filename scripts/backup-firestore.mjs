#!/usr/bin/env node
// 全コレクションをJSONに書き出すだけの簡易バックアップスクリプト。大きな一括
// 書き込み(過去データ移行など)の前に、手元へ復元用のスナップショットを
// 残しておくために使う(src/lib/db/import-export.tsのexportAllData相当を
// スクリプトから直接叩けるようにしたもの。復元はアプリの「データ管理」画面の
// インポート機能を使う)。
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

const COLLECTIONS = [
  "clients",
  "measurements",
  "foods",
  "mealLogs",
  "usualMeals",
  "protocolChecks",
  "exercises",
  "trainingLogs",
];

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

  const out = { exportedAt: new Date().toISOString() };
  for (const collectionName of COLLECTIONS) {
    const snap = await getDocs(collection(db, collectionName));
    out[collectionName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`${collectionName}: ${snap.size}件`);
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`書き出しました: ${outPath}`);
} finally {
  await terminate(db);
}
