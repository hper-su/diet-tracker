import { describe, expect, it } from "vitest";
import {
  CONDITIONS,
  CONDITION_CATEGORY_ORDER,
  PROTOCOL_CONDITIONS,
  getProtocolCondition,
  searchConditions,
} from "./conditions";
import { MOVEMENT_ICON_LABELS } from "./movement-icons";

describe("searchConditions", () => {
  it("returns all conditions for an empty query", () => {
    expect(searchConditions("")).toHaveLength(CONDITIONS.length);
  });

  it("returns all conditions for a whitespace-only query", () => {
    expect(searchConditions("   ")).toHaveLength(CONDITIONS.length);
  });

  it("matches by condition name", () => {
    const results = searchConditions("高血圧");
    expect(results.map((c) => c.id)).toContain("hypertension");
  });

  it("matches text inside precautions/medication/etc, not just the name", () => {
    const results = searchConditions("β遮断薬");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("hypertension");
    expect(ids).toContain("heart-disease");
  });

  it("is case-insensitive for ascii text", () => {
    const upper = searchConditions("NSAID");
    const lower = searchConditions("nsaid");
    expect(upper).toEqual(lower);
    expect(upper.length).toBeGreaterThan(0);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchConditions("存在しない疾患XYZ")).toEqual([]);
  });
});

describe("getProtocolCondition", () => {
  it("returns the condition for a known protocol id", () => {
    const condition = getProtocolCondition("lumbar");
    expect(condition?.symptomLabel).toBe("腰に違和感がある");
    expect(condition?.protocolTable.length).toBeGreaterThan(0);
  });

  it("returns undefined for an id without a protocol table", () => {
    expect(getProtocolCondition("hypertension")).toBeUndefined();
  });

  it("returns undefined for an unknown id", () => {
    expect(getProtocolCondition("not-a-real-condition")).toBeUndefined();
  });
});

describe("PROTOCOL_CONDITIONS", () => {
  it("only contains conditions that have both a protocolTable and a symptomLabel", () => {
    expect(PROTOCOL_CONDITIONS.length).toBeGreaterThan(0);
    for (const condition of PROTOCOL_CONDITIONS) {
      expect(condition.protocolTable.length).toBeGreaterThan(0);
      expect(condition.symptomLabel).toBeTruthy();
    }
  });

  it("matches every condition in CONDITIONS that defines protocolTable", () => {
    const expectedIds = CONDITIONS.filter((c) => c.protocolTable).map(
      (c) => c.id,
    );
    expect(PROTOCOL_CONDITIONS.map((c) => c.id).sort()).toEqual(
      expectedIds.sort(),
    );
  });
});

describe("CONDITIONS data integrity", () => {
  it("has unique ids", () => {
    const ids = CONDITIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique, sequential order numbers starting at 1", () => {
    const orders = CONDITIONS.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual(
      Array.from({ length: CONDITIONS.length }, (_, i) => i + 1),
    );
  });

  it("only uses known categories", () => {
    for (const condition of CONDITIONS) {
      expect(CONDITION_CATEGORY_ORDER).toContain(condition.category);
    }
  });

  it("references only movement icons that actually exist", () => {
    const knownIcons = new Set(Object.keys(MOVEMENT_ICON_LABELS));
    for (const condition of CONDITIONS) {
      for (const step of condition.protocolTable ?? []) {
        for (const movement of step.movements ?? []) {
          expect(knownIcons.has(movement)).toBe(true);
        }
      }
    }
  });
});
