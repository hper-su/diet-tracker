import { describe, expect, it } from "vitest";
import { toExerciseHistoryPoints } from "./exercise-history-chart";
import type { TrainingLog } from "@/lib/db/training-logs";

function log(overrides: Partial<TrainingLog>): TrainingLog {
  return {
    id: "1",
    recordedAt: "2026-09-01",
    exerciseId: "ex1",
    exerciseName: "ベンチプレス",
    weight: "",
    reps: "",
    sets: "",
    memo: null,
    ...overrides,
  };
}

describe("toExerciseHistoryPoints", () => {
  it("parses weight/reps into numeric peaks per point", () => {
    const points = toExerciseHistoryPoints([
      log({ recordedAt: "2026-09-01", weight: "60", reps: "10" }),
      log({ recordedAt: "2026-09-08", weight: "25,20", reps: "10-8-6" }),
    ]);
    expect(points).toEqual([
      { recordedAt: "2026-09-01", weight: 60, reps: 10 },
      { recordedAt: "2026-09-08", weight: 25, reps: 10 },
    ]);
  });

  it("leaves weight/reps null when they can't be parsed as numbers", () => {
    const points = toExerciseHistoryPoints([log({ weight: "自重", reps: "" })]);
    expect(points).toEqual([{ recordedAt: "2026-09-01", weight: null, reps: null }]);
  });
});
