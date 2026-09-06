import { addDaysISODate } from "@/lib/date";

// calorie-adjustment.tsの月次換算(1か月=30日)と揃える。
const DAYS_PER_MONTH = 30;

export type WeightProjectionInput = {
  latestWeightKg: number;
  latestDate: string;
  monthlyRateKg: number;
  targetWeightKg: number;
};

export type WeightProjection = {
  achievementDate: string;
  monthsNeeded: number;
};

// 現在の体重・ペース(1か月あたりの目標体重変化)から、目標体重に到達する日付を概算する。
// ペースが目標に向かっていない(0、または目標と逆方向)場合はnullを返す。
export function projectWeightAchievement({
  latestWeightKg,
  latestDate,
  monthlyRateKg,
  targetWeightKg,
}: WeightProjectionInput): WeightProjection | null {
  const diff = targetWeightKg - latestWeightKg;

  if (monthlyRateKg === 0) {
    return diff === 0 ? { achievementDate: latestDate, monthsNeeded: 0 } : null;
  }

  // "|| 0"は、diffが0のときに生じる-0を+0に正規化するため。
  const monthsNeeded = diff / monthlyRateKg || 0;
  if (monthsNeeded < 0) {
    return null;
  }

  const daysNeeded = Math.round(monthsNeeded * DAYS_PER_MONTH);
  return {
    achievementDate: addDaysISODate(latestDate, daysNeeded),
    monthsNeeded,
  };
}
