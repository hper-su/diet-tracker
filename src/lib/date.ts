export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 「今日」はローカルの暦日で判定する。toISODate()(=toISOString())をそのまま
// 使うとUTCの日付になってしまい、日本(UTC+9)では0時〜8時台に「今日」が
// 実際より1日前になる(例: 朝7時に食事記録を開くと前日の日付になる)バグが
// あったため、Dateのローカルgetter(getFullYear/getMonth/getDate)から組み立てる。
export function todayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// date-only文字列(YYYY-MM-DD)にUTC暦日で日数を加算する。
// ローカルタイムゾーンによる日付のズレを避けるため、age.ts等と同様にUTCで計算する。
export function addDaysISODate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

// fromDateからtoDateまで(両端含む)の日付文字列を1日刻みで列挙する。
// 週次・月次サマリーで、記録がない日も含めた連続した日付軸を作るのに使う。
export function listISODateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  let current = fromDate;
  while (current <= toDate) {
    dates.push(current);
    current = addDaysISODate(current, 1);
  }
  return dates;
}
