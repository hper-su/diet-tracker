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
