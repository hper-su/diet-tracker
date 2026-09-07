import { db } from "./client";

export type UsualMealType = "breakfast" | "lunch" | "dinner" | "snack";

export type UsualMeal = {
  id: number;
  clientId: number;
  mealType: UsualMealType;
  foodId: number | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

const MEAL_TYPE_ORDER: Record<UsualMealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

// お客様が普段食べている食事(朝食・昼食・夕食・間食)の目安を、
// 実際の日々の食事記録(meal_logs)とは別に管理する。
export async function listUsualMeals(clientId: number): Promise<UsualMeal[]> {
  const rows = await db.usualMeals.where("clientId").equals(clientId).toArray();
  return rows
    .sort((a, b) => a.id - b.id)
    .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType]);
}

export type InsertUsualMealInput = {
  clientId: number;
  mealType: UsualMealType;
  foodId: number | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// 複数件をまとめて登録する(1回のフォーム送信で複数品目を追加する場合)。
// 1件でも失敗した場合に一部だけ登録された状態が残らないよう、1つの
// トランザクションで行う。
export async function insertUsualMeals(inputs: InsertUsualMealInput[]): Promise<void> {
  await db.transaction("rw", db.usualMeals, async () => {
    await db.usualMeals.bulkAdd(inputs.map((input) => ({ ...input })) as UsualMeal[]);
  });
}

export async function deleteUsualMeal(clientId: number, id: number): Promise<void> {
  const row = await db.usualMeals.get(id);
  if (row && row.clientId === clientId) {
    await db.usualMeals.delete(id);
  }
}
