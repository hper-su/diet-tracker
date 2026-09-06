// 出典: 厚生労働省「健康づくりのための身体活動・運動ガイド2023」
// (生活活動・運動のメッツ表)。メッツ・時(METs×時間)×体重(kg)×1.05 で
// 消費カロリーを概算する、日本国内で広く使われる換算式。
const EXERCISE_KCAL_COEFFICIENT = 1.05;

export type ExerciseKcalInput = {
  mets: number;
  weightKg: number;
  durationMin: number;
};

export function calculateExerciseKcal({
  mets,
  weightKg,
  durationMin,
}: ExerciseKcalInput): number {
  const hours = durationMin / 60;
  return mets * weightKg * hours * EXERCISE_KCAL_COEFFICIENT;
}
