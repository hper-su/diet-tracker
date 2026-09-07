// GI値(グリセミック・インデックス)の早見データ。
// ブドウ糖(グルコース)を基準(GI=100)とした国際的な分類基準に基づく。
// 個々の数値は、複数の公表資料で広く紹介されている代表値を参考にした目安であり、
// 品種・熟度・調理法・測定条件によって幅があることに注意。栄養指導の参考情報として
// 利用し、より厳密な値が必要な場合は最新の学術資料を参照すること。

export type GILevel = "high" | "medium" | "low";

export type GIFood = {
  category: string;
  name: string;
  giValue: number;
};

// 国際的な分類基準(ブドウ糖=100を基準)。
export const GI_HIGH_THRESHOLD = 70; // これ以上が高GI
export const GI_MEDIUM_THRESHOLD = 56; // これ以上high未満が中GI、これ未満が低GI

export function getGILevel(giValue: number): GILevel {
  if (giValue >= GI_HIGH_THRESHOLD) return "high";
  if (giValue >= GI_MEDIUM_THRESHOLD) return "medium";
  return "low";
}

export const GI_LEVEL_LABELS: Record<GILevel, string> = {
  high: "高GI",
  medium: "中GI",
  low: "低GI",
};

// 表示順(カテゴリの並び)。
export const GI_CATEGORY_ORDER = [
  "穀物・パン・麺",
  "いも類",
  "野菜",
  "果物",
  "乳製品",
  "大豆製品",
  "種実類",
  "菓子・デザート",
  "飲料",
  "調味料",
] as const;

export const GI_FOODS: GIFood[] = [
  // 穀物・パン・麺
  { category: "穀物・パン・麺", name: "ブドウ糖", giValue: 100 },
  { category: "穀物・パン・麺", name: "フランスパン", giValue: 93 },
  { category: "穀物・パン・麺", name: "食パン", giValue: 91 },
  { category: "穀物・パン・麺", name: "もち", giValue: 85 },
  { category: "穀物・パン・麺", name: "白米", giValue: 84 },
  { category: "穀物・パン・麺", name: "うどん", giValue: 80 },
  { category: "穀物・パン・麺", name: "コーンフレーク", giValue: 75 },
  { category: "穀物・パン・麺", name: "スパゲッティ(ゆで)", giValue: 65 },
  { category: "穀物・パン・麺", name: "中華麺", giValue: 61 },
  { category: "穀物・パン・麺", name: "そば", giValue: 59 },
  { category: "穀物・パン・麺", name: "ライ麦パン", giValue: 58 },
  { category: "穀物・パン・麺", name: "玄米", giValue: 56 },
  { category: "穀物・パン・麺", name: "オートミール", giValue: 55 },
  { category: "穀物・パン・麺", name: "全粒粉パン", giValue: 50 },

  // いも類
  { category: "いも類", name: "マッシュポテト", giValue: 85 },
  { category: "いも類", name: "長いも", giValue: 75 },
  { category: "いも類", name: "じゃがいも(ゆで)", giValue: 68 },
  { category: "いも類", name: "里芋", giValue: 64 },
  { category: "いも類", name: "さつまいも", giValue: 55 },

  // 野菜
  { category: "野菜", name: "とうもろこし", giValue: 70 },
  { category: "野菜", name: "かぼちゃ", giValue: 65 },
  { category: "野菜", name: "にんじん", giValue: 39 },
  { category: "野菜", name: "トマト", giValue: 30 },
  { category: "野菜", name: "キャベツ", giValue: 26 },
  { category: "野菜", name: "なす", giValue: 25 },
  { category: "野菜", name: "ブロッコリー", giValue: 25 },
  { category: "野菜", name: "レタス", giValue: 23 },
  { category: "野菜", name: "きゅうり", giValue: 23 },
  { category: "野菜", name: "もやし", giValue: 22 },
  { category: "野菜", name: "ほうれん草", giValue: 15 },

  // 果物
  { category: "果物", name: "すいか", giValue: 76 },
  { category: "果物", name: "パイナップル", giValue: 66 },
  { category: "果物", name: "バナナ", giValue: 55 },
  { category: "果物", name: "キウイ", giValue: 53 },
  { category: "果物", name: "ぶどう", giValue: 46 },
  { category: "果物", name: "桃", giValue: 41 },
  { category: "果物", name: "りんご", giValue: 36 },
  { category: "果物", name: "洋なし", giValue: 38 },
  { category: "果物", name: "みかん", giValue: 33 },
  { category: "果物", name: "いちご", giValue: 29 },

  // 乳製品
  { category: "乳製品", name: "アイスクリーム", giValue: 65 },
  { category: "乳製品", name: "スキムミルク", giValue: 32 },
  { category: "乳製品", name: "チーズ", giValue: 27 },
  { category: "乳製品", name: "牛乳", giValue: 27 },
  { category: "乳製品", name: "ヨーグルト(無糖)", giValue: 25 },

  // 大豆製品
  { category: "大豆製品", name: "豆腐", giValue: 42 },
  { category: "大豆製品", name: "納豆", giValue: 33 },
  { category: "大豆製品", name: "大豆(ゆで)", giValue: 30 },
  { category: "大豆製品", name: "豆乳", giValue: 23 },

  // 種実類
  { category: "種実類", name: "ピーナッツ", giValue: 15 },

  // 菓子・デザート
  { category: "菓子・デザート", name: "はちみつ", giValue: 88 },
  { category: "菓子・デザート", name: "ドーナツ", giValue: 86 },
  // 脂質を多く含むため、糖分の割に糖の吸収が緩やかになり、GI値は見た目ほど高くない。
  { category: "菓子・デザート", name: "チョコレート", giValue: 40 },
  { category: "菓子・デザート", name: "クッキー", giValue: 77 },
  { category: "菓子・デザート", name: "ポテトチップス", giValue: 60 },
  { category: "菓子・デザート", name: "ポップコーン", giValue: 72 },

  // 飲料
  { category: "飲料", name: "スポーツドリンク", giValue: 78 },
  { category: "飲料", name: "コーラ", giValue: 43 },
  { category: "飲料", name: "オレンジジュース(果汁100%)", giValue: 42 },

  // 調味料
  { category: "調味料", name: "上白糖", giValue: 109 },
  { category: "調味料", name: "メープルシロップ", giValue: 73 },
];

// 「同じ白米でも、組み合わせる食品によってGI値が変わる」ことを示す実例。
export type GICombinationExample = {
  combination: string;
  giValue: number;
};

export const GI_COMBINATION_EXAMPLES: GICombinationExample[] = [
  { combination: "白米のみ", giValue: 84 },
  { combination: "白米 + 低脂肪乳", giValue: 69 },
  { combination: "白米 + インスタント味噌汁", giValue: 61 },
  { combination: "白米 + ヨーグルトを先に食べる", giValue: 59 },
];

// 出典: 日本糖尿病学会「糖尿病食事療法のための食品交換表」の間食目安量の例。
export type SnackGuide = {
  name: string;
  amount: string;
};

export const SNACK_GUIDE: SnackGuide[] = [
  { name: "みかん", amount: "中2個" },
  { name: "りんご", amount: "中1/2個" },
  { name: "ぶどう", amount: "10〜15粒" },
];
