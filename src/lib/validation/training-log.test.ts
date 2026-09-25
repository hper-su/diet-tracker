import { describe, expect, it } from "vitest";
import { normalizeNumericText, validateTrainingLogInput } from "./training-log";

const base = {
  recordedAt: "2026-09-25",
  exerciseIdRaw: "ex1",
  weight: "",
  reps: "",
  sets: "",
  memo: "",
};

describe("normalizeNumericText", () => {
  it("全角の数字・記号を半角にそろえる", () => {
    expect(normalizeNumericText("１２")).toBe("12");
    expect(normalizeNumericText("１０－８－６")).toBe("10-8-6");
    expect(normalizeNumericText("６２．５")).toBe("62.5");
  });

  it("読点をカンマにし、前後の空白を除く", () => {
    expect(normalizeNumericText(" 25、20 ")).toBe("25,20");
  });

  it("既存の書き方(×・単位・注記)はそのまま残す", () => {
    expect(normalizeNumericText("30×8")).toBe("30×8");
    expect(normalizeNumericText("15(同上)")).toBe("15(同上)");
  });
});

describe("validateTrainingLogInput", () => {
  it("日付と種目は必須", () => {
    expect(validateTrainingLogInput({ ...base, recordedAt: "" })).toEqual({
      ok: false,
      error: "日付は必須です。",
    });
    expect(validateTrainingLogInput({ ...base, exerciseIdRaw: "" })).toEqual({
      ok: false,
      error: "種目を選択してください。",
    });
  });

  it("重さ・回数・セット数が未入力でも登録できる(自重種目など)", () => {
    expect(validateTrainingLogInput(base)).toEqual({
      ok: true,
      data: {
        recordedAt: "2026-09-25",
        exerciseId: "ex1",
        weight: "",
        reps: "",
        sets: "",
        memo: null,
      },
    });
  });

  it("重さ・回数はセットごとの自由記述を保ったまま、全角だけ半角にする", () => {
    const result = validateTrainingLogInput({
      ...base,
      weight: "２５、２０",
      reps: "１２－１０－８",
    });
    expect(result).toMatchObject({ ok: true, data: { weight: "25,20", reps: "12-10-8" } });
  });

  it("セット数は全角でも整数として受け付ける", () => {
    expect(validateTrainingLogInput({ ...base, sets: "３" })).toMatchObject({
      ok: true,
      data: { sets: "3" },
    });
  });

  it("セット数が整数でない・範囲外なら拒否する", () => {
    for (const sets of ["3セット", "2.5", "0", "-1", "100", "abc", "3-2"]) {
      expect(validateTrainingLogInput({ ...base, sets }), sets).toEqual({
        ok: false,
        error: "セット数は1〜99の整数で入力してください(例: 3)。",
      });
    }
  });

  it("メモは前後の空白を除き、空ならnull", () => {
    expect(validateTrainingLogInput({ ...base, memo: "  " })).toMatchObject({
      data: { memo: null },
    });
    expect(validateTrainingLogInput({ ...base, memo: " 膝に違和感 " })).toMatchObject({
      data: { memo: "膝に違和感" },
    });
  });
});
