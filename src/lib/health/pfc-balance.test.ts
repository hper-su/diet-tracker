import { describe, expect, it } from "vitest";
import { calculateMacroRatioPercent, calculatePFCBalance } from "./pfc-balance";

describe("calculatePFCBalance", () => {
  it("splits calories according to the given P/F/C ratios", () => {
    const result = calculatePFCBalance({
      targetIntakeCalories: 2000,
      proteinRatio: 0.15,
      fatRatio: 0.25,
      carbRatio: 0.6,
    });

    expect(result).not.toBeNull();
    expect(result?.proteinKcal).toBeCloseTo(300, 5);
    expect(result?.proteinG).toBeCloseTo(75, 5);
    expect(result?.fatKcal).toBeCloseTo(500, 5);
    expect(result?.fatG).toBeCloseTo(500 / 9, 5);
    expect(result?.carbKcal).toBeCloseTo(1200, 5);
    expect(result?.carbG).toBeCloseTo(300, 5);
  });

  it("keeps the total kcal equal to the target intake", () => {
    const result = calculatePFCBalance({
      targetIntakeCalories: 2000,
      proteinRatio: 0.3,
      fatRatio: 0.2,
      carbRatio: 0.5,
    });

    expect(result).not.toBeNull();
    const total =
      (result?.proteinKcal ?? 0) + (result?.fatKcal ?? 0) + (result?.carbKcal ?? 0);
    expect(total).toBeCloseTo(2000, 5);
  });

  it("returns null for a non-positive target intake", () => {
    expect(
      calculatePFCBalance({
        targetIntakeCalories: 0,
        proteinRatio: 0.15,
        fatRatio: 0.25,
        carbRatio: 0.6,
      }),
    ).toBeNull();
  });
});

describe("calculateMacroRatioPercent", () => {
  it("computes the calorie-based percentage of each macro", () => {
    // P: 10g*4=40kcal, F: 10g*9=90kcal, C: 10g*4=40kcal, total=170kcal
    const result = calculateMacroRatioPercent({
      proteinG: 10,
      fatG: 10,
      carbG: 10,
    });

    expect(result).not.toBeNull();
    expect(result?.proteinPct).toBeCloseTo((40 / 170) * 100, 5);
    expect(result?.fatPct).toBeCloseTo((90 / 170) * 100, 5);
    expect(result?.carbPct).toBeCloseTo((40 / 170) * 100, 5);
    const sum = (result?.proteinPct ?? 0) + (result?.fatPct ?? 0) + (result?.carbPct ?? 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it("returns null when nothing has been recorded", () => {
    expect(
      calculateMacroRatioPercent({ proteinG: 0, fatG: 0, carbG: 0 }),
    ).toBeNull();
  });
});
