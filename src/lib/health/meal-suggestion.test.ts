import { describe, expect, it } from "vitest";
import {
  buildMealMenu,
  buildMealTemplates,
  type MealSuggestionIngredients,
} from "./meal-suggestion";

// このテストはbuildMealMenu/buildMealTemplatesの「アルゴリズム」を検証するもので、
// 実際の食品マスタの内容には依存しない(本番の食品マスタからの取得はsrc/lib/server/
// meal-templates.tsが担う)。そのため、固定値の食材一式(fixture)を用意して使う。
const FIXTURE_INGREDIENTS: MealSuggestionIngredients = {
  wholeWheatBread: { label: "全粒粉パン", kcal: 251, proteinG: 7.9, fatG: 5.7, carbG: 45.5 },
  friedEgg: { label: "目玉焼き", kcal: 205, proteinG: 14.8, fatG: 17.6, carbG: 0.3 },
  grilledSalmon: { label: "鮭(切り身)", kcal: 124, proteinG: 22.3, fatG: 4.1, carbG: 0.1 },
  broccoliSide: { label: "ブロッコリーのごま和え", kcal: 70, proteinG: 4.5, fatG: 3.8, carbG: 6.5 },
  tomato: { label: "ミニトマト", kcal: 30, proteinG: 1.1, fatG: 0.1, carbG: 7.2 },
  brownRice: { label: "玄米ご飯", kcal: 152, proteinG: 2.8, fatG: 1, carbG: 32 },
  chickenBreast: { label: "鶏むね肉(皮なし)", kcal: 105, proteinG: 23.3, fatG: 1.9, carbG: 0.1 },
  porkLoin: { label: "豚ロース(脂身つき)", kcal: 248, proteinG: 19.3, fatG: 19.2, carbG: 0.2 },
  boiledSpinach: { label: "ほうれん草お浸し", kcal: 28.6, proteinG: 2.3, fatG: 0.3, carbG: 3 },
  misoSoup: { label: "味噌汁", kcal: 26.7, proteinG: 1.7, fatG: 0.8, carbG: 3 },
  whiteRice: { label: "白米ご飯", kcal: 156, proteinG: 2.5, fatG: 0.3, carbG: 34.6 },
  chickenThigh: { label: "鶏もも肉(皮つき)", kcal: 190, proteinG: 16.6, fatG: 14.2, carbG: 0 },
  saladChicken: { label: "サラダチキン(セブン)", kcal: 114, proteinG: 24.1, fatG: 2, carbG: 0 },
  tofu: { label: "絹ごし豆腐", kcal: 56, proteinG: 5.3, fatG: 3.5, carbG: 2 },
  mushroomSaute: { label: "きのこのソテー", kcal: 65, proteinG: 3, fatG: 5.5, carbG: 4.8 },
  extraCarb: { label: "おにぎり(追加)", kcal: 170, proteinG: 2.7, fatG: 0.3, carbG: 37.1 },
  extraProtein: { label: "ゆで卵(追加)", kcal: 151, proteinG: 12.6, fatG: 10.6, carbG: 0.3 },
  lowCarbBread: { label: "ブランパン(糖質オフ)", kcal: 245, proteinG: 18, fatG: 9.5, carbG: 20 },
  saltGrilledSalmon: { label: "鮭の塩焼き(皮つき)", kcal: 220, proteinG: 25.5, fatG: 12.8, carbG: 0.1 },
  chickenThighGrill: { label: "鶏もも肉のグリル(皮つき)", kcal: 235, proteinG: 26.4, fatG: 14.2, carbG: 0 },
  porkShoulderLoin: { label: "豚肩ロースのソテー", kcal: 269, proteinG: 22.7, fatG: 19.2, carbG: 0.3 },
  avocado: { label: "アボカド", kcal: 178, proteinG: 2.1, fatG: 17.5, carbG: 7.9 },
  cheese: { label: "プロセスチーズ", kcal: 313, proteinG: 22.7, fatG: 26, carbG: 1.3 },
  extraLowCarbBread: { label: "ブランパン(追加)", kcal: 245, proteinG: 18, fatG: 9.5, carbG: 20 },
  natto: { label: "納豆", kcal: 190, proteinG: 16.5, fatG: 10, carbG: 12.1 },
  banana: { label: "バナナ", kcal: 86, proteinG: 1.1, fatG: 0.2, carbG: 22.5 },
  mixedNuts: { label: "素焼きミックスナッツ", kcal: 609, proteinG: 20, fatG: 54.2, carbG: 18.9 },
  beefLoin: { label: "牛肩ロースのグリル", kcal: 271, proteinG: 23.6, fatG: 17.4, carbG: 0.2 },
};

