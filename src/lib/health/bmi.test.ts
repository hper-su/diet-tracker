import { describe, expect, it } from "vitest";
import { calculateBMI, calculateNormalWeightRange } from "./bmi";

describe("calculateBMI", () => {
  it("calculates BMI from weight and height, truncated to 2 decimal places", () => {
    const bmi = calculateBMI({ weightKg: 70, heightCm: 170 });
    expect(bmi).toBe(24.22);
  });

  it("calculates BMI 22 for a textbook example (65kg, 172cm)", () => {
    const bmi = calculateBMI({ weightKg: 65.09, heightCm: 172 });
    expect(bmi).toBeCloseTo(22, 1);
  });

  it("truncates (floors) rather than rounds at the 2nd decimal place", () => {
    // Raw value is ~25.895317..., which would round to 25.90 but must truncate to 25.89.
    const bmi = calculateBMI({ weightKg: 70.5, heightCm: 165 });
    expect(bmi).toBe(25.89);
  });

  it("returns null when weight is zero or negative", () => {
    expect(calculateBMI({ weightKg: 0, heightCm: 170 })).toBeNull();
    expect(calculateBMI({ weightKg: -1, heightCm: 170 })).toBeNull();
  });

  it("returns null when height is zero or negative", () => {
    expect(calculateBMI({ weightKg: 70, heightCm: 0 })).toBeNull();
    expect(calculateBMI({ weightKg: 70, heightCm: -1 })).toBeNull();
  });
});

describe("calculateNormalWeightRange", () => {
  it("calculates the BMI18-25 weight range (and BMI21.5 midpoint) for 170cm", () => {
    const range = calculateNormalWeightRange(170);
    expect(range).toEqual({ minKg: 52, midKg: 62.1, maxKg: 72.2 });
  });

  it("calculates the BMI18-25 weight range (and BMI21.5 midpoint) for 158cm", () => {
    const range = calculateNormalWeightRange(158);
    expect(range).toEqual({ minKg: 44.9, midKg: 53.7, maxKg: 62.4 });
  });

  it("produces boundaries and a midpoint that round-trip back to BMI ~18, ~21.5, and ~25", () => {
    const range = calculateNormalWeightRange(165)!;
    expect(calculateBMI({ weightKg: range.minKg, heightCm: 165 })).toBeCloseTo(
      18,
      1,
    );
    expect(calculateBMI({ weightKg: range.midKg, heightCm: 165 })).toBeCloseTo(
      21.5,
      1,
    );
    expect(calculateBMI({ weightKg: range.maxKg, heightCm: 165 })).toBeCloseTo(
      25,
      1,
    );
  });

  it("places the midpoint exactly between min and max", () => {
    const range = calculateNormalWeightRange(172)!;
    expect(range.midKg).toBeCloseTo((range.minKg + range.maxKg) / 2, 1);
  });

  it("returns null when height is zero or negative", () => {
    expect(calculateNormalWeightRange(0)).toBeNull();
    expect(calculateNormalWeightRange(-170)).toBeNull();
  });
});
