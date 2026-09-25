// wgerの種目画像の並びから、フォーム画像として表示するものを選ぶ。
// wgerは種目ごとに「-1」「-2」(開始/終了姿勢のイラスト2枚組)のほか、
// 別の投稿者の写真などを同じ配列に混ぜて返す(例: -1, 写真, -2 の順)。
// そのまま先頭2枚を使うと、組になっていない画像が並んでしまう。
// 「-N.png」形式の連番画像が2枚以上あれば、その連番順の組を優先する。

const NUMBERED_IMAGE = /-(\d+)\.(?:png|jpe?g|webp)(?:\.|$)/i;

export function pickFormImages(urls) {
  const numbered = urls
    .map((url) => ({ url, n: Number(url.match(NUMBERED_IMAGE)?.[1]) }))
    .filter((entry) => Number.isFinite(entry.n));
  if (numbered.length < 2) return urls;
  return numbered.sort((a, b) => a.n - b.n).map((entry) => entry.url);
}
