// 筋トレ記録の重さ・回数は「25,20」「10-8-6」のようにセットごとの値をそのまま
// 自由記述で残しているため(src/lib/db/training-logs.ts参照)、推移グラフに
// 使うには代表値を1つ取り出す必要がある。ここでは「その日のうち最も重い/多い値」
// (=そのセットの中でのピーク)を採用する(トレーニング強度の推移を追う目的に合う)。
export function parsePeakNumber(text: string): number | null {
  // 保存前に半角へそろえる(validation/training-log.ts)ようにしたが、それ以前に
  // 全角で保存された記録も読み取れるよう、ここでも半角にしてから数値を拾う。
  const matches = text.normalize("NFKC").match(/\d+(?:\.\d+)?/g);
  if (!matches) return null;
  const numbers = matches.map(Number).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}
