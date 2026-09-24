import { describe, expect, it } from "vitest";
import { parsePeakNumber } from "./training-progress";

describe("parsePeakNumber", () => {
  it("parses a plain integer", () => {
    expect(parsePeakNumber("60")).toBe(60);
  });

  it("parses a decimal", () => {
    expect(parsePeakNumber("62.5")).toBe(62.5);
  });

  it("takes the max of a comma-separated drop set", () => {
    expect(parsePeakNumber("25,20")).toBe(25);
  });

  it("takes the max of a hyphen-separated rep scheme", () => {
    expect(parsePeakNumber("10-8-6")).toBe(10);
  });

  it("ignores trailing non-numeric annotation", () => {
    expect(parsePeakNumber("15(同上)")).toBe(15);
  });

  it("returns null for an empty string", () => {
    expect(parsePeakNumber("")).toBeNull();
  });

  it("returns null when there is no number at all", () => {
    expect(parsePeakNumber("自重")).toBeNull();
  });
});
