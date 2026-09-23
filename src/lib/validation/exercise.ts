import type { ValidationResult } from "./result";

export type ExerciseInput = {
  name: string;
  aliasesRaw: string;
};

export type ExerciseData = {
  name: string;
  aliases: string[];
};

// 別名はカンマ(全角・半角)区切りで複数入力できるようにする。
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

  return { ok: true, data: { name, aliases } };
}
