import { supabase, unwrap, run } from "./supabase";
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
  const rows = await unwrap<(MealLog & { clientId: number })[]>(
    supabase
      .from("mealLogs")
      .select("*")
      .eq("clientId", clientId)
      .eq("recordedAt", recordedAt)
      .order("id", { ascending: true }),
  );

  return rows
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
  const rows = await unwrap<
    Pick<MealLog, "recordedAt" | "kcal" | "proteinG" | "fatG" | "carbG">[]
  >(
    supabase
      .from("mealLogs")
      .select("recordedAt, kcal, proteinG, fatG, carbG")
      .eq("clientId", clientId)
      .gte("recordedAt", fromDate)
      .lte("recordedAt", toDate),
  );

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
  await run(supabase.from("mealLogs").insert({ ...input }));
}

// 複数件をまとめて登録する(「普段の3食から記録を作成」など)。
export async function insertMealLogs(inputs: InsertMealLogInput[]): Promise<void> {
  await run(supabase.from("mealLogs").insert(inputs.map((input) => ({ ...input }))));
}

export async function deleteMealLog(clientId: number, id: number): Promise<void> {
  await run(
    supabase.from("mealLogs").delete().eq("id", id).eq("clientId", clientId),
  );
}
