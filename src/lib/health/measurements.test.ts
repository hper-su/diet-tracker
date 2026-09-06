import { describe, expect, it } from "vitest";
import { findLatestNonNull } from "./measurements";

type Measurement = {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
};

describe("findLatestNonNull", () => {
  it("returns the record with the latest date that has a non-null field", () => {
    const records: Measurement[] = [
      { recordedAt: "2026-07-01", weightKg: 70, bodyFatPct: 20 },
      { recordedAt: "2026-07-05", weightKg: null, bodyFatPct: 19 },
      { recordedAt: "2026-07-03", weightKg: 69, bodyFatPct: null },
    ];

    expect(findLatestNonNull(records, "weightKg")).toEqual(records[2]);
    expect(findLatestNonNull(records, "bodyFatPct")).toEqual(records[1]);
  });

  it("is independent of input array order", () => {
    const ascending: Measurement[] = [
      { recordedAt: "2026-07-01", weightKg: 70, bodyFatPct: null },
      { recordedAt: "2026-07-03", weightKg: 69, bodyFatPct: null },
    ];
    const descending = [...ascending].reverse();

    expect(findLatestNonNull(ascending, "weightKg")).toEqual(ascending[1]);
    expect(findLatestNonNull(descending, "weightKg")).toEqual(ascending[1]);
  });

  it("skips null entries and falls back to an earlier non-null record", () => {
    const records: Measurement[] = [
      { recordedAt: "2026-07-01", weightKg: 70, bodyFatPct: null },
      { recordedAt: "2026-07-10", weightKg: null, bodyFatPct: null },
    ];

    expect(findLatestNonNull(records, "weightKg")).toEqual(records[0]);
  });

  it("returns null when every record has a null value for the field", () => {
    const records: Measurement[] = [
      { recordedAt: "2026-07-01", weightKg: null, bodyFatPct: null },
    ];

    expect(findLatestNonNull(records, "weightKg")).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(findLatestNonNull<Measurement, "weightKg">([], "weightKg")).toBeNull();
  });
});
