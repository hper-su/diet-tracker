import type { ValidationResult } from "./result";

export type MeasurementInput = {
  recordedAt: string;
  weightRaw: string;
  bodyFatRaw: string;
  muscleMassRaw: string;
  visceralFatRaw: string;
  bmrRaw: string;
  memo: string;
};

export type MeasurementData = {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

type NumericField = {
  raw: string;
  label: string;
};

function parsePositive(
  field: NumericField,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!field.raw) {
    return { ok: true, value: null };
  }
  const parsed = Number(field.raw);
  if (!(parsed > 0)) {
    return { ok: false, error: `${field.label}は正の数で入力してください。` };
  }
  return { ok: true, value: parsed };
}

export function validateMeasurementInput(
  input: MeasurementInput,
): ValidationResult<MeasurementData> {
  if (!input.recordedAt) {
    return { ok: false, error: "日付は必須です。" };
  }

  if (
    !input.weightRaw &&
    !input.bodyFatRaw &&
    !input.muscleMassRaw &&
    !input.visceralFatRaw &&
    !input.bmrRaw
  ) {
    return {
      ok: false,
      error:
        "体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝のいずれか1つ以上を入力してください。",
    };
  }

  const fields: Array<[keyof MeasurementData, NumericField]> = [
    ["weightKg", { raw: input.weightRaw, label: "体重" }],
    ["bodyFatPct", { raw: input.bodyFatRaw, label: "体脂肪率" }],
    ["muscleMassKg", { raw: input.muscleMassRaw, label: "筋肉量" }],
    ["visceralFatLevel", { raw: input.visceralFatRaw, label: "内臓脂肪レベル" }],
    ["bmrKcal", { raw: input.bmrRaw, label: "基礎代謝" }],
  ];

  const values: Record<string, number | null> = {};
  for (const [key, field] of fields) {
    const result = parsePositive(field);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    values[key] = result.value;
  }

  return {
    ok: true,
    data: {
      recordedAt: input.recordedAt,
      weightKg: values.weightKg,
      bodyFatPct: values.bodyFatPct,
      muscleMassKg: values.muscleMassKg,
      visceralFatLevel: values.visceralFatLevel,
      bmrKcal: values.bmrKcal,
      memo: input.memo || null,
    },
  };
}
