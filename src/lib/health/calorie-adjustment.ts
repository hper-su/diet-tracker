// 体脂肪1kgあたりの熱量の概算値。
export const KCAL_PER_KG_BODY_WEIGHT = 7200;

const DAYS_PER_MONTH = 30;

// 1か月あたりの目標体重変化(kg)を、1日あたりの摂取カロリー調整量に変換する。
// プラス値(増量目標)は摂取量を増やし、マイナス値(減量目標)は減らす方向になる。
export function calculateDailyCalorieAdjustment(
  monthlyWeightChangeKg: number,
): number {
  return (monthlyWeightChangeKg * KCAL_PER_KG_BODY_WEIGHT) / DAYS_PER_MONTH;
}
