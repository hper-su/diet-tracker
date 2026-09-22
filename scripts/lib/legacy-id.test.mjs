import { describe, expect, it } from "vitest";
import { isLegacyNumericId } from "./legacy-id.mjs";

describe("isLegacyNumericId", () => {
  it("treats a plain numeric id as legacy", () => {
    expect(isLegacyNumericId("10")).toBe(true);
    expect(isLegacyNumericId("0")).toBe(true);
  });

  it("treats a Firestore-style random id as not legacy", () => {
    expect(isLegacyNumericId("oDxAyzBmseSvOBCOkjmr")).toBe(false);
    expect(isLegacyNumericId("mIi2q0ihX7emCElnu8Gb")).toBe(false);
  });

  it("treats an id that merely starts with digits as not legacy", () => {
    expect(isLegacyNumericId("123abc")).toBe(false);
  });

  it("treats an empty string as not legacy", () => {
    expect(isLegacyNumericId("")).toBe(false);
  });
});
