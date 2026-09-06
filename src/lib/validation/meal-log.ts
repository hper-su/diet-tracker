import { parsePositiveNumber, type ValidationResult } from "./result";

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof VALID_MEAL_TYPES)[number];

export type MealLogInput = {
  recordedAt: string;
  mealTypeRaw: string;
  foodIdRaw: string;
  quantityRaw: string;
  memo: string;
};

export type MealLogData = {
  recordedAt: string;
  mealType: MealType;
  foodId: number;
  quantity: number;
  memo: string | null;
};

export function validateMealLogInput(
  input: MealLogInput,
): ValidationResult<MealLogData> {
  if (!input.recordedAt) {
    return { ok: false, error: "日付は必須です。" };
  }

  if (!VALID_MEAL_TYPES.includes(input.mealTypeRaw as MealType)) {
    return { ok: false, error: "食事の区分を選択してください。" };
  }

  if (!input.foodIdRaw) {
    return { ok: false, error: "食品を選択してください。" };
  }
  const foodId = Number(input.foodIdRaw);
  if (!Number.isInteger(foodId) || foodId <= 0) {
    return { ok: false, error: "食品の指定が不正です。" };
  }

  let quantity = 1;
  if (input.quantityRaw) {
    const result = parsePositiveNumber(
      input.quantityRaw,
      "数量は正の数で入力してください。",
    );
    if (!result.ok) {
      return result;
    }
    quantity = result.data;
  }

  return {
    ok: true,
    data: {
      recordedAt: input.recordedAt,
      mealType: input.mealTypeRaw as MealType,
      foodId,
      quantity,
      memo: input.memo || null,
    },
  };
}
