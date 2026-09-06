// UTCの暦日ベースで計算する(date-only文字列はUTC0時としてパースされるため、
// ローカルタイムゾーンによる日付のズレを避ける)。
// todayを省略した場合の既定値は「今」という時刻そのもの(date-only文字列ではない)なので、
// UTCのgetterでそのまま読むとサーバーのタイムゾーンがUTCより進んでいる場合(例: JST)に
// 暦日が1日遅れうる。ローカルの暦日をUTC 0時のDateとして正規化してから既定値にする。
function todayAsUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function calculateAge(
  birthdate: string,
  today: Date = todayAsUtcMidnight(),
): number | null {
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() &&
      today.getUTCDate() >= birth.getUTCDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}
