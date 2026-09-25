import { getWgerExercise } from "@/lib/wger/data";
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
// wgerIdは未選択(空文字)ならnull。選択肢は取り込み済みのwger種目
// (src/lib/wger/data.ts)に限るため、それ以外のIDは受け付けない。
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
    if (!Number.isInteger(parsed) || !getWgerExercise(parsed)) {
      return { ok: false, error: "wgerの種目を一覧から選択してください。" };
    }
    wgerId = parsed;
  }

  return { ok: true, data: { name, aliases, wgerId } };
}
