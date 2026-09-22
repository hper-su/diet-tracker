// 食品マスタのうち、献立提案機能(家庭料理編・コンビニ編・外食編)のどこからも
// 参照されていない「ブランド・メーカー系」カテゴリだけを削除する、一回限りの
// メンテナンススクリプト。対象カテゴリは、diet-trackerオーナーとの相談の上、
// 2026-09-22時点のsrc/lib/server/meal-templates.ts・meal-combos.tsを
// 確認して選定した(コンビニ・外食チェーンや家庭料理系の分類は対象外)。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/delete-unused-brand-foods.mjs [--dry-run]

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

const DELETE_CATEGORIES = new Set([
  "日清食品", "サントリー", "シャトレーゼ", "銀座コージーコーナー", "山崎製パン",
  "クリスピー・クリーム・ドーナツ", "伊藤園", "ミスタードーナツ", "Pasco",
  "大塚製薬", "フジパン", "ポッカサッポロ", "業務スーパー", "森永乳業", "日本ハム",
  "亀田製菓", "湖池屋", "ビアードパパ", "ニチレイ", "マルハニチロ", "ロッテ",
  "カゴメ", "江崎グリコ", "雪印メグミルク", "アサヒビール", "日本コカ・コーラ",
  "キリン", "カルビー", "キリンビール", "リプトン", "ニチレイフーズ", "東洋水産",
  "宝酒造", "アサヒ飲料", "ヤマザキ", "六甲バター", "味の素冷凍食品", "石井食品",
  "テーブルマーク", "エースコック", "片岡物産", "味の素", "コカ・コーラ",
]);

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

  const foodsSnap = await getDocs(collection(db, "foods"));
  const toDelete = foodsSnap.docs.filter((d) => DELETE_CATEGORIES.has(d.data().category));

  const byCategory = new Map();
  for (const d of toDelete) {
    const cat = d.data().category;
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }
  console.log(`削除対象: ${toDelete.length}件(${byCategory.size}カテゴリ)`);

  if (dryRun) {
    console.log("(--dry-run のため実際の削除は行いません)");
  } else {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const d of toDelete.slice(i, i + CHUNK_SIZE)) {
        batch.delete(doc(db, "foods", d.id));
      }
      await batch.commit();
    }
    console.log(`削除しました: ${toDelete.length}件`);
  }
} finally {
  await terminate(db);
}
