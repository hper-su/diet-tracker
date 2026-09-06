import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDaysISODate,
  listISODateRange,
  toISODate,
  todayISODate,
} from "./date";

describe("toISODate", () => {
  it("formats a UTC date as YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-07-09T00:00:00.000Z"))).toBe(
      "2026-07-09",
    );
  });

  it("pads single-digit months and days", () => {
    expect(toISODate(new Date("2026-01-05T12:00:00.000Z"))).toBe(
      "2026-01-05",
    );
  });

  it("truncates the time component", () => {
    expect(toISODate(new Date("2026-07-09T23:59:59.999Z"))).toBe(
      "2026-07-09",
    );
  });
});

describe("todayISODate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current date formatted as YYYY-MM-DD", () => {
    vi.setSystemTime(new Date("2026-07-09T03:00:00.000Z"));

    expect(todayISODate()).toBe("2026-07-09");
  });

  // toISOString()ベースの実装に戻すとこのテストが壊れる。UTCとローカルの
  // 暦日がずれる時刻(UTC 20時台)で確認することで、実行環境のタイムゾーンに
  // 関わらず「ローカルの暦日」が返っていることを検証する
  // (期待値はtoLocaleDateStringという別経路で独立に算出している)。
  it("uses the local calendar date, not the UTC date", () => {
    const systemTime = new Date("2026-07-09T20:00:00.000Z");
    vi.setSystemTime(systemTime);

    const [month, day, year] = systemTime
      .toLocaleDateString("en-US")
      .split("/");
    const expected = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    expect(todayISODate()).toBe(expected);
  });
});

describe("addDaysISODate", () => {
  it("adds positive days", () => {
    expect(addDaysISODate("2026-07-09", 1)).toBe("2026-07-10");
  });

  it("subtracts with negative days", () => {
    expect(addDaysISODate("2026-07-09", -1)).toBe("2026-07-08");
  });

  it("rolls over month and year boundaries", () => {
    expect(addDaysISODate("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysISODate("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("returns the same date when adding zero days", () => {
    expect(addDaysISODate("2026-07-09", 0)).toBe("2026-07-09");
  });
});

describe("listISODateRange", () => {
  it("lists every date between from and to, inclusive", () => {
    expect(listISODateRange("2026-07-09", "2026-07-12")).toEqual([
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });

  it("returns a single-element array when from equals to", () => {
    expect(listISODateRange("2026-07-09", "2026-07-09")).toEqual([
      "2026-07-09",
    ]);
  });

  it("returns an empty array when from is after to", () => {
    expect(listISODateRange("2026-07-10", "2026-07-09")).toEqual([]);
  });
});
