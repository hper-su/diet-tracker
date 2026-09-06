import { describe, expect, it } from "vitest";
import {
  KCAL_PER_KG_BODY_WEIGHT,
  calculateDailyCalorieAdjustment,
} from "./calorie-adjustment";

describe("calculateDailyCalorieAdjustment", () => {
  it("converts a monthly weight-loss goal into a negative daily adjustment", () => {
    // -2kg/month
    const result = calculateDailyCalorieAdjustment(-2);
    expect(result).toBeCloseTo((-2 * KCAL_PER_KG_BODY_WEIGHT) / 30, 5);
    expect(result).toBeLessThan(0);
  });

  it("converts a monthly weight-gain goal into a positive daily adjustment", () => {
    const result = calculateDailyCalorieAdjustment(1.5);
    expect(result).toBeCloseTo((1.5 * KCAL_PER_KG_BODY_WEIGHT) / 30, 5);
    expect(result).toBeGreaterThan(0);
  });

  it("returns 0 for a maintenance goal (no change)", () => {
    expect(calculateDailyCalorieAdjustment(0)).toBe(0);
  });
});
