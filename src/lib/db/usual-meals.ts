import {
  collection,
  doc,
  writeBatch,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { belongsToClient } from "./firestore-helpers";

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
  return onSnapshot(
    query(collection(db, COLLECTION), where("clientId", "==", clientId)),
    () => callback(),
  );
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
// writeBatchで送るため、1件でも失敗した場合に一部だけ登録された状態が残ることはない。
export async function insertUsualMeals(inputs: InsertUsualMealInput[]): Promise<void> {
  const batch = writeBatch(db);
  for (const input of inputs) {
    const ref = doc(collection(db, COLLECTION));
    batch.set(ref, { ...input, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

export async function deleteUsualMeal(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
