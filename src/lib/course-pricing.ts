// 「1回あたりのコース料金」ページの内容。

export type CourseFee = {
  monthsLabel: string;
  sessions: number;
  totalFee: number;
  perSession: number;
};

export type CoursePlan = {
  key: string;
  name: string;
  fees: CourseFee[];
  note: string;
};

export const COURSE_PLANS: CoursePlan[] = [
  {
    key: "twice-weekly",
    name: "週2回コース(スタンダード)",
    fees: [
      { monthsLabel: "2ヶ月", sessions: 16, totalFee: 85800, perSession: 5362 },
      { monthsLabel: "3ヶ月", sessions: 24, totalFee: 128700, perSession: 5362 },
      { monthsLabel: "4ヶ月", sessions: 32, totalFee: 171600, perSession: 5362 },
      { monthsLabel: "5ヶ月", sessions: 40, totalFee: 214500, perSession: 5362 },
      { monthsLabel: "6ヶ月", sessions: 48, totalFee: 257400, perSession: 5362 },
    ],
    note: "週2回コースはどの期間でも1回5,362円で完全に一定です。",
  },
  {
    key: "once-weekly",
    name: "週1コース",
    fees: [
      { monthsLabel: "2ヶ月", sessions: 8, totalFee: 46200, perSession: 5775 },
      { monthsLabel: "3ヶ月", sessions: 12, totalFee: 68200, perSession: 5683 },
      { monthsLabel: "4ヶ月", sessions: 16, totalFee: 89650, perSession: 5603 },
      { monthsLabel: "5ヶ月", sessions: 20, totalFee: 110000, perSession: 5500 },
      { monthsLabel: "6ヶ月", sessions: 24, totalFee: 130900, perSession: 5454 },
    ],
    note: "週1コースは期間が長くなるほど1回あたりが下がっていきます(5,775円→5,454円)。",
  },
];

export type AddOnFee = {
  sessions: number;
  totalFee: number;
  perSession: number;
};

export const ADDON_FEES: AddOnFee[] = [
  { sessions: 3, totalFee: 25300, perSession: 8433 },
  { sessions: 5, totalFee: 36300, perSession: 7260 },
  { sessions: 10, totalFee: 68200, perSession: 6820 },
];

export const ADDON_NOTE =
  "回数が増えるほど1回あたりの単価が下がっています。";

export const PRICING_FOOTNOTE =
  "入会金・プロテインは含めていません(プロテインは変動なしのため除外、入会金11,000円は初回のみのため)。";

export const PRICING_FORMULA_EXAMPLE =
  "計算式: コース料金 ÷ 回数 = 1回あたりの料金(小数点以下切り捨て)。例: 週2回コース・2ヶ月の場合 85,800円 ÷ 16回 = 5,362円";
