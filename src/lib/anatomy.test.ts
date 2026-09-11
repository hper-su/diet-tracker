import { describe, expect, it } from "vitest";
import { ANATOMY_PARTS, searchAnatomyParts } from "./anatomy";

describe("searchAnatomyParts", () => {
  it("returns all parts for an empty query", () => {
    expect(searchAnatomyParts(ANATOMY_PARTS, "")).toHaveLength(
      ANATOMY_PARTS.length,
    );
  });

  it("returns all parts for a whitespace-only query", () => {
    expect(searchAnatomyParts(ANATOMY_PARTS, "   ")).toHaveLength(
      ANATOMY_PARTS.length,
    );
  });

  it("matches by exact name", () => {
    const results = searchAnatomyParts(ANATOMY_PARTS, "大胸筋");
    expect(results.map((p) => p.id)).toContain("pectoralis-major");
  });

  it("matches by partial reading (furigana)", () => {
    const results = searchAnatomyParts(ANATOMY_PARTS, "はむすと");
    expect(results.map((p) => p.id)).toContain("hamstrings");
  });

  it("matches by category", () => {
    const results = searchAnatomyParts(ANATOMY_PARTS, "背部");
    expect(results.every((p) => p.category === "背部")).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("matches by description text", () => {
    const results = searchAnatomyParts(ANATOMY_PARTS, "力こぶ");
    expect(results.map((p) => p.id)).toContain("biceps-brachii");
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchAnatomyParts(ANATOMY_PARTS, "存在しない部位XYZ")).toEqual([]);
  });

  it("is case-insensitive for ascii text", () => {
    const upper = searchAnatomyParts(ANATOMY_PARTS, "SLR");
    const lower = searchAnatomyParts(ANATOMY_PARTS, "slr");
    expect(upper).toEqual(lower);
  });
});

describe("ANATOMY_PARTS data integrity", () => {
  it("has unique ids", () => {
    const ids = ANATOMY_PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

});
