// 過去データ移行(scripts/import-training-logs.mjs)専用。お客様ごとのトレーニング
// セッション(古い順、1..N)に、体重測定記録の日付を古い順に割り当てる。
//
// 直近のセッション(最新)に直近の測定日を割り当て、そこから遡っていく
// (ユーザー指示: 直近の体重測定日から入れる)。測定記録がセッション数より
// 少ない場合、割り当てられない古い方のセッションはnull(日付不明)にする。
//
// sessionCount: そのお客様のトレーニングセッション数
// measurementDates: そのお客様の体重測定日(古い順にソート済みの配列、YYYY-MM-DD)
// 戻り値: 長さsessionCountの配列。index 0が最も古いセッション、末尾が最新セッション。
export function assignTrainingSessionDates(sessionCount, measurementDates) {
  if (sessionCount <= 0) return [];
  const dates = new Array(sessionCount).fill(null);
  // slice(-0)は0ではなく配列全体を返すJSの仕様上の罠があるため、上のガードで
  // sessionCount === 0 を先に弾いてから使う。
  const usable = measurementDates.slice(-sessionCount);
  const offset = sessionCount - usable.length;
  for (let i = 0; i < usable.length; i++) {
    dates[offset + i] = usable[i];
  }
  return dates;
}
