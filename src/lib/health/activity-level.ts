// 身体活動レベルとメンテナンスカロリー算出用の活動係数。
// 出典: Frankenfield D, et al. (2005) Journal of the American Dietetic Association
// (calzen.ai の TDEE計算式 https://calzen.ai/ja/tdee-calculator/ に準拠)
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type ActivityLevelInfo = {
  label: string;
  factor: number;
  description: string;
};

export const ACTIVITY_LEVELS: Record<ActivityLevel, ActivityLevelInfo> = {
  sedentary: {
    label: "座りがち",
    factor: 1.2,
    description: "運動なし、デスクワーク中心",
  },
  light: {
    label: "やや活動的",
    factor: 1.375,
    description: "軽い運動を週1〜3日",
  },
  moderate: {
    label: "適度に活動的",
    factor: 1.55,
    description: "中程度の運動を週3〜5日",
  },
  active: {
    label: "かなり活動的",
    factor: 1.725,
    description: "激しい運動を週6〜7日",
  },
  very_active: {
    label: "非常に活動的",
    factor: 1.9,
    description: "非常にハードな運動、肉体労働",
  },
};

export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = "moderate";

export const ACTIVITY_LEVEL_SOURCE =
  "出典: Frankenfield D, et al. (2005) Journal of the American Dietetic Association(calzen.ai のTDEE計算式に準拠)";

export function isActivityLevel(value: string): value is ActivityLevel {
  return value in ACTIVITY_LEVELS;
}

export function getActivityFactor(level: ActivityLevel): number {
  return ACTIVITY_LEVELS[level].factor;
}
