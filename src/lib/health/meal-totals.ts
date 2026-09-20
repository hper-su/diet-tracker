export type MacroAmounts = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// 食品マスタの基準量あたりの栄養価に数量を掛けて、記録1件分の栄養価を算出する。
export function calculateMealLogAmounts(
  base: MacroAmounts,
  quantity: number,
): MacroAmounts {
  return {
    kcal: base.kcal * quantity,
    proteinG: base.proteinG * quantity,
    fatG: base.fatG * quantity,
    carbG: base.carbG * quantity,
  };
}

// 1日分の食事記録を合計する。
export function sumMealLogAmounts(entries: MacroAmounts[]): MacroAmounts {
  return entries.reduce(
    (total, entry) => ({
      kcal: total.kcal + entry.kcal,
      proteinG: total.proteinG + entry.proteinG,
      fatG: total.fatG + entry.fatG,
      carbG: total.carbG + entry.carbG,
    }),
    { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  );
}

export type DailyMealTotal = MacroAmounts & { recordedAt: string };

// 記録がある日だけのtotalsを、datesで指定した連続した日付軸に合わせて
// 0埋めする。週次・月次サマリーのグラフで日付が飛ばないようにするため。
export function fillDailyMealTotals(
  totals: DailyMealTotal[],
  dates: string[],
): DailyMealTotal[] {
  const byDate = new Map(totals.map((total) => [total.recordedAt, total]));
  return dates.map(
    (recordedAt) =>
      byDate.get(recordedAt) ?? {
        recordedAt,
        kcal: 0,
        proteinG: 0,
        fatG: 0,
        carbG: 0,
      },
  );
}

export type AdjustmentMode = "total" | "delta";

const round1 = (n: number) => Math.round(n * 10) / 10;

// 1日の合計を手入力で直すための「調整行」の量を算出する。
// baseは調整行を除いた品目の合計、currentは調整行を含む現在の合計。
// mode="total": inputsは修正後の1日の合計(空欄=品目合計のまま=調整なし)。
// mode="delta": inputsは現在の合計からの増減(負数可、空欄=現在のまま)。
// 戻り値は「品目合計に足すと狙いの合計になる差分」(負数になりうる)。
export function calculateDailyAdjustment(
  base: MacroAmounts,
  current: MacroAmounts,
  inputs: Record<keyof MacroAmounts, number | null>,
  mode: AdjustmentMode,
): MacroAmounts {
  const keys = ["kcal", "proteinG", "fatG", "carbG"] as const;
  const result = { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 };
  for (const key of keys) {
    const input = inputs[key];
    if (input === null) {
      result[key] = mode === "total" ? 0 : round1(current[key] - base[key]);
      continue;
    }
    const target = mode === "total" ? input : current[key] + input;
    result[key] = round1(target - base[key]);
  }
  return result;
}
