export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_FAT = 9;
export const KCAL_PER_G_CARB = 4;

export type PFCBalanceInput = {
  targetIntakeCalories: number;
  proteinRatio: number;
  fatRatio: number;
  carbRatio: number;
};

export type PFCBalance = {
  proteinG: number;
  proteinKcal: number;
  fatG: number;
  fatKcal: number;
  carbG: number;
  carbKcal: number;
};

// 摂取目標カロリーと、目的別プリセットのPFC比率から
// たんぱく質・脂質・炭水化物の目安量を算出する。
export function calculatePFCBalance({
  targetIntakeCalories,
  proteinRatio,
  fatRatio,
  carbRatio,
}: PFCBalanceInput): PFCBalance | null {
  if (!(targetIntakeCalories > 0)) {
    return null;
  }

  const proteinKcal = targetIntakeCalories * proteinRatio;
  const fatKcal = targetIntakeCalories * fatRatio;
  const carbKcal = targetIntakeCalories * carbRatio;

  return {
    proteinG: proteinKcal / KCAL_PER_G_PROTEIN,
    proteinKcal,
    fatG: fatKcal / KCAL_PER_G_FAT,
    fatKcal,
    carbG: carbKcal / KCAL_PER_G_CARB,
    carbKcal,
  };
}

export type MacroGrams = {
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type MacroRatioPercent = {
  proteinPct: number;
  fatPct: number;
  carbPct: number;
};

// 実際に記録された各栄養素のグラム数(食事記録・普段の3食の合計など)から、
// カロリーベースのPFC比率(%、合計100)を算出する。まだ何も記録されておらず
// 合計カロリーが0の場合はnullを返す。
export function calculateMacroRatioPercent({
  proteinG,
  fatG,
  carbG,
}: MacroGrams): MacroRatioPercent | null {
  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const carbKcal = carbG * KCAL_PER_G_CARB;
  const totalKcal = proteinKcal + fatKcal + carbKcal;

  if (!(totalKcal > 0)) {
    return null;
  }

  return {
    proteinPct: (proteinKcal / totalKcal) * 100,
    fatPct: (fatKcal / totalKcal) * 100,
    carbPct: (carbKcal / totalKcal) * 100,
  };
}
