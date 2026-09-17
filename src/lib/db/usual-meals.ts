import {
  collection,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  belongsToClient,
  chunkedBatchInsert,
  subscribeToCollectionByClient,
} from "./firestore-helpers";

const COLLECTION = "usualMeals";

export type UsualMealType = "breakfast" | "lunch" | "dinner" | "snack";

export type UsualMeal = {
  id: string;
  clientId: string;
  mealType: UsualMealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

type UsualMealDoc = Omit<UsualMeal, "id"> & { createdAt?: Timestamp | null };

const MEAL_TYPE_ORDER: Record<UsualMealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

// お客様が普段食べている食事(朝食・昼食・夕食・間食)の目安を、
// 実際の日々の食事記録(mealLogs)とは別に管理する。
export async function listUsualMeals(clientId: string): Promise<UsualMeal[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      orderBy("createdAt", "asc"),
    ),
  );
  const rows = snap.docs.map((d) => {
    const { createdAt: _createdAt, ...rest } = d.data() as UsualMealDoc;
    return { id: d.id, ...rest };
  });
  return rows.sort(
    (a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType],
  );
}

export function subscribeToUsualMeals(clientId: string, callback: () => void): Unsubscribe {
  return subscribeToCollectionByClient(db, COLLECTION, clientId, callback);
}

export type InsertUsualMealInput = {
  clientId: string;
  mealType: UsualMealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// 複数件をまとめて登録する(1回のフォーム送信で複数品目を追加する場合)。
export async function insertUsualMeals(inputs: InsertUsualMealInput[]): Promise<void> {
  await chunkedBatchInsert(db, COLLECTION, inputs);
}

export async function deleteUsualMeal(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
