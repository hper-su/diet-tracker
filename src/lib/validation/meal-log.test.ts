import { describe, expect, it } from "vitest";
import { validateMealLogInput } from "./meal-log";

const BASE_INPUT = {
  recordedAt: "2026-08-01",
  mealTypeRaw: "lunch",
  foodIdRaw: "3",
  quantityRaw: "",
  memo: "",
};

describe("validateMealLogInput", () => {
  it("accepts a valid input and defaults quantity to 1", () => {
    expect(validateMealLogInput(BASE_INPUT)).toEqual({
      ok: true,
      data: {
        recordedAt: "2026-08-01",
        mealType: "lunch",
        foodId: 3,
        quantity: 1,
        memo: null,
      },
    });
  });

  it("rejects a missing date", () => {
    expect(validateMealLogInput({ ...BASE_INPUT, recordedAt: "" })).toEqual({
      ok: false,
      error: "日付は必須です。",
    });
  });

  it("rejects an invalid meal type", () => {
    expect(
      validateMealLogInput({ ...BASE_INPUT, mealTypeRaw: "midnight" }),
    ).toEqual({ ok: false, error: "食事の区分を選択してください。" });
  });

  it("rejects a missing food selection", () => {
    expect(validateMealLogInput({ ...BASE_INPUT, foodIdRaw: "" })).toEqual({
      ok: false,
      error: "食品を選択してください。",
    });
  });

  it("rejects a non-integer food id", () => {
    expect(
      validateMealLogInput({ ...BASE_INPUT, foodIdRaw: "abc" }),
    ).toEqual({ ok: false, error: "食品の指定が不正です。" });
  });

  it("accepts a custom quantity", () => {
    const result = validateMealLogInput({ ...BASE_INPUT, quantityRaw: "2.5" });
    expect(result.ok && result.data.quantity).toBe(2.5);
  });

  it("rejects a non-positive quantity", () => {
    expect(
      validateMealLogInput({ ...BASE_INPUT, quantityRaw: "0" }),
    ).toEqual({ ok: false, error: "数量は正の数で入力してください。" });
  });
});
