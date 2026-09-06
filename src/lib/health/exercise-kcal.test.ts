import { describe, expect, it } from "vitest";
import { calculateExerciseKcal } from "./exercise-kcal";

describe("calculateExerciseKcal", () => {
  it("calculates kcal using METs x weight x hours x 1.05", () => {
    // 6.0 x 60kg x 0.5h x 1.05 = 189
    const result = calculateExerciseKcal({
      mets: 6.0,
      weightKg: 60,
      durationMin: 30,
    });
    expect(result).toBeCloseTo(189, 5);
  });

  it("scales linearly with duration", () => {
    const perMinute = calculateExerciseKcal({
      mets: 3.0,
      weightKg: 70,
      durationMin: 1,
    });
    const perHour = calculateExerciseKcal({
      mets: 3.0,
      weightKg: 70,
      durationMin: 60,
    });
    expect(perHour).toBeCloseTo(perMinute * 60, 5);
  });

  it("returns 0 when duration is 0", () => {
    expect(
      calculateExerciseKcal({ mets: 5.0, weightKg: 65, durationMin: 0 }),
    ).toBe(0);
  });
});
