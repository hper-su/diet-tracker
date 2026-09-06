import { describe, expect, it } from "vitest";
import { calculateBMR } from "./bmr";

describe("calculateBMR", () => {
  it("calculates BMR for a male using the Mifflin-St Jeor formula", () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
    const result = calculateBMR({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: "male",
    });
    expect(result).toBeCloseTo(1648.75, 5);
  });

  it("calculates BMR for a female using the Mifflin-St Jeor formula", () => {
    // 10*60 + 6.25*160 - 5*25 - 161 = 600 + 1000 - 125 - 161 = 1314
    const result = calculateBMR({
      weightKg: 60,
      heightCm: 160,
      age: 25,
      gender: "female",
    });
    expect(result).toBeCloseTo(1314, 5);
  });

  it("uses the average of the male/female constants for 'other'", () => {
    const base = { weightKg: 65, heightCm: 168, age: 40 };
    const male = calculateBMR({ ...base, gender: "male" }) as number;
    const female = calculateBMR({ ...base, gender: "female" }) as number;
    const other = calculateBMR({ ...base, gender: "other" }) as number;

    expect(other).toBeCloseTo((male + female) / 2, 5);
  });

  it("returns null when weight, height, or age is not positive", () => {
    const base = { weightKg: 70, heightCm: 175, age: 30, gender: "male" as const };
    expect(calculateBMR({ ...base, weightKg: 0 })).toBeNull();
    expect(calculateBMR({ ...base, heightCm: 0 })).toBeNull();
    expect(calculateBMR({ ...base, age: 0 })).toBeNull();
    expect(calculateBMR({ ...base, weightKg: -1 })).toBeNull();
  });
});
