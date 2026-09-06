import { parsePositiveNumber, type ValidationResult } from "./result";

export const CUSTOM_EXERCISE_VALUE = "custom";

// フォーム側の頻度入力欄のmax(1日2回まで=週14回)と揃え、サーバー側でも
// 非現実的な値(二重計上や入力ミス)を弾く。
const MAX_FREQUENCY_PER_WEEK = 14;

export type UsualExerciseInput = {
  exerciseIdRaw: string;
  customNameRaw: string;
  customMetsRaw: string;
  durationMinRaw: string;
  frequencyPerWeekRaw: string;
};

export type UsualExerciseData = {
  exerciseId: number | null;
  customName: string | null;
  customMets: number | null;
  durationMin: number;
  frequencyPerWeek: number;
};

export function validateUsualExerciseInput(
  input: UsualExerciseInput,
): ValidationResult<UsualExerciseData> {
  if (!input.exerciseIdRaw) {
    return { ok: false, error: "運動の種目を選択してください。" };
  }

  let exerciseId: number | null = null;
  let customName: string | null = null;
  let customMets: number | null = null;

  if (input.exerciseIdRaw === CUSTOM_EXERCISE_VALUE) {
    customName = input.customNameRaw.trim();
    if (!customName) {
      return { ok: false, error: "運動の名前を入力してください。" };
    }

    const metsResult = parsePositiveNumber(
      input.customMetsRaw,
      "メッツ(METs)は正の数で入力してください。",
    );
    if (!metsResult.ok) {
      return metsResult;
    }
    customMets = metsResult.data;
  } else {
    exerciseId = Number(input.exerciseIdRaw);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
      return { ok: false, error: "運動の種目の指定が不正です。" };
    }
  }

  const durationResult = parsePositiveNumber(
    input.durationMinRaw,
    "1回あたりの時間(分)は正の数で入力してください。",
  );
  if (!durationResult.ok) {
    return durationResult;
  }
  const durationMin = durationResult.data;

  const frequencyResult = parsePositiveNumber(
    input.frequencyPerWeekRaw,
    "頻度(週あたりの回数)は正の数で入力してください。",
  );
  if (!frequencyResult.ok) {
    return frequencyResult;
  }
  if (frequencyResult.data > MAX_FREQUENCY_PER_WEEK) {
    return {
      ok: false,
      error: `頻度(週あたりの回数)は${MAX_FREQUENCY_PER_WEEK}回以下で入力してください。`,
    };
  }
  const frequencyPerWeek = frequencyResult.data;

  return {
    ok: true,
    data: {
      exerciseId,
      customName,
      customMets,
      durationMin,
      frequencyPerWeek,
    },
  };
}
