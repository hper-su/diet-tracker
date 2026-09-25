import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  UNMAPPED_EXERCISE_NAMES,
  WGER_EXERCISE_MAP,
  uniqueWgerIds,
} from "./wger-exercise-map.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const generated = JSON.parse(
  readFileSync(path.join(rootDir, "src/lib/wger/exercises.generated.json"), "utf8"),
);

describe("wger-exercise-map", () => {
  it("対応表と未対応一覧で種目名が重複していない", () => {
    for (const name of UNMAPPED_EXERCISE_NAMES) {
      expect(WGER_EXERCISE_MAP.has(name), name).toBe(false);
    }
  });

  it("対応表のwger IDが、すべて取り込み済みデータ(exercises.generated.json)にある", () => {
    const importedIds = new Set(generated.exercises.map((e) => e.id));
    expect([...importedIds].sort((a, b) => a - b)).toEqual(uniqueWgerIds());
  });

  it("取り込んだ筋肉IDのオーバーレイSVGが、すべてpublic/anatomy/wger/にある", () => {
    const muscleIds = new Set(generated.muscles.map((m) => m.id));
    for (const exercise of generated.exercises) {
      for (const id of [...exercise.primaryMuscleIds, ...exercise.secondaryMuscleIds]) {
        expect(muscleIds.has(id), `${exercise.name}: 筋肉#${id}`).toBe(true);
      }
    }
    for (const id of muscleIds) {
      for (const kind of ["main", "secondary"]) {
        const file = path.join(rootDir, `public/anatomy/wger/${kind}-${id}.svg`);
        expect(existsSync(file), file).toBe(true);
      }
    }
    for (const view of ["front", "back"]) {
      expect(existsSync(path.join(rootDir, `public/anatomy/wger/body-${view}.webp`))).toBe(true);
    }
  });
});
