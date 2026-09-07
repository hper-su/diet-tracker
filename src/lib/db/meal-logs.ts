import { db } from "./client";
import type { DailyMealTotal } from "@/lib/health/meal-totals";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealLog = {
  id: number;
  recordedAt: string;
  mealType: MealType;
  foodId: number | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

function stripClientId<T extends { clientId: number }>(row: T): Omit<T, "clientId"> {
  const { clientId: _clientId, ...rest } = row;
  return rest;
}

export async function listMealLogsByDate(
  clientId: number,
  recordedAt: string,
): Promise<MealLog[]> {
  const rows = await db.mealLogs
    .where("[clientId+recordedAt]")
    .equals([clientId, recordedAt])
    .toArray();

  return rows
    .sort((a, b) => a.id - b.id)
    .map(stripClientId)
    .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType]);
}

// 週次・月次サマリー用。日付ごとの合計を、記録がある日だけ返す
// (記録がない日は呼び出し側で0埋めする)。
export async function listMealLogTotalsByDateRange(
  clientId: number,
  fromDate: string,
  toDate: string,
): Promise<DailyMealTotal[]> {
  const rows = await db.mealLogs
    .where("[clientId+recordedAt]")
    .between([clientId, fromDate], [clientId, toDate], true, true)
    .toArray();

  const totalsByDate = new Map<string, DailyMealTotal>();
  for (const row of rows) {
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
  clientId: number;
  recordedAt: string;
  mealType: MealType;
  foodId: number | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

export async function insertMealLog(input: InsertMealLogInput): Promise<void> {
  await db.mealLogs.add({ ...input });
}

// 複数件をまとめて登録する(「普段の3食から記録を作成」など)。1件でも失敗した
// 場合に一部だけ登録された状態が残らないよう、1つのトランザクションで行う。
export async function insertMealLogs(inputs: InsertMealLogInput[]): Promise<void> {
  await db.transaction("rw", db.mealLogs, async () => {
    await db.mealLogs.bulkAdd(inputs.map((input) => ({ ...input })));
  });
}

export async function deleteMealLog(clientId: number, id: number): Promise<void> {
  const row = await db.mealLogs.get(id);
  if (row && row.clientId === clientId) {
    await db.mealLogs.delete(id);
  }
}
