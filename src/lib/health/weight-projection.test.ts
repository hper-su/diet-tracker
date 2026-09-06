import { describe, expect, it } from "vitest";
import { projectWeightAchievement } from "./weight-projection";

describe("projectWeightAchievement", () => {
  it("projects an achievement date for a weight-loss pace", () => {
    // 差分-5kg ÷ -1kg/月 = 5か月 = 150日
    const result = projectWeightAchievement({
      latestWeightKg: 60,
      latestDate: "2026-01-01",
      monthlyRateKg: -1,
      targetWeightKg: 55,
    });
    expect(result).toEqual({
      achievementDate: "2026-05-31",
      monthsNeeded: 5,
    });
  });

  it("projects an achievement date for a weight-gain pace", () => {
    // 差分+4kg ÷ +2kg/月 = 2か月 = 60日
    const result = projectWeightAchievement({
      latestWeightKg: 60,
      latestDate: "2026-01-01",
      monthlyRateKg: 2,
      targetWeightKg: 64,
    });
    expect(result).toEqual({
      achievementDate: "2026-03-02",
      monthsNeeded: 2,
    });
  });

  it("returns the latest date immediately when already at the target", () => {
    const result = projectWeightAchievement({
      latestWeightKg: 60,
      latestDate: "2026-01-01",
      monthlyRateKg: -1,
      targetWeightKg: 60,
    });
    expect(result).toEqual({ achievementDate: "2026-01-01", monthsNeeded: 0 });
  });

  it("returns null when the pace moves away from the target", () => {
    // 減量ペースなのに目標が現在より重い(遠ざかっている)
    const result = projectWeightAchievement({
      latestWeightKg: 60,
      latestDate: "2026-01-01",
      monthlyRateKg: -1,
      targetWeightKg: 65,
    });
    expect(result).toBeNull();
  });

  it("returns null when the pace is 0 and the target differs from the current weight", () => {
    const result = projectWeightAchievement({
      latestWeightKg: 60,
      latestDate: "2026-01-01",
      monthlyRateKg: 0,
      targetWeightKg: 55,
    });
    expect(result).toBeNull();
  });
});
