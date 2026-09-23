#!/usr/bin/env node
// 過去データ移行(scripts/import-training-logs.mjs)で自動作成した種目マスタ59件は
// 別名(aliases)が空のままだった。正規化時にマージした略語・表記ゆれのうち、
// 種目名の部分一致検索だけでは見つけられないもの(canonical名がabbrevを
// 文字列として含まない組み合わせ)だけを別名として登録する一度きりのスクリプト
// (例:「ラットプル」は「ラットプルダウン」に部分一致するため別名登録は不要)。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/seed-exercise-aliases.mjs [--dry-run]

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, updateDoc, terminate } from "firebase/firestore";

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

// 種目名 -> 追加する別名(部分一致検索では見つけられない表記ゆれ・略語のみ)。
const ALIASES_TO_ADD = new Map([
  ["ルーマニアデットリフト", ["ルーマニアン", "ルーマニアンデッドリフト"]],
  ["デッドバック", ["デットバック"]],
  ["ツイストプランク", ["プランクツイスト"]],
  ["ダンベルスイングスクワット", ["ダンベルスイングSQ"]],
  ["プレスダウン", ["ブレスダウン"]],
]);

const firebaseConfig = {
  apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
};
const botEmail = requireEnv("MEAL_LOG_BOT_EMAIL");
const botPassword = requireEnv("MEAL_LOG_BOT_PASSWORD");
const dryRun = process.argv.includes("--dry-run");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, botEmail, botPassword);

  const snap = await getDocs(collection(db, "exercises"));
  for (const d of snap.docs) {
    const name = d.data().name;
    const toAdd = ALIASES_TO_ADD.get(name);
    if (!toAdd) continue;

    const existing = Array.isArray(d.data().aliases) ? d.data().aliases : [];
    const merged = Array.from(new Set([...existing, ...toAdd]));
    console.log(`${name}(${d.id}): aliases ${JSON.stringify(existing)} -> ${JSON.stringify(merged)}`);

    if (!dryRun) {
      await updateDoc(doc(db, "exercises", d.id), { aliases: merged });
    }
  }

  if (dryRun) {
    console.log("(--dry-run のため実際の更新は行いません)");
  } else {
    console.log("更新しました。");
  }
} finally {
  await terminate(db);
}
