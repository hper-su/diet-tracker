import { describe, expect, it } from "vitest";
import { pickMealCombo, type ComboCandidate } from "./meal-combo";

const CANDIDATES: ComboCandidate[] = [
  { label: "おにぎり(セブン)", kcal: 180, proteinG: 4, fatG: 1, carbG: 38 },
  { label: "サラダチキン(セブン)", kcal: 115, proteinG: 24, fatG: 1.5, carbG: 0.8 },
  { label: "海藻サラダ(セブン)", kcal: 25, proteinG: 2, fatG: 0.2, carbG: 4 },
  { label: "から揚げ弁当(セブン)", kcal: 850, proteinG: 30, fatG: 40, carbG: 90 },
  { label: "ゼロカロリー麦茶(セブン)", kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  { label: "チョコケーキ(セブン)", kcal: 420, proteinG: 5, fatG: 25, carbG: 45 },
];

describe("pickMealCombo", () => {
  it("selects a combination that reasonably approaches the target", () => {
    const result = pickMealCombo(CANDIDATES, {
      proteinG: 30,
      fatG: 15,
      carbG: 60,
    });
    // 目標kcal(30*4+15*9+60*4=495)に近い組み合わせが選ばれる。
    expect(result.kcal).toBeGreaterThan(300);
    expect(result.kcal).toBeLessThan(700);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("does not pick the same item twice", () => {
    const result = pickMealCombo(CANDIDATES, {
      proteinG: 60,
      fatG: 30,
      carbG: 120,
    });
    const labels = result.items.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("never selects more than 4 items", () => {
    const result = pickMealCombo(CANDIDATES, {
      proteinG: 100,
      fatG: 80,
      carbG: 200,
    });
    expect(result.items.length).toBeLessThanOrEqual(4);
  });

  it("avoids grossly overshooting a small target with a single huge item", () => {
    // から揚げ弁当(850kcal)だけだと、小さめの目標(約200kcal)を大きく超えてしまう。
    // より小さい候補(海藻サラダなど)が優先して選ばれることを確認する。
    const result = pickMealCombo(CANDIDATES, {
      proteinG: 8,
      fatG: 3,
      carbG: 25,
    });
    expect(result.items.map((item) => item.label)).not.toContain(
      "から揚げ弁当(セブン)",
    );
  });

  it("returns an empty combo when given no candidates", () => {
    const result = pickMealCombo([], { proteinG: 30, fatG: 15, carbG: 60 });
    expect(result.items).toEqual([]);
    expect(result.kcal).toBe(0);
  });

  it("totals match the sum of the chosen items", () => {
    const result = pickMealCombo(CANDIDATES, {
      proteinG: 30,
      fatG: 15,
      carbG: 60,
    });
    const summedKcal = result.items.reduce((sum, item) => sum + item.kcal, 0);
    expect(result.kcal).toBeCloseTo(summedKcal, 5);
  });
});