const {
  BREAKFAST_TEMPLATE,
  LUNCH_TEMPLATE,
  DINNER_TEMPLATE,
  MEAL_TEMPLATES_BY_GOAL,
} = buildMealTemplates(FIXTURE_INGREDIENTS);

describe("buildMealMenu", () => {
  it("includes all side dishes from the template for a standard (mid-range) target", () => {
    // proteinG/fatG/carbGから見積もる1食kcalが「少なめ」の閾値を超えるよう、
    // essential:falseの副菜(ミニトマト)が対象外にならない目標値にする。
    const result = buildMealMenu(BREAKFAST_TEMPLATE, {
      proteinG: 30,
      fatG: 20,
      carbG: 50,
    });
    const labels = result.items.map((item) => item.label);
    expect(labels).toContain("ブロッコリーのごま和え");
    expect(labels).toContain("ミニトマト");
  });

  it("scales the main carb source to hit the remaining carb target after sides", () => {
    // LUNCH_TEMPLATEの副菜(ほうれん草お浸し70g・味噌汁150ml)分の炭水化物(6.6g)を
    // 差し引いた残りが、玄米ご飯100g分ちょうど(32g)になるように目標を設定する。
    // proteinG/fatGは「標準」の1食kcal帯に収まるようにするための値。
    const sideCarbG = 70 * (3 / 100) + 150 * (3 / 100);
    const result = buildMealMenu(LUNCH_TEMPLATE, {
      proteinG: 40,
      fatG: 20,
      carbG: sideCarbG + 32,
    });
    const riceItem = result.items.find((item) => item.label === "玄米ご飯");
    expect(riceItem?.grams).toBeCloseTo(100, 0);
  });

  it("subtracts side dishes' protein before sizing the main protein item", () => {
    // DINNER_TEMPLATEをfatG/carbG=0で呼ぶと1食kcal見積もりが「少なめ」判定になり、
    // essential:falseの副菜(きのこのソテー)が外れるため、副菜は絹ごし豆腐100g分の
    // たんぱく質(5.3g)だけになる。これを差し引いた残りを、サラダチキンで満たす。
    const result = buildMealMenu(DINNER_TEMPLATE, {
      proteinG: 23.4,
      fatG: 0,
      carbG: 0,
    });
    const proteinItem = result.items.find(
      (item) => item.label === "サラダチキン(セブン)",
    );
    expect(proteinItem?.grams).toBeCloseTo(75, 0);
  });

  it("never returns negative grams for any item", () => {
    const result = buildMealMenu(BREAKFAST_TEMPLATE, {
      proteinG: 5,
      fatG: 5,
      carbG: 5,
    });
    for (const item of result.items) {
      expect(item.grams).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns a total kcal consistent with the sum of its items", () => {
    const result = buildMealMenu(LUNCH_TEMPLATE, {
      proteinG: 30,
      fatG: 15,
      carbG: 60,
    });
    const itemTotal = result.items.reduce((sum, item) => sum + item.kcal, 0);
    expect(result.kcal).toBeCloseTo(itemTotal, 5);
  });

  it("caps the main fat item (目玉焼き) at a realistic upper bound for a very large fat target", () => {
    // 目玉焼き(たんぱく質密度14.8g/100g)はmainProteinには使わないが、
    // mainFatとして逆算する場合も、非現実的な量にならないよう上限(200g)で頭打ちにする。
    const result = buildMealMenu(BREAKFAST_TEMPLATE, {
      proteinG: 60,
      fatG: 200,
      carbG: 40,
    });
    const eggItem = result.items.find((item) => item.label === "目玉焼き");
    expect(eggItem?.grams).toBe(200);
  });

  it("sizes the breakfast main protein (鮭) from a high-density food instead", () => {
    const result = buildMealMenu(BREAKFAST_TEMPLATE, {
      proteinG: 60,
      fatG: 30,
      carbG: 40,
    });
    const salmonItem = result.items.find((item) => item.label === "鮭(切り身)");
    expect(salmonItem).toBeDefined();
    expect(salmonItem!.grams).toBeLessThan(250);
  });

  describe("MEAL_TEMPLATES_BY_GOAL", () => {
    it("uses distinct food items for low_carb and bulk_up than the default", () => {
      const target = { proteinG: 40, fatG: 40, carbG: 60 };

      const defaultLabels = buildMealMenu(
        MEAL_TEMPLATES_BY_GOAL.health.dinner,
        target,
      ).items.map((item) => item.label);
      const lowCarbLabels = buildMealMenu(
        MEAL_TEMPLATES_BY_GOAL.low_carb.dinner,
        target,
      ).items.map((item) => item.label);
      const bulkUpLabels = buildMealMenu(
        MEAL_TEMPLATES_BY_GOAL.bulk_up.dinner,
        target,
      ).items.map((item) => item.label);

      expect(lowCarbLabels).not.toEqual(defaultLabels);
      expect(bulkUpLabels).not.toEqual(defaultLabels);
    });

    it("never sizes the main protein item to an unrealistic amount for any goal", () => {
      // 体格の大きいクライアント(高体重・バルクアップ等)を想定した1食あたりの
      // 目標値でも、主菜(mainProtein)は上限量(250g)を超えないことを確認する。
      const target = { proteinG: 60, fatG: 45, carbG: 90 };
      for (const goal of Object.values(MEAL_TEMPLATES_BY_GOAL)) {
        for (const template of [goal.breakfast, goal.lunch, goal.dinner]) {
          const result = buildMealMenu(template, target);
          const mainProteinItem = result.items.find(
            (item) => item.label === template.mainProtein.label,
          );
          expect(mainProteinItem?.grams ?? 0).toBeLessThanOrEqual(250);
        }
      }
    });
  });

  describe("目標カロリーに応じた品目の増減", () => {
    it("drops essential:false sides when the per-meal target is small", () => {
      const result = buildMealMenu(BREAKFAST_TEMPLATE, {
        proteinG: 0,
        fatG: 0,
        carbG: 0,
      });
      const labels = result.items.map((item) => item.label);
      expect(labels).toContain("ブロッコリーのごま和え");
      expect(labels).not.toContain("ミニトマト");
    });

    it("caps the main protein item and adds an extra item when the target is large", () => {
      // 脂質源(プロセスチーズ)が上限(200g)まで使われ、そのたんぱく質分(45.4g)を
      // 差し引いてもなお、豚肩ロースのソテー(たんぱく質22.7g/100g)だけでは
      // 賄いきれないほど大きなたんぱく質目標を設定し、上限(250g)で頭打ちになることを確認する。
      const result = buildMealMenu(MEAL_TEMPLATES_BY_GOAL.low_carb.dinner, {
        proteinG: 150,
        fatG: 60,
        carbG: 50,
      });
      const porkItem = result.items.find(
        (item) => item.label === "豚肩ロースのソテー",
      );
      expect(porkItem?.grams).toBe(250);
      const extraEgg = result.items.find(
        (item) => item.label === "ゆで卵(追加)",
      );
      expect(extraEgg).toBeDefined();
      expect(extraEgg?.grams).toBe(50);
    });

    it("does not add extra items when the target is within the main item's cap", () => {
      const result = buildMealMenu(MEAL_TEMPLATES_BY_GOAL.low_carb.dinner, {
        proteinG: 150,
        fatG: 60,
        carbG: 50,
      });
      // mealKcalが「少なめ」「多め」どちらの閾値も超えない、標準的な目標では
      // 追加品目は出ない。
      const standardResult = buildMealMenu(MEAL_TEMPLATES_BY_GOAL.low_carb.dinner, {
        proteinG: 35,
        fatG: 25,
        carbG: 30,
      });
      expect(result.items.some((item) => item.label === "ゆで卵(追加)")).toBe(
        true,
      );
      expect(
        standardResult.items.some((item) => item.label === "ゆで卵(追加)"),
      ).toBe(false);
    });
  });
});
