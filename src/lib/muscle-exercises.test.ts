import { describe, expect, it } from "vitest";
import {
  findRelatedExercisesForBone,
  findRelatedExercisesForMuscle,
} from "./muscle-exercises";

describe("findRelatedExercisesForMuscle", () => {
  it("finds primary-role exercises for an exact muscle name", () => {
    const results = findRelatedExercisesForMuscle("大胸筋");
    expect(results.some((r) => r.exercise === "ベンチプレス" && r.role === "primary")).toBe(
      true,
    );
    expect(
      results.some((r) => r.exercise === "ディップス" && r.role === "primary"),
    ).toBe(true);
  });

  it("finds secondary-role exercises", () => {
    const results = findRelatedExercisesForMuscle("上腕三頭筋");
    expect(
      results.some((r) => r.exercise === "ベンチプレス" && r.role === "secondary"),
    ).toBe(true);
  });

  it("matches partial labels like 三角筋前部/後部 against 三角筋", () => {
    const results = findRelatedExercisesForMuscle("三角筋");
    expect(results.some((r) => r.exercise === "ショルダープレス")).toBe(true);
    expect(results.some((r) => r.exercise === "フェイスプル")).toBe(true);
  });

  it("resolves the calf alias (下腿三頭筋 → 腓腹筋・ヒラメ筋)", () => {
    const results = findRelatedExercisesForMuscle("下腿三頭筋(ふくらはぎ)");
    expect(results.some((r) => r.exercise === "カーフレイズ")).toBe(true);
  });

  it("returns an empty array for a muscle absent from the table", () => {
    expect(findRelatedExercisesForMuscle("前脛骨筋")).toEqual([]);
  });

  it("finds シュラッグ for 僧帽筋 (newly added exercise)", () => {
    const results = findRelatedExercisesForMuscle("僧帽筋");
    expect(
      results.some((r) => r.exercise === "シュラッグ" && r.role === "primary"),
    ).toBe(true);
  });

  it("finds ヒップアブダクション for 中殿筋 (newly added exercise)", () => {
    const results = findRelatedExercisesForMuscle("中殿筋");
    expect(
      results.some(
        (r) => r.exercise === "ヒップアブダクション" && r.role === "primary",
      ),
    ).toBe(true);
    expect(
      results.some((r) => r.exercise === "ランジ" && r.role === "secondary"),
    ).toBe(true);
  });
});

describe("findRelatedExercisesForBone", () => {
  it("finds exercises for a combined bone label (橈骨・尺骨)", () => {
    const results = findRelatedExercisesForBone("橈骨・尺骨");
    expect(results.some((r) => r.exercise === "バーベルカール")).toBe(true);
    expect(results.some((r) => r.exercise === "トライセプスエクステンション")).toBe(
      true,
    );
  });

  it("resolves the pelvis alias (骨盤 → 寛骨)", () => {
    const results = findRelatedExercisesForBone("骨盤");
    expect(results.some((r) => r.exercise === "ヒップスラスト")).toBe(true);
    expect(results.some((r) => r.exercise === "スクワット")).toBe(true);
  });

  it("finds exercises for 上腕骨", () => {
    const results = findRelatedExercisesForBone("上腕骨");
    expect(results.some((r) => r.exercise === "ベンチプレス")).toBe(true);
  });
});
