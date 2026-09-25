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

// 重さ・回数はセットごとの値を並べる「25,20」「10-8-6」のような自由記述を許すため、
// 数値としての検証は行わない(未入力の値はそのまま空文字で保存する)。
// ただし日本語入力のまま全角で打たれた数字・記号(「１２」「25、20」「10－8」)は、
// 推移グラフ(src/lib/health/training-progress.ts)が数値として読み取れず
// 点が抜けてしまうため、保存前に半角へそろえる。
export function normalizeNumericText(raw: string): string {
  return raw.normalize("NFKC").replace(/、/g, ",").trim();
}

const SETS_MAX = 99;

// セット数は実際の記録(1,099件)でも常に1〜6の整数のみだったため、空欄か
// 1以上の整数だけを受け付ける。「3セット」のような単位付きの入力は、
// 単位を除いて数字だけ入力するようエラーで案内する。
function validateSets(sets: string): ValidationResult<string> {
  if (sets === "") return { ok: true, data: "" };
  if (!/^\d+$/.test(sets) || Number(sets) < 1 || Number(sets) > SETS_MAX) {
    return {
      ok: false,
      error: `セット数は1〜${SETS_MAX}の整数で入力してください(例: 3)。`,
    };
  }
  return { ok: true, data: String(Number(sets)) };
}

// 必須なのは日付と種目のみ。
export function validateTrainingLogInput(
  input: TrainingLogInput,
): ValidationResult<TrainingLogData> {
  if (!input.recordedAt) {
    return { ok: false, error: "日付は必須です。" };
  }

  if (!input.exerciseIdRaw) {
    return { ok: false, error: "種目を選択してください。" };
  }

  const sets = validateSets(normalizeNumericText(input.sets));
  if (!sets.ok) return sets;

  return {
    ok: true,
    data: {
      recordedAt: input.recordedAt,
      exerciseId: input.exerciseIdRaw,
      weight: normalizeNumericText(input.weight),
      reps: normalizeNumericText(input.reps),
      sets: sets.data,
      memo: input.memo.trim() || null,
    },
  };
}
