import { describe, expect, it } from "vitest";
import { getBodyAverageForGender } from "./body-averages";

describe("getBodyAverageForGender", () => {
  it("returns the average height/weight for male", () => {
    expect(getBodyAverageForGender("male")).toEqual({
      heightCm: 171.0,
      weightKg: 68.0,
    });
  });

  it("returns the average height/weight for female", () => {
    expect(getBodyAverageForGender("female")).toEqual({
      heightCm: 158.0,
      weightKg: 53.0,
    });
  });

  it("returns null for 'other' or unknown genders", () => {
    expect(getBodyAverageForGender("other")).toBeNull();
    expect(getBodyAverageForGender("")).toBeNull();
    expect(getBodyAverageForGender("unknown")).toBeNull();
  });
});
