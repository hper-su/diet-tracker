import type { ValidationResult } from "./result";

export type ExerciseInput = {
  name: string;
  aliasesRaw: string;
  wgerIdRaw: string;
};

export type ExerciseData = {
  name: string;
  aliases: string[];
  wgerId: number | null;
};

// 別名はカンマ(全角・半角)区切りで複数入力できるようにする。
// wgerIdは未選択(空文字)ならnull。1以上の整数だけを受け付ける。取り込み済みの
// wger種目(src/lib/wger/data.ts)に無いIDも、保存済みの値を消さないために通す
// (画面のプルダウンには、その場合も現在の値が選択肢として残る)。
export function validateExerciseInput(input: ExerciseInput): ValidationResult<ExerciseData> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "種目名を入力してください。" };
  }

  const aliases = Array.from(
    new Set(
      input.aliasesRaw
        .split(/[,、]/)
        .map((alias) => alias.trim())
        .filter((alias) => alias.length > 0),
    ),
  );

  const wgerIdRaw = input.wgerIdRaw.trim();
  let wgerId: number | null = null;
  if (wgerIdRaw) {
    const parsed = Number(wgerIdRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: "wgerの種目を一覧から選択してください。" };
    }
    wgerId = parsed;
  }

  return { ok: true, data: { name, aliases, wgerId } };
}
