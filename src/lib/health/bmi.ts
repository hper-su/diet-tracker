export type BMIInput = {
  weightKg: number;
  heightCm: number;
};

export function calculateBMI({ weightKg, heightCm }: BMIInput): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // 小数点第2位で切り捨てる(四捨五入はしない)。
  return Math.floor(bmi * 100) / 100;
}

// 「普通体重」の目安としてよく使われるBMIの範囲(18〜25)。
export const NORMAL_BMI_MIN = 18;
export const NORMAL_BMI_MAX = 25;
export const NORMAL_BMI_MID = (NORMAL_BMI_MIN + NORMAL_BMI_MAX) / 2;

export type NormalWeightRange = {
  minKg: number;
  midKg: number;
  maxKg: number;
};

// 身長から、BMIが18〜25(普通体重の目安)になる体重の範囲と、
// その中間地点(BMI21.5)の体重を算出する。
export function calculateNormalWeightRange(
  heightCm: number,
): NormalWeightRange | null {
  if (!(heightCm > 0)) {
    return null;
  }

  const heightM = heightCm / 100;
  const heightSquared = heightM * heightM;
  const weightAtBMI = (bmi: number) =>
    Math.round(bmi * heightSquared * 10) / 10;

  return {
    minKg: weightAtBMI(NORMAL_BMI_MIN),
    midKg: weightAtBMI(NORMAL_BMI_MID),
    maxKg: weightAtBMI(NORMAL_BMI_MAX),
  };
}
