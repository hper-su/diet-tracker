import { describe, expect, it } from "vitest";
import {
  isIllegibleExerciseName,
  splitTrailingNote,
  splitSupersetName,
  normalizeExerciseName,
  UNRESOLVED_EXERCISE_NAMES,
} from "./exercise-normalize.mjs";

describe("isIllegibleExerciseName", () => {
  it("detects the illegible marker with and without a sub-note", () => {
    expect(isIllegibleExerciseName("(判読不能)")).toBe(true);
    expect(isIllegibleExerciseName("(判読不能:フト)")).toBe(true);
    expect(isIllegibleExerciseName("(判読不能:ド)")).toBe(true);
  });

  it("does not flag ordinary exercise names", () => {
    expect(isIllegibleExerciseName("ラットプル")).toBe(false);
    expect(isIllegibleExerciseName("ラットプル(ドロップセット)")).toBe(false);
  });
});

describe("splitTrailingNote", () => {
  it("extracts a trailing parenthetical note and strips it from the name", () => {
    expect(splitTrailingNote("ラットプル(ドロップセット)")).toEqual({
      name: "ラットプル",
      note: "ドロップセット",
    });
  });

  it("keeps a Japanese comma inside the note intact", () => {
    expect(splitTrailingNote("ラットプル(MAG、ラットプルバー)")).toEqual({
      name: "ラットプル",
      note: "MAG、ラットプルバー",
    });
  });

  it("returns the name unchanged with a null note when there is no parenthesis", () => {
    expect(splitTrailingNote("ブルガリアン")).toEqual({ name: "ブルガリアン", note: null });
  });
});

describe("splitSupersetName", () => {
  it("splits a superset cell into its two exercises", () => {
    expect(splitSupersetName("ケーブルカール・ケーブルプレスダウン")).toEqual([
      "ケーブルカール",
      "ケーブルプレスダウン",
    ]);
  });

  it("returns a single-element array when there is no separator", () => {
    expect(splitSupersetName("ラットプルダウン")).toEqual(["ラットプルダウン"]);
  });
});

describe("normalizeExerciseName", () => {
  it("maps known abbreviations/typos to their canonical name", () => {
    expect(normalizeExerciseName("ラットプル")).toBe("ラットプルダウン");
    expect(normalizeExerciseName("ブルガリアン")).toBe("ブルガリアンスクワット");
    expect(normalizeExerciseName("ルーマニアン")).toBe("ルーマニアデットリフト");
    expect(normalizeExerciseName("デットバック")).toBe("デッドバック");
  });

  it("leaves unknown names unchanged", () => {
    expect(normalizeExerciseName("ラットプルダウン")).toBe("ラットプルダウン");
    expect(normalizeExerciseName("デッドバグ")).toBe("デッドバグ");
  });
});

describe("UNRESOLVED_EXERCISE_NAMES", () => {
  it("marks bare インクライン as unresolved (not linked to the exercise master)", () => {
    expect(UNRESOLVED_EXERCISE_NAMES.has("インクライン")).toBe(true);
    expect(UNRESOLVED_EXERCISE_NAMES.has("インクラインフライ")).toBe(false);
  });
});
