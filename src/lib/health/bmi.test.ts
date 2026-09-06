import { describe, expect, it } from "vitest";
import { calculateBMI } from "./bmi";

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
