import { describe, expect, it } from "vitest";
import { calculateAge, isBirthdayToday } from "./age";

describe("calculateAge", () => {
  it("calculates age when the birthday has already passed this year", () => {
    expect(calculateAge("1990-01-01", new Date("2026-07-09"))).toBe(36);
  });

  it("calculates age when the birthday is later this year", () => {
    expect(calculateAge("1990-12-31", new Date("2026-07-09"))).toBe(35);
  });

  it("calculates age on the exact birthday", () => {
    expect(calculateAge("1990-07-09", new Date("2026-07-09"))).toBe(36);
  });

  it("calculates age the day before the birthday", () => {
    expect(calculateAge("1990-07-10", new Date("2026-07-09"))).toBe(35);
  });

  it("returns null for an invalid date string", () => {
    expect(calculateAge("not-a-date", new Date("2026-07-09"))).toBeNull();
  });
});

describe("isBirthdayToday", () => {
  it("returns true when month and day match, regardless of year", () => {
    expect(isBirthdayToday("1990-07-09", new Date("2026-07-09"))).toBe(true);
  });

  it("returns false when the day differs", () => {
    expect(isBirthdayToday("1990-07-08", new Date("2026-07-09"))).toBe(false);
  });

  it("returns false when the month differs", () => {
    expect(isBirthdayToday("1990-08-09", new Date("2026-07-09"))).toBe(false);
  });

  it("returns false for an invalid date string", () => {
    expect(isBirthdayToday("not-a-date", new Date("2026-07-09"))).toBe(false);
  });
});
