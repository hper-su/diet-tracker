import { describe, expect, it } from "vitest";
import { buildDietPlan } from "./diet-plan";
import { calculateBMR } from "./bmr";
import { calculateMaintenanceCalories } from "./maintenance";
import { calculateDailyCalorieAdjustment } from "./calorie-adjustment";
import { getActivityFactor } from "./activity-level";

describe("buildDietPlan", () => {
  it("combines BMR, maintenance, and target intake calories", () => {
    const input = {
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male" as const,
      activityLevel: "moderate" as const,
      monthlyWeightChangeKg: -2,
    };

    const plan = buildDietPlan(input);
    const expectedBmr = calculateBMR(input) as number;
    const expectedMaintenance = calculateMaintenanceCalories({
      bmr: expectedBmr,
      activityFactor: getActivityFactor(input.activityLevel),
    });
    const expectedAdjustment = calculateDailyCalorieAdjustment(
      input.monthlyWeightChangeKg,
    );

    expect(plan).not.toBeNull();
    expect(plan?.bmr).toBeCloseTo(expectedBmr, 5);
    expect(plan?.bmrIsEstimated).toBe(true);
    expect(plan?.maintenanceCalories).toBeCloseTo(expectedMaintenance, 5);
    expect(plan?.targetIntakeCalories).toBeCloseTo(
      expectedMaintenance + expectedAdjustment,
      5,
    );
  });

  it("increases the target above maintenance for a weight-gain goal", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 2,
    });

    expect(plan).not.toBeNull();
    expect(plan?.targetIntakeCalories).toBeGreaterThan(
      plan?.maintenanceCalories as number,
    );
  });

  it("decreases the target below maintenance for a weight-loss goal", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: -2,
    });

    expect(plan).not.toBeNull();
    expect(plan?.targetIntakeCalories).toBeLessThan(
      plan?.maintenanceCalories as number,
    );
  });

  it("keeps the target equal to maintenance for a zero (maintain) goal", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
    });

    expect(plan).not.toBeNull();
    expect(plan?.targetIntakeCalories).toBeCloseTo(
      plan?.maintenanceCalories as number,
      5,
    );
  });

  it("applies a higher activity factor for a higher activity level", () => {
    const low = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "sedentary",
      monthlyWeightChangeKg: 0,
    });
    const high = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "very_active",
      monthlyWeightChangeKg: 0,
    });

    expect(high?.maintenanceCalories).toBeGreaterThan(
      low?.maintenanceCalories as number,
    );
  });

  it("always includes the estimate disclaimer note", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: -1,
    });

    expect(plan?.notes.length).toBeGreaterThan(0);
  });

  it("adds an extra note when gender is 'other' and BMR is estimated", () => {
    const male = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
    });
    const other = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "other",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
    });

    expect(other?.notes.length).toBe((male?.notes.length ?? 0) + 1);
  });

  it("returns null when inputs are invalid", () => {
    const plan = buildDietPlan({
      weightKg: 0,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
    });

    expect(plan).toBeNull();
  });

  it("uses bmrOverrideKcal instead of the calculated BMR when provided", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
      bmrOverrideKcal: 1500,
    });

    expect(plan).not.toBeNull();
    expect(plan?.bmr).toBe(1500);
    expect(plan?.bmrIsEstimated).toBe(false);
    expect(plan?.maintenanceCalories).toBeCloseTo(1500 * 1.55, 5);
  });

  it("does not add the 'other gender' note when BMR is overridden", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "other",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
      bmrOverrideKcal: 1500,
    });

    expect(plan?.notes.length).toBe(2);
  });

  it("ignores height/age/gender validity when bmrOverrideKcal is provided", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 0,
      age: 0,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
      bmrOverrideKcal: 1600,
    });

    expect(plan).not.toBeNull();
    expect(plan?.bmr).toBe(1600);
  });

  it("returns null when bmrOverrideKcal is not positive", () => {
    const plan = buildDietPlan({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      monthlyWeightChangeKg: 0,
      bmrOverrideKcal: 0,
    });

    expect(plan).toBeNull();
  });
});
