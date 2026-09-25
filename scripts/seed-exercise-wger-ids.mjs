#!/usr/bin/env node
// 種目マスタ(Firestoreのexercises)に、対応するwgerの種目ID(wgerId)を登録する
// 一度きりのスクリプト。対応表は scripts/lib/wger-exercise-map.mjs。
// すでにwgerIdが設定されている種目は、画面から手で選んだ値を上書きしないよう
// 変更しない。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/seed-exercise-wger-ids.mjs [--dry-run]

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, updateDoc, terminate } from "firebase/firestore";
import { UNMAPPED_EXERCISE_NAMES, WGER_EXERCISE_MAP } from "./lib/wger-exercise-map.mjs";

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
const dryRun = process.argv.includes("--dry-run");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, botEmail, botPassword);

  const snap = await getDocs(collection(db, "exercises"));
  const knownUnmapped = new Set(UNMAPPED_EXERCISE_NAMES);
  const unknown = [];
  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const { name, wgerId } = d.data();
    const target = WGER_EXERCISE_MAP.get(name);
    if (target === undefined) {
      if (!knownUnmapped.has(name)) unknown.push(name);
      continue;
    }
    if (wgerId != null) {
      skipped++; // 既に設定済み(手で選んだ値を尊重する)
      continue;
    }
    console.log(`${name}(${d.id}): wgerId -> ${target}`);
    if (!dryRun) {
      await updateDoc(doc(db, "exercises", d.id), { wgerId: target });
    }
    updated++;
  }

  console.log(
    `${dryRun ? "(--dry-run のため実際の更新は行いません) " : ""}` +
      `対象${updated}件 / 設定済みのためスキップ${skipped}件`,
  );
  if (unknown.length > 0) {
    console.log(
      `対応表にも「未対応」一覧にも無い種目(新しく追加された種目です。必要なら対応表へ追記してください): ${unknown.join("、")}`,
    );
  }
} finally {
  await terminate(db);
}
