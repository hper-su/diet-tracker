// 体重・体脂肪率は別々の日に記録されることがあるため、それぞれ独立して
// 「指定フィールドが入力されている直近の記録」を探す必要がある。
// この探索ロジックを共通化する(異なる日付同士の比較は呼び出し側の配列の
// 並び順に依存しない)。同一日付の記録が複数ある場合は、配列内で後にある
// ものを優先する(listMeasurementsはrecorded_at asc, id ascで返すため、
// 同日であれば最後に登録した記録が採用される)。
export function findLatestNonNull<
  T extends { recordedAt: string },
  K extends keyof T,
>(records: T[], field: K): T | null {
  let latest: T | null = null;

  for (const record of records) {
    if (record[field] === null || record[field] === undefined) {
      continue;
    }
    if (!latest || record.recordedAt >= latest.recordedAt) {
      latest = record;
    }
  }

  return latest;
}
