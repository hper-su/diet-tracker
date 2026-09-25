import { describe, expect, it } from "vitest";
import { ANATOMY_PARTS } from "@/lib/anatomy";
import { ANATOMY_TO_WGER_MUSCLE_IDS, wgerMuscleIdsForAnatomyPart } from "./anatomy-map";
import { WGER_MUSCLES, WGER_MUSCLE_JA, getWgerExercise, wgerMuscleLabel } from "./data";

describe("wgerの筋肉データ", () => {
  it("全筋肉に日本語名がある", () => {
    for (const muscle of WGER_MUSCLES) {
      expect(WGER_MUSCLE_JA[muscle.id], `筋肉#${muscle.id} ${muscle.name}`).toBeTruthy();
    }
  });

  it("未知のIDでも落とさずラベルを返す", () => {
    expect(wgerMuscleLabel(4)).toBe("大胸筋");
    expect(wgerMuscleLabel(9999)).toBe("筋肉#9999");
  });
});

describe("getWgerExercise", () => {
  it("取り込み済みの種目を返す(ベンチプレス: 主働筋=大胸筋、補助筋=三角筋前部・上腕三頭筋)", () => {
    const bench = getWgerExercise(73);
    expect(bench?.primaryMuscleIds).toEqual([4]);
    expect(bench?.secondaryMuscleIds).toEqual([2, 5]);
  });

  it("未設定・未取り込みはnull", () => {
    expect(getWgerExercise(null)).toBeNull();
    expect(getWgerExercise(undefined)).toBeNull();
    expect(getWgerExercise(999999)).toBeNull();
  });
});

describe("アナトミー部位とwger筋肉の対応", () => {
  it("対応表のキーは、すべて実在する筋肉部位のid", () => {
    const muscleIds = new Set(
      ANATOMY_PARTS.filter((p) => p.type === "muscle").map((p) => p.id),
    );
    for (const id of Object.keys(ANATOMY_TO_WGER_MUSCLE_IDS)) {
      expect(muscleIds.has(id), id).toBe(true);
    }
  });

  it("対応先のwger筋肉IDは、すべて取り込み済みの筋肉", () => {
    const wgerIds = new Set(WGER_MUSCLES.map((m) => m.id));
    for (const ids of Object.values(ANATOMY_TO_WGER_MUSCLE_IDS)) {
      for (const id of ids) expect(wgerIds.has(id), String(id)).toBe(true);
    }
  });

  it("対応が無い部位は空配列を返す", () => {
    expect(wgerMuscleIdsForAnatomyPart("sternocleidomastoid")).toEqual([]);
    expect(wgerMuscleIdsForAnatomyPart("calf")).toEqual([7, 15]);
  });
});
