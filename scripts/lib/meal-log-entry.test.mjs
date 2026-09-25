import { describe, expect, it } from "vitest";
import {
  parseArgs,
  normalizeEntry,
  MEAL_TYPE_ALIASES,
  mealLogDuplicateKey,
  splitDuplicates,
} from "./meal-log-entry.mjs";

describe("parseArgs", () => {
  it("reads a flag with a following value", () => {
    expect(parseArgs(["--client", "望月"])).toEqual({ client: "望月" });
  });

  it("treats a flag with no following value as true", () => {
    expect(parseArgs(["--dry-run"])).toEqual({ "dry-run": true });
  });

  it("treats a flag followed by another flag as true (value omitted)", () => {
    expect(parseArgs(["--qty", "--kcal", "100"])).toEqual({ qty: true, kcal: "100" });
  });

  it("ignores tokens that are not flags", () => {
    expect(parseArgs(["positional", "--foo", "bar"])).toEqual({ foo: "bar" });
  });
});

function baseEntry(overrides = {}) {
  return {
    client: "望月",
    date: "2026-09-22",
    meal: "lunch",
    food: "鶏胸肉のグリル",
    kcal: 300,
    protein: 60,
    fat: 5,
    carb: 0,
    ...overrides,
  };
}

describe("normalizeEntry", () => {
  it("accepts a fully-valid entry and defaults qty to 1", () => {
    const result = normalizeEntry(baseEntry(), 0);
    expect(result).toMatchObject({
      clientQuery: "望月",
      recordedAt: "2026-09-22",
      mealType: "lunch",
      foodName: "鶏胸肉のグリル",
      quantity: 1,
      kcal: 300,
      proteinG: 60,
      fatG: 5,
      carbG: 0,
      memo: null,
    });
  });

  it("accepts Japanese meal type aliases", () => {
    expect(Object.keys(MEAL_TYPE_ALIASES)).toContain("朝食");
    const result = normalizeEntry(baseEntry({ meal: "朝食" }), 0);
    expect(result.mealType).toBe("breakfast");
  });

  it("throws when client is missing", () => {
    expect(() => normalizeEntry(baseEntry({ client: undefined }), 0)).toThrow(/client/);
  });

  it("throws when date is not in YYYY-MM-DD format", () => {
    expect(() => normalizeEntry(baseEntry({ date: "2026/09/22" }), 0)).toThrow(/date/);
  });

  it("throws when meal type is not recognized", () => {
    expect(() => normalizeEntry(baseEntry({ meal: "おやつ" }), 0)).toThrow(/meal/);
  });

  it("throws when food is missing", () => {
    expect(() => normalizeEntry(baseEntry({ food: undefined }), 0)).toThrow(/food/);
  });

  it("accepts an explicit positive qty", () => {
    expect(normalizeEntry(baseEntry({ qty: 2 }), 0).quantity).toBe(2);
  });

  it("throws when qty is a bare flag with no value (parseArgs gives true)", () => {
    expect(() => normalizeEntry(baseEntry({ qty: true }), 0)).toThrow(/qty/);
  });

  it("throws when qty is zero or negative", () => {
    expect(() => normalizeEntry(baseEntry({ qty: 0 }), 0)).toThrow(/qty/);
    expect(() => normalizeEntry(baseEntry({ qty: -1 }), 0)).toThrow(/qty/);
  });

  it("accepts zero kcal/PFC (e.g. black coffee)", () => {
    const result = normalizeEntry(
      baseEntry({ kcal: 0, protein: 0, fat: 0, carb: 0 }),
      0,
    );
    expect(result.kcal).toBe(0);
  });

  it("throws when kcal is negative", () => {
    expect(() => normalizeEntry(baseEntry({ kcal: -5 }), 0)).toThrow(/kcal/);
  });

  it("throws when protein/fat/carb is negative", () => {
    expect(() => normalizeEntry(baseEntry({ protein: -1 }), 0)).toThrow(/protein/);
    expect(() => normalizeEntry(baseEntry({ fat: -1 }), 0)).toThrow(/fat/);
    expect(() => normalizeEntry(baseEntry({ carb: -1 }), 0)).toThrow(/carb/);
  });

  it("throws when a numeric field is missing", () => {
    expect(() => normalizeEntry(baseEntry({ kcal: undefined }), 0)).toThrow(/kcal/);
  });

  it("keeps a non-empty memo, and normalizes an empty/absent memo to null", () => {
    expect(normalizeEntry(baseEntry({ memo: "AI推定値" }), 0).memo).toBe("AI推定値");
    expect(normalizeEntry(baseEntry({ memo: "" }), 0).memo).toBeNull();
    expect(normalizeEntry(baseEntry(), 0).memo).toBeNull();
  });

  it("includes the 1-based entry number in error messages", () => {
    expect(() => normalizeEntry(baseEntry({ client: undefined }), 2)).toThrow(/3件目/);
  });
});

describe("splitDuplicates", () => {
  const log = (overrides = {}) => ({
    clientId: "c1",
    recordedAt: "2026-09-25",
    mealType: "lunch",
    foodName: "味噌汁",
    quantity: 1,
    kcal: 70,
    proteinG: 4.5,
    fatG: 3,
    carbG: 6,
    ...overrides,
  });

  it("treats everything as fresh when nothing is registered yet", () => {
    const toInsert = [log(), log({ foodName: "ご飯" })];
    expect(splitDuplicates(toInsert, [])).toEqual({ fresh: toInsert, duplicates: [] });
  });

  it("skips an entry identical to an existing log", () => {
    const toInsert = [log(), log({ foodName: "ご飯" })];
    const result = splitDuplicates(toInsert, [{ ...log(), memo: null, foodId: null }]);
    expect(result.duplicates).toEqual([toInsert[0]]);
    expect(result.fresh).toEqual([toInsert[1]]);
  });

  it("does not treat the same food in a different meal as a duplicate", () => {
    const result = splitDuplicates([log({ mealType: "dinner" })], [log()]);
    expect(result.duplicates).toEqual([]);
  });

  it("does not treat a different client, date, or nutrient value as a duplicate", () => {
    const toInsert = [log({ clientId: "c2" }), log({ recordedAt: "2026-09-26" }), log({ kcal: 71 })];
    expect(splitDuplicates(toInsert, [log()]).fresh).toEqual(toInsert);
  });

  it("matches counts, so a second identical entry beyond the existing one is fresh", () => {
    const toInsert = [log(), log()];
    const result = splitDuplicates(toInsert, [log()]);
    expect(result.duplicates).toHaveLength(1);
    expect(result.fresh).toHaveLength(1);
  });

  it("supports a custom key function for wrapped items", () => {
    const wrapped = [{ clientId: "c1", entry: log() }];
    const result = splitDuplicates(wrapped, [log()], ({ clientId, entry }) =>
      mealLogDuplicateKey({ ...entry, clientId }),
    );
    expect(result.duplicates).toEqual(wrapped);
  });
});
