import type { ValidationResult } from "./result";

export type TrainingLogInput = {
  recordedAt: string;
  exerciseIdRaw: string;
  weight: string;
  reps: string;
  sets: string;
  memo: string;
};

export type TrainingLogData = {
  recordedAt: string;
  exerciseId: string;
  weight: string;
  reps: string;
  sets: string;
  memo: string | null;
};

// 重さ・回数・セット数は「25,20」「10-8-6」のような自由記述を許すため数値検証は
// 行わず、必須なのは日付と種目のみとする(未入力の値はそのまま空文字で保存する)。
export function validateTrainingLogInput(
  input: TrainingLogInput,
): ValidationResult<TrainingLogData> {
  if (!input.recordedAt) {
    return { ok: false, error: "日付は必須です。" };
  }

  if (!input.exerciseIdRaw) {
    return { ok: false, error: "種目を選択してください。" };
  }

  return {
    ok: true,
    data: {
      recordedAt: input.recordedAt,
      exerciseId: input.exerciseIdRaw,
      weight: input.weight.trim(),
      reps: input.reps.trim(),
      sets: input.sets.trim(),
      memo: input.memo.trim() || null,
    },
  };
}
