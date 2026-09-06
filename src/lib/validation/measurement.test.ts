import { describe, expect, it } from "vitest";
import { validateMeasurementInput } from "./measurement";

const BASE_INPUT = {
  recordedAt: "2026-08-01",
  weightRaw: "",
  bodyFatRaw: "",
  muscleMassRaw: "",
  visceralFatRaw: "",
  bmrRaw: "",
  memo: "",
};

describe("validateMeasurementInput", () => {
  it("rejects a missing date", () => {
    expect(
      validateMeasurementInput({ ...BASE_INPUT, recordedAt: "", weightRaw: "60" }),
    ).toEqual({ ok: false, error: "日付は必須です。" });
  });

  it("rejects when every metric field is blank", () => {
    expect(validateMeasurementInput(BASE_INPUT)).toEqual({
      ok: false,
      error:
        "体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝のいずれか1つ以上を入力してください。",
    });
  });

  it("accepts a single filled metric field", () => {
    const result = validateMeasurementInput({
      ...BASE_INPUT,
      weightRaw: "68.5",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        recordedAt: "2026-08-01",
        weightKg: 68.5,
        bodyFatPct: null,
        muscleMassKg: null,
        visceralFatLevel: null,
        bmrKcal: null,
        memo: null,
      },
    });
  });

  it("accepts all metric fields at once", () => {
    const result = validateMeasurementInput({
      recordedAt: "2026-08-01",
      weightRaw: "68.5",
      bodyFatRaw: "18.2",
      muscleMassRaw: "55.1",
      visceralFatRaw: "8",
      bmrRaw: "1550",
      memo: "朝食前に測定",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        recordedAt: "2026-08-01",
        weightKg: 68.5,
        bodyFatPct: 18.2,
        muscleMassKg: 55.1,
        visceralFatLevel: 8,
        bmrKcal: 1550,
        memo: "朝食前に測定",
      },
    });
  });

  it("rejects a non-positive value for a filled field", () => {
    expect(
      validateMeasurementInput({ ...BASE_INPUT, weightRaw: "0" }),
    ).toEqual({ ok: false, error: "体重は正の数で入力してください。" });

    expect(
      validateMeasurementInput({ ...BASE_INPUT, bmrRaw: "-100" }),
    ).toEqual({ ok: false, error: "基礎代謝は正の数で入力してください。" });
  });
});
