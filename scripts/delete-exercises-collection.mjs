// 運動関連機能の廃止(「普段の運動習慣」2026-09-22朝、運動マスタ2026-09-22夜)に
// 伴い、Firestoreのexercises・usualExercisesコレクションを空にする一回限りの
// メンテナンススクリプト。アプリのコードからはどちらも参照されなくなっている。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/delete-exercises-collection.mjs [--dry-run]

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  terminate,
} from "firebase/firestore";

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

const COLLECTIONS_TO_CLEAR = ["exercises", "usualExercises"];

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

  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const snap = await getDocs(collection(db, collectionName));
    console.log(`${collectionName}: 削除対象 ${snap.size}件`);

    if (dryRun) {
      continue;
    }
    const CHUNK_SIZE = 450;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const d of docs.slice(i, i + CHUNK_SIZE)) {
        batch.delete(doc(db, collectionName, d.id));
      }
      await batch.commit();
    }
    console.log(`${collectionName}: 削除しました ${snap.size}件`);
  }

  if (dryRun) {
    console.log("(--dry-run のため実際の削除は行いません)");
  }
} finally {
  await terminate(db);
}
