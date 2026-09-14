import { describe, expect, it } from "vitest";
import { validateClientInput } from "./client";

const BASE_INPUT = {
  name: "山田花子",
  birthdate: "1988-03-20",
  heightRaw: "160",
  genderRaw: "female",
  activityLevelRaw: "active",
  pfcPresetRaw: "low_carb",
  memo: "膝に不安あり",
};

describe("validateClientInput", () => {
  it("accepts a fully filled input", () => {
    expect(validateClientInput(BASE_INPUT)).toEqual({
      ok: true,
      data: {
        name: "山田花子",
        birthdate: "1988-03-20",
        heightCm: 160,
        gender: "female",
        activityLevel: "active",
        pfcPreset: "low_carb",
        memo: "膝に不安あり",
      },
    });
  });

  it("rejects a blank name", () => {
    expect(validateClientInput({ ...BASE_INPUT, name: "  " })).toEqual({
      ok: false,
      error: "お名前を入力してください。",
    });
  });

  it("trims surrounding whitespace from the name", () => {
    const result = validateClientInput({ ...BASE_INPUT, name: "  花子  " });
    expect(result.ok && result.data.name).toBe("花子");
  });

  it("allows blank optional fields and defaults activity level/PFC preset", () => {
    const result = validateClientInput({
      name: "太郎",
      birthdate: "",
      heightRaw: "",
      genderRaw: "",
      activityLevelRaw: "",
      pfcPresetRaw: "",
      memo: "",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: "太郎",
        birthdate: null,
        heightCm: null,
        gender: null,
        activityLevel: "moderate",
        pfcPreset: "health",
        memo: null,
      },
    });
  });

  it("accepts a birthdate without dashes and normalizes it", () => {
    const result = validateClientInput({ ...BASE_INPUT, birthdate: "19880320" });
    expect(result.ok && result.data.birthdate).toBe("1988-03-20");
  });

  it("rejects a birthdate in an unsupported format", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, birthdate: "1988/03/20" }),
    ).toEqual({
      ok: false,
      error:
        "生年月日はYYYY-MM-DD、または区切りなしのYYYYMMDD形式で入力してください(例: 1988-03-20 / 19880320)。",
    });
  });

  it("rejects a birthdate that is not a real date", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, birthdate: "1988-13-40" }),
    ).toEqual({ ok: false, error: "生年月日が正しい日付ではありません。" });
  });

  it("rejects a day that overflows within a valid month (e.g. Feb 30)", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, birthdate: "1988-02-30" }),
    ).toEqual({ ok: false, error: "生年月日が正しい日付ではありません。" });
  });

  it("rejects Feb 29 on a non-leap year", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, birthdate: "2023-02-29" }),
    ).toEqual({ ok: false, error: "生年月日が正しい日付ではありません。" });
  });

  it("accepts Feb 29 on a leap year", () => {
    const result = validateClientInput({ ...BASE_INPUT, birthdate: "2024-02-29" });
    expect(result.ok && result.data.birthdate).toBe("2024-02-29");
  });

  it("rejects a birthdate without dashes that is not a real date", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, birthdate: "19881340" }),
    ).toEqual({ ok: false, error: "生年月日が正しい日付ではありません。" });
  });

  it("rejects a non-positive height", () => {
    expect(validateClientInput({ ...BASE_INPUT, heightRaw: "0" })).toEqual({
      ok: false,
      error: "身長は正の数で入力してください。",
    });
  });

  it("rejects an invalid gender", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, genderRaw: "robot" }),
    ).toEqual({ ok: false, error: "性別の指定が不正です。" });
  });

  it("rejects an invalid activity level", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, activityLevelRaw: "extreme" }),
    ).toEqual({ ok: false, error: "活動レベルの指定が不正です。" });
  });

  it("rejects an invalid PFC preset", () => {
    expect(
      validateClientInput({ ...BASE_INPUT, pfcPresetRaw: "extreme" }),
    ).toEqual({ ok: false, error: "PFCバランスの指定が不正です。" });
  });
});
