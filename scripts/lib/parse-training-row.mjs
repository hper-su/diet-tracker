import {
  isIllegibleExerciseName,
  splitTrailingNote,
  splitSupersetName,
  normalizeExerciseName,
  UNRESOLVED_EXERCISE_NAMES,
} from "./exercise-normalize.mjs";

// Excelの1行(1種目ぶんの記録)を、trainingLogsに書き込む1〜2件のエントリへ
// 変換する(スーパーセット行は2件になる)。読み取り不能な行はnullを返す
// (呼び出し側で除外する)。
//
// 戻り値の各要素:
//   exerciseName: 記録する種目名(正規化済み。UNRESOLVED_EXERCISE_NAMESに
//                 該当する場合は正規化せずそのまま)
//   resolved: falseの場合、種目マスタとは紐付けない(exerciseIdはnullのまま)
//   memo: 元のメモ欄の内容に、種目名末尾の(...)注記があれば連結したもの
export function parseExerciseCell(rawExerciseName, rawMemo) {
  if (isIllegibleExerciseName(rawExerciseName)) {
    return null;
  }

  const { name, note } = splitTrailingNote(rawExerciseName);
  const memoParts = [rawMemo?.trim(), note].filter((part) => part);
  const memo = memoParts.length > 0 ? memoParts.join(" / ") : null;

  return splitSupersetName(name).map((part) => {
    if (UNRESOLVED_EXERCISE_NAMES.has(part)) {
      return { exerciseName: part, resolved: false, memo };
    }
    return { exerciseName: normalizeExerciseName(part), resolved: true, memo };
  });
}
