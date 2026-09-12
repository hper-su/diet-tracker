import { supabase, unwrap, run } from "./supabase";

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
  const rows = await unwrap<UsualMeal[]>(
    supabase
      .from("usualMeals")
      .select("*")
      .eq("clientId", clientId)
      .order("id", { ascending: true }),
  );
  return rows.sort(
    (a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType],
  );
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
// 1回のINSERT文で送るため、1件でも失敗した場合に一部だけ登録された状態が
// 残ることはない。
export async function insertUsualMeals(inputs: InsertUsualMealInput[]): Promise<void> {
  await run(supabase.from("usualMeals").insert(inputs.map((input) => ({ ...input }))));
}

export async function deleteUsualMeal(clientId: number, id: number): Promise<void> {
  await run(
    supabase.from("usualMeals").delete().eq("id", id).eq("clientId", clientId),
  );
}
