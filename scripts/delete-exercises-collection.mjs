// 運動マスタ機能の廃止(2026-09-22)に伴い、Firestoreのexercisesコレクションを
// 空にする一回限りのメンテナンススクリプト。アプリのコードからはどこからも
// 参照されなくなったコレクションを掃除する。
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const botEmail = process.env.MEAL_LOG_BOT_EMAIL;
const botPassword = process.env.MEAL_LOG_BOT_PASSWORD;
const dryRun = process.argv.includes("--dry-run");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, botEmail, botPassword);

  const snap = await getDocs(collection(db, "exercises"));
  console.log(`削除対象: ${snap.size}件`);

  if (dryRun) {
    console.log("(--dry-run のため実際の削除は行いません)");
  } else {
    const CHUNK_SIZE = 450;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const d of docs.slice(i, i + CHUNK_SIZE)) {
        batch.delete(doc(db, "exercises", d.id));
      }
      await batch.commit();
    }
    console.log(`削除しました: ${snap.size}件`);
  }
} finally {
  await terminate(db);
}
