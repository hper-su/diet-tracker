import { describe, expect, it } from "vitest";
import { validateUsualExerciseInput } from "./usual-exercise";

const BASE_INPUT = {
  exerciseIdRaw: "3",
  customNameRaw: "",
  customMetsRaw: "",
  durationMinRaw: "30",
  frequencyPerWeekRaw: "3",
};

describe("validateUsualExerciseInput", () => {
  it("accepts a valid master exercise selection", () => {
    expect(validateUsualExerciseInput(BASE_INPUT)).toEqual({
      ok: true,
      data: {
        exerciseId: 3,
        customName: null,
        customMets: null,
        durationMin: 30,
        frequencyPerWeek: 3,
      },
    });
  });

  it("rejects a missing exercise selection", () => {
    expect(
      validateUsualExerciseInput({ ...BASE_INPUT, exerciseIdRaw: "" }),
    ).toEqual({ ok: false, error: "運動の種目を選択してください。" });
  });

  it("rejects a non-positive duration", () => {
    expect(
      validateUsualExerciseInput({ ...BASE_INPUT, durationMinRaw: "0" }),
    ).toEqual({ ok: false, error: "1回あたりの時間(分)は正の数で入力してください。" });
  });

  it("rejects a non-positive frequency", () => {
    expect(
      validateUsualExerciseInput({ ...BASE_INPUT, frequencyPerWeekRaw: "0" }),
    ).toEqual({ ok: false, error: "頻度(週あたりの回数)は正の数で入力してください。" });
  });

  it("rejects a frequency above the weekly max", () => {
    expect(
      validateUsualExerciseInput({ ...BASE_INPUT, frequencyPerWeekRaw: "15" }),
    ).toEqual({ ok: false, error: "頻度(週あたりの回数)は14回以下で入力してください。" });
  });

  it("accepts a frequency at the weekly max", () => {
    const result = validateUsualExerciseInput({
      ...BASE_INPUT,
      frequencyPerWeekRaw: "14",
    });
    expect(result.ok && result.data.frequencyPerWeek).toBe(14);
  });

  it("accepts a custom exercise with name and METs", () => {
    const result = validateUsualExerciseInput({
      ...BASE_INPUT,
      exerciseIdRaw: "custom",
      customNameRaw: "縄跳び",
      customMetsRaw: "8.0",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        exerciseId: null,
        customName: "縄跳び",
        customMets: 8.0,
        durationMin: 30,
        frequencyPerWeek: 3,
      },
    });
  });

  it("rejects a custom exercise without a name", () => {
    expect(
      validateUsualExerciseInput({
        ...BASE_INPUT,
        exerciseIdRaw: "custom",
        customNameRaw: "  ",
        customMetsRaw: "8.0",
      }),
    ).toEqual({ ok: false, error: "運動の名前を入力してください。" });
  });

  it("rejects a custom exercise with a non-positive METs", () => {
    expect(
      validateUsualExerciseInput({
        ...BASE_INPUT,
        exerciseIdRaw: "custom",
        customNameRaw: "縄跳び",
        customMetsRaw: "0",
      }),
    ).toEqual({ ok: false, error: "メッツ(METs)は正の数で入力してください。" });
  });
});
