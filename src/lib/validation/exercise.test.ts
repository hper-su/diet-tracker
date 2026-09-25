import { describe, expect, it } from "vitest";
import { validateExerciseInput } from "./exercise";

const base = { name: "ベンチプレス", aliasesRaw: "", wgerIdRaw: "" };

describe("validateExerciseInput", () => {
  it("種目名は必須", () => {
    expect(validateExerciseInput({ ...base, name: "  " })).toEqual({
      ok: false,
      error: "種目名を入力してください。",
    });
  });

  it("別名は全角・半角カンマ区切りで重複を除いて取り込む", () => {
    const result = validateExerciseInput({ ...base, aliasesRaw: "ベンチ, ベンチ、フラットベンチ" });
    expect(result).toEqual({
      ok: true,
      data: { name: "ベンチプレス", aliases: ["ベンチ", "フラットベンチ"], wgerId: null },
    });
  });

  it("wger種目は未選択ならnull、IDなら数値で受け取る", () => {
    expect(validateExerciseInput(base)).toMatchObject({ ok: true, data: { wgerId: null } });
    expect(validateExerciseInput({ ...base, wgerIdRaw: "73" })).toMatchObject({
      ok: true,
      data: { wgerId: 73 },
    });
  });

  it("取り込み済みの一覧に無いIDも、保存済みの値を消さないよう受け付ける", () => {
    expect(validateExerciseInput({ ...base, wgerIdRaw: "999999" })).toMatchObject({
      ok: true,
      data: { wgerId: 999999 },
    });
  });

  it("整数でない・1未満のwger IDは拒否する", () => {
    for (const wgerIdRaw of ["abc", "7.5", "-1", "0"]) {
      expect(validateExerciseInput({ ...base, wgerIdRaw }), wgerIdRaw).toEqual({
        ok: false,
        error: "wgerの種目を一覧から選択してください。",
      });
    }
  });
});
