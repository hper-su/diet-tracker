// 過去データ移行(scripts/import-training-logs.mjs)専用の、生の種目名
// (Excelの「種目」列そのもの)を種目マスタの正規名へ正規化するためのルール集。
// アプリ本体の種目マスタCRUD(src/lib/db/exercises.ts)には依存しない。

// 完全に読み取り不能と付記された行(例:「(判読不能)」「(判読不能:ド)」)は
// 種目として登録しない(除外対象)。
export function isIllegibleExerciseName(raw) {
  return /^[((]判読不能/.test(raw.trim());
}

// 「ラットプル(ドロップセット)」「ヒップスラスト(未達成)」のような、種目名末尾の
// (...)注記を取り出す。注記は種目名からは取り除き、その行のメモへ回す
// (情報を失わないため)。「(判読不能)」はisIllegibleExerciseNameで別途除外するため
// ここでは対象外。
const TRAILING_NOTE_PATTERN = /^(.*\S)\s*[((]([^()（）]+)[))]\s*$/;

export function splitTrailingNote(raw) {
  const trimmed = raw.trim();
  const match = trimmed.match(TRAILING_NOTE_PATTERN);
  if (!match) return { name: trimmed, note: null };
  const [, name, note] = match;
  return { name: name.trim(), note: note.trim() || null };
}

// 1セルに「・」区切りで2種目分が入っている行(スーパーセット、例:
// 「ケーブルカール・ケーブルプレスダウン」)を2種目に分割する。
export function splitSupersetName(name) {
  if (!name.includes("・")) return [name];
  return name
    .split("・")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// 表記ゆれ・略語の正規化マップ(完全一致)。ここに無い名前はそのまま種目名として扱う。
// キーは splitTrailingNote() で末尾の注記を取り除いた後の名前。
// 「明確に統合してよいもの」として、同じExcel内に短縮形とフル表記の両方が
// 実在するペアのみを対象にしている(独自の推測による展開は行わない)。
export const EXERCISE_ALIAS_MAP = new Map([
  ["ラットプル", "ラットプルダウン"],
  ["ブルガリアン", "ブルガリアンスクワット"],
  ["ルーマニアン", "ルーマニアデットリフト"],
  ["ルーマニアンデッドリフト", "ルーマニアデットリフト"],
  ["デットバック", "デッドバック"], // 表記ゆれ(ユーザー指示によりデッドバックへ統一)
  ["ブレスダウン", "プレスダウン"], // 誤入力(表記ゆれ)
  ["ナロー", "ナロープレス"],
  ["ショルダー", "ショルダープレス"],
  ["ベンチ", "ベンチプレス"],
  ["スティフレッグ", "スティフレッグドデットリフト"],
  ["ダンベルスイングSQ", "ダンベルスイングスクワット"],
  ["バンドステップ×", "バンドステップ"],
  ["プランクツイスト", "ツイストプランク"],
]);

// 「インクライン」単体(何のインクライン種目か特定できない行)は、正規化・種目
// マスタへの紐付けをせず、記録上はそのまま「インクライン」という文字列で残す
// (ユーザー指示: 一旦インクラインにしておく。マスタ側にはインクラインヒップスラスト
// /フライ/プレス/カールを別々に登録しておく)。
export const UNRESOLVED_EXERCISE_NAMES = new Set(["インクライン"]);

export function normalizeExerciseName(name) {
  return EXERCISE_ALIAS_MAP.get(name) ?? name;
}
