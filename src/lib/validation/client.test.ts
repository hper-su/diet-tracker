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
