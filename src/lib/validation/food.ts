import type { ValidationResult } from "./result";

export type FoodInput = {
  category: string;
  name: string;
  servingLabel: string;
  kcalRaw: string;
  proteinRaw: string;
  fatRaw: string;
  carbRaw: string;
};

export type FoodData = {
  category: string;
  name: string;
  servingLabel: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

function parseNonNegative(
  raw: string,
  label: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (!raw) {
    return { ok: true, value: 0 };
  }
  const parsed = Number(raw);
  if (!(parsed >= 0)) {
    return { ok: false, error: `${label}は0以上の数で入力してください。` };
  }
  return { ok: true, value: parsed };
}

export function validateFoodInput(input: FoodInput): ValidationResult<FoodData> {
  const category = input.category.trim();
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "食品名を入力してください。" };
  }

  const servingLabel = input.servingLabel.trim() || "1人前";

  if (!input.kcalRaw) {
    return { ok: false, error: "カロリー(kcal)を入力してください。" };
  }
  const kcal = Number(input.kcalRaw);
  if (!(kcal >= 0)) {
    return { ok: false, error: "カロリーは0以上の数で入力してください。" };
  }

  const protein = parseNonNegative(input.proteinRaw, "たんぱく質");
  if (!protein.ok) return protein;

  const fat = parseNonNegative(input.fatRaw, "脂質");
  if (!fat.ok) return fat;

  const carb = parseNonNegative(input.carbRaw, "炭水化物");
  if (!carb.ok) return carb;

  return {
    ok: true,
    data: {
      category,
      name,
      servingLabel,
      kcal,
      proteinG: protein.value,
      fatG: fat.value,
      carbG: carb.value,
    },
  };
}
