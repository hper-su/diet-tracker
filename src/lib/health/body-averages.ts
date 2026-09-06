export type BodyAverage = {
  heightCm: number;
  weightKg: number;
};

// 成人の平均的な身長・体重の目安値(概算)。新規登録時の初期値として使用し、
// トレーナーが実測値に応じて自由に上書きできる。
const BODY_AVERAGES_BY_GENDER: Record<string, BodyAverage> = {
  male: { heightCm: 171.0, weightKg: 68.0 },
  female: { heightCm: 158.0, weightKg: 53.0 },
};

export function getBodyAverageForGender(gender: string): BodyAverage | null {
  return BODY_AVERAGES_BY_GENDER[gender] ?? null;
}
