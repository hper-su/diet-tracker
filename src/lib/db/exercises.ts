import { collection, doc, getDoc, getDocs, writeBatch, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import { subscribeToCollection } from "./firestore-helpers";

const COLLECTION = "exercises";

export type ExerciseCategory = "生活活動" | "運動";

export type Exercise = {
  id: string;
  category: ExerciseCategory;
  name: string;
  mets: number;
};

// 運動マスタの初期データ(厚生労働省「健康づくりのための身体活動・運動ガイド2023」)。
// 旧Supabase版ではsupabase/schema.sqlのINSERT文で投入していたもの。
const EXERCISE_SEED_DATA: Omit<Exercise, "id">[] = [
  { category: "生活活動", name: "普通歩行(平地、約4.0km/時、犬を連れて)", mets: 3.0 },
  { category: "生活活動", name: "電動アシスト付き自転車に乗る", mets: 3.0 },
  { category: "生活活動", name: "カーペット掃き・フロア掃き・掃除機", mets: 3.3 },
  { category: "生活活動", name: "歩行(平地、約4.5〜5.1km/時、散歩など)", mets: 3.5 },
  { category: "生活活動", name: "楽に自転車に乗る(8.9km/時)", mets: 3.5 },
  { category: "生活活動", name: "自転車に乗る(16km/時未満、通勤)", mets: 4.0 },
  { category: "生活活動", name: "階段を上る(ゆっくり)", mets: 4.0 },
  { category: "生活活動", name: "やや速歩(平地、やや速めに、約5.6km/時)", mets: 4.3 },
  { category: "生活活動", name: "かなり速歩(平地、速く、約6.4km/時)", mets: 5.0 },
  { category: "生活活動", name: "こどもと遊ぶ(歩く/走る、活発に)", mets: 5.8 },
  { category: "生活活動", name: "農作業(干し草をまとめる、納屋の掃除)", mets: 7.8 },
  { category: "生活活動", name: "階段を上る(速く)", mets: 8.8 },
  { category: "運動", name: "ストレッチング", mets: 2.3 },
  { category: "運動", name: "ヨガ・ビリヤード", mets: 2.5 },
  { category: "運動", name: "ボウリング・バレーボール・社交ダンス", mets: 3.0 },
  { category: "運動", name: "太極拳・ピラティス", mets: 3.0 },
  { category: "運動", name: "自転車エルゴメーター(30〜50ワット)", mets: 3.5 },
  { category: "運動", name: "体操(家で、軽・中等度)", mets: 3.5 },
  { category: "運動", name: "ゴルフ(手引きカートを使って)", mets: 3.5 },
  { category: "運動", name: "ほどほどの強度で行う筋トレ(腕立て伏せ・腹筋運動)", mets: 3.8 },
  { category: "運動", name: "卓球", mets: 4.0 },
  { category: "運動", name: "ラジオ体操第1", mets: 4.0 },
  { category: "運動", name: "テニス(ダブルス)", mets: 4.5 },
  { category: "運動", name: "水中歩行(中等度)", mets: 4.5 },
  { category: "運動", name: "水泳(ゆっくりとした背泳)", mets: 4.8 },
  { category: "運動", name: "野球・ソフトボール", mets: 5.0 },
  { category: "運動", name: "筋トレ(スクワット)", mets: 5.0 },
  { category: "運動", name: "水泳(ゆっくりとした平泳ぎ)", mets: 5.3 },
  { category: "運動", name: "スキー・アクアビクス", mets: 5.3 },
  { category: "運動", name: "バドミントン", mets: 5.5 },
  { category: "運動", name: "ゆっくりとしたジョギング", mets: 6.0 },
  { category: "運動", name: "ウェイトトレーニング(高強度)", mets: 6.0 },
  { category: "運動", name: "バスケットボール", mets: 6.0 },
  { category: "運動", name: "山を登る(軽装)", mets: 6.5 },
  { category: "運動", name: "自転車エルゴメーター(90〜100ワット)", mets: 6.8 },
  { category: "運動", name: "ジョギング", mets: 7.0 },
  { category: "運動", name: "サッカー・スキー・スケート・ハンドボール", mets: 7.0 },
  { category: "運動", name: "エアロビクス", mets: 7.3 },
  { category: "運動", name: "テニス(シングルス)", mets: 7.3 },
  { category: "運動", name: "サイクリング(約20km/時)", mets: 8.0 },
  { category: "運動", name: "激しい強度で行う筋トレ(腕立て伏せ・腹筋運動)", mets: 8.0 },
  { category: "運動", name: "ランニング(約8.0km/時)", mets: 8.3 },
  { category: "運動", name: "水泳(クロール、ふつうの速さ)", mets: 8.3 },
  { category: "運動", name: "ランニング(約9.7km/時)", mets: 9.8 },
  { category: "運動", name: "水泳(クロール、速い)", mets: 10.0 },
  { category: "運動", name: "武道・武術(柔道・空手など)", mets: 10.3 },
  { category: "運動", name: "ランニング(約11.3km/時)", mets: 11.0 },
];

// 初回セットアップ用。既にデータが1件でもあれば何もしない(Postgres版の
// `on conflict (category, name) do nothing` と同じ「重複投入しても安全」という
// 位置づけ)。「データ管理」画面から手動で実行する。
export async function seedExercisesIfEmpty(): Promise<{ inserted: number }> {
  const existing = await getDocs(collection(db, COLLECTION));
  if (!existing.empty) return { inserted: 0 };

  const batch = writeBatch(db);
  for (const exercise of EXERCISE_SEED_DATA) {
    batch.set(doc(collection(db, COLLECTION)), exercise);
  }
  await batch.commit();
  return { inserted: EXERCISE_SEED_DATA.length };
}

// 運動習慣フォームの種目選択(セレクトボックス)用。
export async function listExercises(): Promise<Exercise[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exercise, "id">) }));
  return rows.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.mets - b.mets ||
      a.name.localeCompare(b.name),
  );
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Exercise, "id">) } : null;
}

export function subscribeToExercises(callback: () => void): Unsubscribe {
  return subscribeToCollection(db, COLLECTION, callback);
}
