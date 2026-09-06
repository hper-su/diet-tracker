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
