// 目的別の理想的なPFC(たんぱく質・脂質・炭水化物)バランス。
// 各比率は摂取目標カロリーに占める割合(合計100%)。
export type PFCPreset = "health" | "diet" | "low_carb" | "bulk_up";

export type PFCPresetInfo = {
  label: string;
  proteinRatio: number;
  fatRatio: number;
  carbRatio: number;
  description: string;
};

export const PFC_PRESETS: Record<PFCPreset, PFCPresetInfo> = {
  health: {
    label: "健康維持",
    proteinRatio: 0.15,
    fatRatio: 0.25,
    carbRatio: 0.6,
    description:
      "厚生労働省が推奨する一般的な比率。バランスよく摂取することで、健康を維持できます。",
  },
  diet: {
    label: "ダイエット",
    proteinRatio: 0.25,
    fatRatio: 0.25,
    carbRatio: 0.5,
    description:
      "糖質を主なエネルギー源としつつ、たんぱく質・脂質もバランスよく摂る比率。極端な制限をせず、無理なく続けやすい配分です。",
  },
  low_carb: {
    label: "糖質制限",
    proteinRatio: 0.4,
    fatRatio: 0.4,
    carbRatio: 0.2,
    description:
      "糖質を大幅に減らし、脂質をエネルギー源にする比率。短期間で結果が出やすい一方、体への負担も大きいので注意。",
  },
  bulk_up: {
    label: "バルクアップ",
    proteinRatio: 0.25,
    fatRatio: 0.25,
    carbRatio: 0.5,
    description:
      "筋肉量を増やすには摂取カロリーを上げ、タンパク質と糖質を多めに取ります。トレーニングと組み合わせが必須。",
  },
};

export const DEFAULT_PFC_PRESET: PFCPreset = "health";

export function isPFCPreset(value: string): value is PFCPreset {
  return value in PFC_PRESETS;
}
