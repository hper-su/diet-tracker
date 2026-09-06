import { describe, expect, it } from "vitest";
import {
  calculateMaintenanceCalories,
  calculateTargetIntakeCalories,
} from "./maintenance";

describe("calculateMaintenanceCalories", () => {
  it("applies the activity factor to the BMR", () => {
    const result = calculateMaintenanceCalories({
      bmr: 1500,
      activityFactor: 1.75,
    });
    expect(result).toBeCloseTo(1500 * 1.75, 5);
  });

  it("scales with a different activity factor", () => {
    const result = calculateMaintenanceCalories({
      bmr: 1500,
      activityFactor: 1.5,
    });
    expect(result).toBeCloseTo(1500 * 1.5, 5);
  });
});

describe("calculateTargetIntakeCalories", () => {
  it("adds a positive adjustment (weight-gain goal)", () => {
    const result = calculateTargetIntakeCalories({
      maintenanceCalories: 2200,
      dailyCalorieAdjustment: 300,
    });
    expect(result).toBe(2500);
  });

  it("subtracts via a negative adjustment (weight-loss goal)", () => {
    const result = calculateTargetIntakeCalories({
      maintenanceCalories: 2200,
      dailyCalorieAdjustment: -300,
    });
    expect(result).toBe(1900);
  });

  it("returns maintenance calories unchanged for a zero adjustment", () => {
    const result = calculateTargetIntakeCalories({
      maintenanceCalories: 2200,
      dailyCalorieAdjustment: 0,
    });
    expect(result).toBe(2200);
  });

  it("never returns a negative value", () => {
    const result = calculateTargetIntakeCalories({
      maintenanceCalories: 300,
      dailyCalorieAdjustment: -500,
    });
    expect(result).toBe(0);
  });
});
