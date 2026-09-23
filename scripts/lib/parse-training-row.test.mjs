import { describe, expect, it } from "vitest";
import { parseExerciseCell } from "./parse-training-row.mjs";

describe("parseExerciseCell", () => {
  it("returns null for an illegible row (excluded from import)", () => {
    expect(parseExerciseCell("(判読不能)", "")).toBeNull();
    expect(parseExerciseCell("(判読不能:ド)", "")).toBeNull();
  });

  it("normalizes a known abbreviation to a single resolved entry", () => {
    expect(parseExerciseCell("ラットプル", "")).toEqual([
      { exerciseName: "ラットプルダウン", resolved: true, memo: null },
    ]);
  });

  it("moves a trailing (...) note into memo and keeps the existing memo", () => {
    expect(parseExerciseCell("ラットプル(ドロップセット)", "MAGグリップ")).toEqual([
      { exerciseName: "ラットプルダウン", resolved: true, memo: "MAGグリップ / ドロップセット" },
    ]);
  });

  it("splits a superset cell into two resolved entries sharing the same memo", () => {
    expect(parseExerciseCell("ケーブルカール・ケーブルプレスダウン", "")).toEqual([
      { exerciseName: "ケーブルカール", resolved: true, memo: null },
      { exerciseName: "ケーブルプレスダウン", resolved: true, memo: null },
    ]);
  });

  it("leaves a bare インクライン unresolved (not normalized, not linked to master)", () => {
    expect(parseExerciseCell("インクライン", "ダンベルフライ")).toEqual([
      { exerciseName: "インクライン", resolved: false, memo: "ダンベルフライ" },
    ]);
  });

  it("does not mark a specific インクライン variant as unresolved", () => {
    expect(parseExerciseCell("インクラインフライ", "")).toEqual([
      { exerciseName: "インクラインフライ", resolved: true, memo: null },
    ]);
  });
});
