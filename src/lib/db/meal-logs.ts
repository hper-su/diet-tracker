import {
  collection,
  doc,
  updateDoc,
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
import type { DailyMealTotal } from "@/lib/health/meal-totals";

export const MEAL_LOGS_COLLECTION = "mealLogs";
const COLLECTION = MEAL_LOGS_COLLECTION;

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealLog = {
  id: string;
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

type MealLogDoc = Omit<MealLog, "id"> & {
  clientId: string;
  createdAt?: Timestamp | null;
};

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

function fromDoc(id: string, data: MealLogDoc): MealLog {
  const { clientId: _clientId, createdAt: _createdAt, ...rest } = data;
  return { id, ...rest };
}

export async function listMealLogsByDate(
  clientId: string,
  recordedAt: string,
): Promise<MealLog[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      where("recordedAt", "==", recordedAt),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs
    .map((d) => fromDoc(d.id, d.data() as MealLogDoc))
    .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType]);
}

export function subscribeToMealLogs(clientId: string, callback: () => void): Unsubscribe {
  return subscribeToCollectionByClient(db, COLLECTION, clientId, callback);
}

// 週次・月次サマリー用。日付ごとの合計を、記録がある日だけ返す
// (記録がない日は呼び出し側で0埋めする)。
export async function listMealLogTotalsByDateRange(
  clientId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyMealTotal[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      where("recordedAt", ">=", fromDate),
      where("recordedAt", "<=", toDate),
    ),
  );

  const totalsByDate = new Map<string, DailyMealTotal>();
  for (const d of snap.docs) {
    const row = d.data() as MealLogDoc;
    const existing = totalsByDate.get(row.recordedAt);
    if (existing) {
      existing.kcal += row.kcal;
      existing.proteinG += row.proteinG;
      existing.fatG += row.fatG;
      existing.carbG += row.carbG;
    } else {
      totalsByDate.set(row.recordedAt, {
        recordedAt: row.recordedAt,
        kcal: row.kcal,
        proteinG: row.proteinG,
        fatG: row.fatG,
        carbG: row.carbG,
      });
    }
  }

  return Array.from(totalsByDate.values()).sort((a, b) =>
    a.recordedAt.localeCompare(b.recordedAt),
  );
}

export type InsertMealLogInput = {
  clientId: string;
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

// 複数件をまとめて登録する(食事記録フォームの複数行送信、「普段の3食から記録を作成」など)。
export async function insertMealLogs(inputs: InsertMealLogInput[]): Promise<void> {
  await chunkedBatchInsert(db, COLLECTION, inputs);
}

export type UpdateMealLogInput = {
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

export async function updateMealLog(
  clientId: string,
  id: string,
  input: UpdateMealLogInput,
): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await updateDoc(doc(db, COLLECTION, id), { ...input });
}

export async function deleteMealLog(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

// 1日の合計を手入力で直すための「調整行」。品目とは別に1日1件だけ持ち、
// 品目合計との差分(負数可)を保存する。集計は他の記録と同じく単純に足し算される。
export const ADJUSTMENT_FOOD_NAME = "手入力調整";

export function isAdjustmentLog(log: Pick<MealLog, "foodId" | "foodName">): boolean {
  return log.foodId === null && log.foodName === ADJUSTMENT_FOOD_NAME;
}

// その日の調整行を差分amountsで置き換える(既存があれば更新、全て0なら削除)。
// dayLogsはその日の記録(呼び出し側が取得済みのもの。二重取得を避けるため受け取る)。
export async function setDailyAdjustment(
  clientId: string,
  recordedAt: string,
  dayLogs: MealLog[],
  amounts: { kcal: number; proteinG: number; fatG: number; carbG: number },
): Promise<void> {
  const [existing, ...extras] = dayLogs.filter(isAdjustmentLog);
  await Promise.all(extras.map((extra) => deleteMealLog(clientId, extra.id)));

  const isZero =
    amounts.kcal === 0 && amounts.proteinG === 0 && amounts.fatG === 0 && amounts.carbG === 0;
  if (isZero) {
    if (existing) await deleteMealLog(clientId, existing.id);
    return;
  }

  const fields = {
    recordedAt,
    mealType: "snack" as const,
    foodId: null,
    foodName: ADJUSTMENT_FOOD_NAME,
    quantity: 1,
    ...amounts,
    memo: null,
  };
  if (existing) {
    await updateMealLog(clientId, existing.id, fields);
  } else {
    await insertMealLogs([{ clientId, ...fields }]);
  }
}
