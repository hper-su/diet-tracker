import { parsePositiveNumber, type ValidationResult } from "./result";

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type UsualMealType = (typeof VALID_MEAL_TYPES)[number];

export type UsualMealInput = {
  mealTypeRaw: string;
  foodIdRaw: string;
  quantityRaw: string;
};

export type UsualMealData = {
  mealType: UsualMealType;
  foodId: number;
  quantity: number;
};

export function validateUsualMealInput(
  input: UsualMealInput,
): ValidationResult<UsualMealData> {
  if (!VALID_MEAL_TYPES.includes(input.mealTypeRaw as UsualMealType)) {
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
    data: { mealType: input.mealTypeRaw as UsualMealType, foodId, quantity },
  };
}
