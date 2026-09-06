export type Gender = "male" | "female" | "other";

export type BMRInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
};

// 基礎代謝量(kcal/日)を Mifflin-St Jeor 式で算出する。
// 男性: 10×体重+6.25×身長-5×年齢+5
// 女性: 10×体重+6.25×身長-5×年齢-161
// その他: 性別未特定のため、上記2式の定数項の平均を用いた概算値。
export function calculateBMR({
  weightKg,
  heightCm,
  age,
  gender,
}: BMRInput): number | null {
  if (!(weightKg > 0) || !(heightCm > 0) || !(age > 0)) {
    return null;
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === "male") {
    return base + 5;
  }
  if (gender === "female") {
    return base - 161;
  }
  return base + (5 + -161) / 2;
}
