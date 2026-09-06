import { describe, expect, it } from "vitest";
import { validateFoodInput } from "./food";

const BASE_INPUT = {
  category: "穀類",
  name: "ご飯(200g)",
  servingLabel: "1杯",
  kcalRaw: "336",
  proteinRaw: "5",
  fatRaw: "0.6",
  carbRaw: "74",
};

describe("validateFoodInput", () => {
  it("accepts a fully filled input", () => {
    expect(validateFoodInput(BASE_INPUT)).toEqual({
      ok: true,
      data: {
        category: "穀類",
        name: "ご飯(200g)",
        servingLabel: "1杯",
        kcal: 336,
        proteinG: 5,
        fatG: 0.6,
        carbG: 74,
      },
    });
  });

  it("defaults the category to an empty string when blank", () => {
    const result = validateFoodInput({ ...BASE_INPUT, category: "  " });
    expect(result.ok && result.data.category).toBe("");
  });

  it("rejects a blank name", () => {
    expect(validateFoodInput({ ...BASE_INPUT, name: "  " })).toEqual({
      ok: false,
      error: "食品名を入力してください。",
    });
  });

  it("defaults the serving label to 1人前 when blank", () => {
    const result = validateFoodInput({ ...BASE_INPUT, servingLabel: "  " });
    expect(result.ok && result.data.servingLabel).toBe("1人前");
  });

  it("requires kcal", () => {
    expect(validateFoodInput({ ...BASE_INPUT, kcalRaw: "" })).toEqual({
      ok: false,
      error: "カロリー(kcal)を入力してください。",
    });
  });

  it("rejects a negative kcal", () => {
    expect(validateFoodInput({ ...BASE_INPUT, kcalRaw: "-1" })).toEqual({
      ok: false,
      error: "カロリーは0以上の数で入力してください。",
    });
  });

  it("defaults blank P/F/C fields to zero", () => {
    const result = validateFoodInput({
      ...BASE_INPUT,
      proteinRaw: "",
      fatRaw: "",
      carbRaw: "",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        category: "穀類",
        name: "ご飯(200g)",
        servingLabel: "1杯",
        kcal: 336,
        proteinG: 0,
        fatG: 0,
        carbG: 0,
      },
    });
  });

  it("rejects a negative P/F/C value", () => {
    expect(validateFoodInput({ ...BASE_INPUT, proteinRaw: "-1" })).toEqual({
      ok: false,
      error: "たんぱく質は0以上の数で入力してください。",
    });
  });
});
