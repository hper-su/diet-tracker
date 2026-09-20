import { describe, expect, it } from "vitest";
import {
  calculateDailyAdjustment,
  calculateMealLogAmounts,
  fillDailyMealTotals,
  sumMealLogAmounts,
} from "./meal-totals";

describe("calculateMealLogAmounts", () => {
  it("scales the base amounts by quantity", () => {
    const result = calculateMealLogAmounts(
      { kcal: 200, proteinG: 10, fatG: 5, carbG: 30 },
      1.5,
    );
    expect(result).toEqual({ kcal: 300, proteinG: 15, fatG: 7.5, carbG: 45 });
  });

  it("returns zero amounts for zero quantity", () => {
    const result = calculateMealLogAmounts(
      { kcal: 200, proteinG: 10, fatG: 5, carbG: 30 },
      0,
    );
    expect(result).toEqual({ kcal: 0, proteinG: 0, fatG: 0, carbG: 0 });
  });
});

describe("sumMealLogAmounts", () => {
  it("sums multiple entries", () => {
    const result = sumMealLogAmounts([
      { kcal: 300, proteinG: 15, fatG: 7.5, carbG: 45 },
      { kcal: 500, proteinG: 30, fatG: 20, carbG: 40 },
    ]);
    expect(result).toEqual({ kcal: 800, proteinG: 45, fatG: 27.5, carbG: 85 });
  });

  it("returns all zeros for an empty list", () => {
    expect(sumMealLogAmounts([])).toEqual({
      kcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
    });
  });
});

describe("fillDailyMealTotals", () => {
  const dates = ["2026-07-09", "2026-07-10", "2026-07-11"];

  it("keeps totals for dates that have records", () => {
    const totals = [
      { recordedAt: "2026-07-09", kcal: 1800, proteinG: 90, fatG: 50, carbG: 200 },
      { recordedAt: "2026-07-11", kcal: 2000, proteinG: 100, fatG: 60, carbG: 220 },
    ];
    expect(fillDailyMealTotals(totals, dates)).toEqual([
      { recordedAt: "2026-07-09", kcal: 1800, proteinG: 90, fatG: 50, carbG: 200 },
      { recordedAt: "2026-07-10", kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
      { recordedAt: "2026-07-11", kcal: 2000, proteinG: 100, fatG: 60, carbG: 220 },
    ]);
  });

  it("fills every date with zero when there are no records", () => {
    expect(fillDailyMealTotals([], dates)).toEqual([
      { recordedAt: "2026-07-09", kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
      { recordedAt: "2026-07-10", kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
      { recordedAt: "2026-07-11", kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
    ]);
  });
});

describe("calculateDailyAdjustment", () => {
  const base = { kcal: 1500, proteinG: 80, fatG: 50, carbG: 180 };

  it("total mode: returns the diff from item totals, negative allowed", () => {
    const r = calculateDailyAdjustment(
      base,
      base,
      { kcal: 1400, proteinG: 90, fatG: null, carbG: 180 },
      "total",
    );
    expect(r).toEqual({ kcal: -100, proteinG: 10, fatG: 0, carbG: 0 });
  });

  it("delta mode: adds to the current total including the existing adjustment", () => {
    const current = { kcal: 1600, proteinG: 80, fatG: 50, carbG: 180 };
    const r = calculateDailyAdjustment(
      base,
      current,
      { kcal: -50, proteinG: null, fatG: null, carbG: null },
      "delta",
    );
    expect(r).toEqual({ kcal: 50, proteinG: 0, fatG: 0, carbG: 0 });
  });
});
