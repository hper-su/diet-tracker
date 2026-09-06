// 1食分のP/F/C目標(g)から、朝食・昼食・夕食それぞれにふさわしい
// 具体的な献立例(主食・主菜・脂質源・副菜)を提案する。
// 献立の構成は https://www.central.co.jp/catchup/fitness/colum_2602_3/ で
// 紹介されている高たんぱく・低脂質な献立例(主食+目玉焼き+野菜、
// 鶏むね肉のグリル定食、ささみ・豆腐のヘルシー献立など)を参考にした。
// 主食はパンではなく、量の割に満腹感が得やすいさつまいもなどを使う。
//
// このファイル自体は食品マスタ(DB)に依存しない純粋なロジックとして保つ
// (他のsrc/lib/health配下と同様、ユニットテストの対象にするため)。
// 実際に使う食品の栄養価(MealSuggestionIngredients)は呼び出し側が用意する。
// 本番では src/lib/server/meal-templates.ts が現在の食品マスタから
// 実在する項目の値を取得して渡すため、食品マスタを編集すればこの献立例にも
// そのまま反映される。
//
// 目的(PFCPreset)ごとに献立の食材構成も変える。「糖質制限」は炭水化物源を
// 減らす代わりに脂質源(アボカド等)を加え、「バルクアップ」は
// 炭水化物・カロリーを積み増しやすい食材(バナナ・ミックスナッツ等)を加える。
import type { PFCPreset } from "./pfc-preset";
import {
  KCAL_PER_G_PROTEIN,
  KCAL_PER_G_FAT,
  KCAL_PER_G_CARB,
} from "./pfc-balance";

export type RepresentativeFood = {
  label: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// 主食(炭水化物源)・脂質源・主菜(たんぱく質源)は量を調整して目標に近づけ、
// 副菜・汁物は彩り・食物繊維のための固定量として添える。
//
// buildMealMenuは3つを順に(1.炭水化物→2.脂質→3.たんぱく質の順で)逆算する。
// 後段になるほど、前段で使った食品自身の栄養価も差し引いた「本当の残り」に
// 合わせて量を決めるため、たんぱく質(最後に解く)が最も正確に目標へ近づく。
// 以前は脂質を全く逆算しておらず(炭水化物源・たんぱく質源から漏れ出る分だけの
// 「余りもの」だった)ため、理想のPFCバランスから大きく外れがちだった。
//
// 注意: mainCarb・mainFat・mainProteinは残りの目標量を100gあたりの密度で逆算するため、
// 密度の低い食品(例: 目玉焼きは100gあたりたんぱく質14.8gしかない)をmainProteinに
// 割り当てると、目標次第で「目玉焼き415g」のような非現実的な量になってしまう。
// mainCarb・mainProteinには必ず炭水化物・たんぱく質の密度が高い食品
// (目安: 20g/100g以上)を、mainFatには脂質の密度が高い食品(目安: 10g/100g以上)を
// 割り当てること。密度の低い食品はsidesの固定量側に置く。
//
// 1食あたりの目標カロリーが小さいとき、またはmainCarb/mainProteinの必要量が
// 現実的な上限を超えるときは、buildMealMenuが以下のように献立の「内容」自体も
// 調整する(量の増減だけでなく品目そのものを増減させる)。
// - 目標が小さい: essential:falseの副菜(彩り・アクセント程度の品目)を献立から外す。
// - mainCarb・mainProteinが現実的な上限量に届かない(=必要量が上限を超える)場合:
//   上限で頭打ちにしたうえで、それでも届かない分はextraCarb/extraProteinを1品ずつ
//   「一般的な量」で追加する(1品の量を非現実的に増やすのではなく、品数を増やして
//   対応する。1食の総カロリーが多いときに限らず、他の栄養素の目標が低いために
//   単一の栄養素だけ必要量が多いケースでも同様に追加する)。mainFatは上限に
//   達しても追加品目は出さず、単に頭打ちにする(シンプルさを優先)。
export type MealTemplate = {
  mainCarb: RepresentativeFood;
  mainFat: RepresentativeFood;
  mainProtein: RepresentativeFood;
  // essential:falseの副菜は、1食あたりの目標カロリーが小さいとき献立から外れる。
  sides: { food: RepresentativeFood; grams: number; essential?: boolean }[];
  // 目標カロリーが大きく、mainCarb/mainProteinが上限量に達したときに
  // 追加で足す品目(固定の一般的な量)。
  extraCarb?: { food: RepresentativeFood; grams: number };
  extraProtein?: { food: RepresentativeFood; grams: number };
};

// buildMealTemplatesが必要とする食材一式。呼び出し側(本番はDB、テストは固定値)が
// それぞれの役割にふさわしい食品の可食部100gあたりの栄養価を用意する。
export type MealSuggestionIngredients = {
  // 朝食の主食。炭水化物密度が高く、腹持ちの良い食品(さつまいも等)を想定。
  wholeWheatBread: RepresentativeFood;
  // 朝食・バルクアップ朝食の脂質源。たんぱく質密度は低くてよいが脂質密度は高いこと。
  friedEgg: RepresentativeFood;
  // 朝食・バルクアップ朝食の主菜(たんぱく質源)。
  grilledSalmon: RepresentativeFood;
  // 朝食・糖質制限朝食の副菜(必須)。
  broccoliSide: RepresentativeFood;
  // 朝食の副菜(彩り・目標が小さいときは外れる)。
  tomato: RepresentativeFood;
  // 昼食・バルクアップ昼食・糖質制限昼食の主食。
  brownRice: RepresentativeFood;
  // 昼食・バルクアップ昼食の主菜(たんぱく質源)。
  chickenBreast: RepresentativeFood;
  // 昼食の脂質源。
  porkLoin: RepresentativeFood;
  // 昼食・バルクアップ昼食の副菜(必須)。
  boiledSpinach: RepresentativeFood;
  // 昼食・バルクアップ昼食の副菜(彩り・目標が小さいときは外れる)。
  misoSoup: RepresentativeFood;
  // 夕食・バルクアップ夕食・糖質制限夕食の主食。
  whiteRice: RepresentativeFood;
  // 夕食の脂質源。
  chickenThigh: RepresentativeFood;
  // 夕食の主菜(たんぱく質源)。
  saladChicken: RepresentativeFood;
  // 夕食・バルクアップ夕食・糖質制限夕食の副菜(必須)。
  tofu: RepresentativeFood;
  // 夕食・バルクアップ夕食・糖質制限夕食の副菜(彩り・目標が小さいときは外れる)。
  mushroomSaute: RepresentativeFood;
  // 目標が大きいときに炭水化物源を1品追加するための食品(固定100g)。
  extraCarb: RepresentativeFood;
  // 目標が大きいときにたんぱく質源を1品追加するための食品(固定50g)。
  extraProtein: RepresentativeFood;
  // 糖質制限朝食の主食(炭水化物控えめ)。
  lowCarbBread: RepresentativeFood;
  // 糖質制限朝食の主菜(たんぱく質源)。
  saltGrilledSalmon: RepresentativeFood;
  // 糖質制限昼食の主菜(たんぱく質源)。
  chickenThighGrill: RepresentativeFood;
  // 糖質制限夕食の主菜(たんぱく質源)。
  porkShoulderLoin: RepresentativeFood;
  // 糖質制限朝食・昼食の脂質源。
  avocado: RepresentativeFood;
  // 糖質制限昼食の副菜(彩り)・夕食の脂質源。
  cheese: RepresentativeFood;
  // 糖質制限で目標が大きいときに炭水化物源を1品追加するための食品(固定50g)。
  extraLowCarbBread: RepresentativeFood;
  // バルクアップ朝食の副菜(彩り)。
  natto: RepresentativeFood;
  // バルクアップ朝食の副菜(彩り)。
  banana: RepresentativeFood;
  // バルクアップ昼食・夕食の脂質源(カロリーを積み増しやすい)。
  mixedNuts: RepresentativeFood;
  // バルクアップ夕食の主菜(たんぱく質源)。
  beefLoin: RepresentativeFood;
};

export type DailyMealTemplateSet = {
  breakfast: MealTemplate;
  lunch: MealTemplate;
  dinner: MealTemplate;
};

export type MealTemplateBundle = {
  BREAKFAST_TEMPLATE: MealTemplate;
  LUNCH_TEMPLATE: MealTemplate;
  DINNER_TEMPLATE: MealTemplate;
  LOW_CARB_BREAKFAST_TEMPLATE: MealTemplate;
  LOW_CARB_LUNCH_TEMPLATE: MealTemplate;
  LOW_CARB_DINNER_TEMPLATE: MealTemplate;
  BULK_UP_BREAKFAST_TEMPLATE: MealTemplate;
  BULK_UP_LUNCH_TEMPLATE: MealTemplate;
  BULK_UP_DINNER_TEMPLATE: MealTemplate;
  MEAL_TEMPLATES_BY_GOAL: Record<PFCPreset, DailyMealTemplateSet>;
};

// 食材一式(ingredients)から、目的別の献立テンプレート一式を組み立てる。
export function buildMealTemplates(ingredients: MealSuggestionIngredients): MealTemplateBundle {
  const BREAKFAST_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.wholeWheatBread,
    mainFat: ingredients.friedEgg,
    mainProtein: ingredients.grilledSalmon,
    sides: [
      { food: ingredients.broccoliSide, grams: 50 },
      { food: ingredients.tomato, grams: 30, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const LUNCH_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.brownRice,
    mainFat: ingredients.porkLoin,
    mainProtein: ingredients.chickenBreast,
    sides: [
      { food: ingredients.boiledSpinach, grams: 70 },
      { food: ingredients.misoSoup, grams: 150, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const DINNER_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.whiteRice,
    mainFat: ingredients.chickenThigh,
    mainProtein: ingredients.saladChicken,
    sides: [
      { food: ingredients.tofu, grams: 100 },
      { food: ingredients.mushroomSaute, grams: 50, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  // --- 「糖質制限」向け: 炭水化物源を控えめにし、脂質源(アボカド等)を
  // 固定量で加えることで、炭水化物を減らしても脂質からカロリーを確保できるようにする。
  const LOW_CARB_BREAKFAST_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.lowCarbBread,
    mainFat: ingredients.avocado,
    mainProtein: ingredients.saltGrilledSalmon,
    sides: [
      { food: ingredients.friedEgg, grams: 100 },
      { food: ingredients.broccoliSide, grams: 50, essential: false },
    ],
    extraCarb: { food: ingredients.extraLowCarbBread, grams: 50 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const LOW_CARB_LUNCH_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.brownRice,
    mainFat: ingredients.avocado,
    mainProtein: ingredients.chickenThighGrill,
    sides: [
      { food: ingredients.boiledSpinach, grams: 70 },
      { food: ingredients.cheese, grams: 20, essential: false },
    ],
    extraCarb: { food: ingredients.extraLowCarbBread, grams: 50 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const LOW_CARB_DINNER_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.whiteRice,
    mainFat: ingredients.cheese,
    mainProtein: ingredients.porkShoulderLoin,
    sides: [
      { food: ingredients.tofu, grams: 100 },
      { food: ingredients.mushroomSaute, grams: 50, essential: false },
    ],
    extraCarb: { food: ingredients.extraLowCarbBread, grams: 50 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  // --- 「バルクアップ」向け: 主食・主菜は目標が大きくなれば自動的に量が増えるが、
  // それに加えてバナナ・ミックスナッツ等、カロリーを積み増しやすい食材を固定量で足す。
  const BULK_UP_BREAKFAST_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.whiteRice,
    mainFat: ingredients.friedEgg,
    mainProtein: ingredients.grilledSalmon,
    sides: [
      { food: ingredients.natto, grams: 45, essential: false },
      { food: ingredients.banana, grams: 100, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const BULK_UP_LUNCH_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.brownRice,
    mainFat: ingredients.mixedNuts,
    mainProtein: ingredients.chickenBreast,
    sides: [
      { food: ingredients.boiledSpinach, grams: 70 },
      { food: ingredients.misoSoup, grams: 150, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  const BULK_UP_DINNER_TEMPLATE: MealTemplate = {
    mainCarb: ingredients.whiteRice,
    mainFat: ingredients.mixedNuts,
    mainProtein: ingredients.beefLoin,
    sides: [
      { food: ingredients.tofu, grams: 100 },
      { food: ingredients.mushroomSaute, grams: 50, essential: false },
    ],
    extraCarb: { food: ingredients.extraCarb, grams: 100 },
    extraProtein: { food: ingredients.extraProtein, grams: 50 },
  };

  // お客様のPFCPreset(目的)に応じて、朝食・昼食・夕食の献立テンプレート一式を切り替える。
  // 「健康維持」「ダイエット」は共通の高たんぱく・低脂質な献立を使う。
  const MEAL_TEMPLATES_BY_GOAL: Record<PFCPreset, DailyMealTemplateSet> = {
    health: {
      breakfast: BREAKFAST_TEMPLATE,
      lunch: LUNCH_TEMPLATE,
      dinner: DINNER_TEMPLATE,
    },
    diet: {
      breakfast: BREAKFAST_TEMPLATE,
      lunch: LUNCH_TEMPLATE,
      dinner: DINNER_TEMPLATE,
    },
    low_carb: {
      breakfast: LOW_CARB_BREAKFAST_TEMPLATE,
      lunch: LOW_CARB_LUNCH_TEMPLATE,
      dinner: LOW_CARB_DINNER_TEMPLATE,
    },
    bulk_up: {
      breakfast: BULK_UP_BREAKFAST_TEMPLATE,
      lunch: BULK_UP_LUNCH_TEMPLATE,
      dinner: BULK_UP_DINNER_TEMPLATE,
    },
  };

  return {
    BREAKFAST_TEMPLATE,
    LUNCH_TEMPLATE,
    DINNER_TEMPLATE,
    LOW_CARB_BREAKFAST_TEMPLATE,
    LOW_CARB_LUNCH_TEMPLATE,
    LOW_CARB_DINNER_TEMPLATE,
    BULK_UP_BREAKFAST_TEMPLATE,
    BULK_UP_LUNCH_TEMPLATE,
    BULK_UP_DINNER_TEMPLATE,
    MEAL_TEMPLATES_BY_GOAL,
  };
}

const GRAM_ROUNDING = 5;

function roundGrams(grams: number): number {
  return Math.max(0, Math.round(grams / GRAM_ROUNDING) * GRAM_ROUNDING);
}

function scale(food: RepresentativeFood, grams: number) {
  const factor = grams / 100;
  return {
    label: food.label,
    grams,
    kcal: food.kcal * factor,
    proteinG: food.proteinG * factor,
    fatG: food.fatG * factor,
    carbG: food.carbG * factor,
  };
}

export type MealMacroTarget = {
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type MealSuggestionItem = {
  label: string;
  grams: number;
  kcal: number;
};

export type MealSuggestion = {
  items: MealSuggestionItem[];
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// 1食あたりの目標カロリーがこの値未満なら「少なめ」の献立とみなし、
// 品目の増減で対応する(値は目安。3食均等割りを想定した1食分)。
const LOW_MEAL_KCAL_THRESHOLD = 450;

// mainCarb・mainFat・mainProteinの、1品あたりの現実的な上限量。これを超える分は
// 1品を非現実的に増やすのではなく、extraCarb/extraProteinで品数を増やして補う
// (mainFatは上限に達しても追加品目は出さず、単に頭打ちにする)。
const MAIN_CARB_MAX_GRAMS = 300;
const MAIN_FAT_MAX_GRAMS = 200;
const MAIN_PROTEIN_MAX_GRAMS = 250;

function estimateMealKcal(target: MealMacroTarget): number {
  return (
    target.proteinG * KCAL_PER_G_PROTEIN +
    target.fatG * KCAL_PER_G_FAT +
    target.carbG * KCAL_PER_G_CARB
  );
}

type ScaledFood = ReturnType<typeof scale>;

function sumMacros(items: ScaledFood[]) {
  return items.reduce(
    (total, item) => ({
      kcal: total.kcal + item.kcal,
      proteinG: total.proteinG + item.proteinG,
      fatG: total.fatG + item.fatG,
      carbG: total.carbG + item.carbG,
    }),
    { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  );
}

// 副菜・汁物は彩り・食物繊維のための固定量とし、主食(炭水化物)→脂質源→主菜(たんぱく質)の
// 順に、それぞれ残りの目標にちょうど合う量を逆算する。後段になるほど前段の食品自身の
// 栄養価も差し引いた「本当の残り」に合わせるため、たんぱく質(最後に解く)が最も正確に
// 目標へ近づく。
//
// 1食あたりの目標カロリーが小さい/大きいときは、量の調整だけでなく献立の
// 「品目」自体も増減させる(詳細はMealTemplateの説明を参照)。
export function buildMealMenu(
  template: MealTemplate,
  target: MealMacroTarget,
): MealSuggestion {
  const mealKcal = estimateMealKcal(target);
  const isLowMeal = mealKcal < LOW_MEAL_KCAL_THRESHOLD;

  const activeSides = template.sides.filter(
    (side) => !isLowMeal || side.essential !== false,
  );
  const sideItems = activeSides.map(({ food, grams }) => scale(food, grams));
  const sideTotals = sumMacros(sideItems);

  const remainingCarbG = Math.max(0, target.carbG - sideTotals.carbG);
  const rawMainCarbGrams =
    remainingCarbG > 0 ? (remainingCarbG / template.mainCarb.carbG) * 100 : 0;
  const mainCarbGrams = roundGrams(
    Math.min(rawMainCarbGrams, MAIN_CARB_MAX_GRAMS),
  );
  const mainCarbItem = scale(template.mainCarb, mainCarbGrams);
  const carbNeedsExtra = rawMainCarbGrams > MAIN_CARB_MAX_GRAMS;

  const remainingFatG = Math.max(
    0,
    target.fatG - sideTotals.fatG - mainCarbItem.fatG,
  );
  const rawMainFatGrams =
    remainingFatG > 0 ? (remainingFatG / template.mainFat.fatG) * 100 : 0;
  const mainFatGrams = roundGrams(
    Math.min(rawMainFatGrams, MAIN_FAT_MAX_GRAMS),
  );
  const mainFatItem = scale(template.mainFat, mainFatGrams);

  const remainingProteinG = Math.max(
    0,
    target.proteinG -
      sideTotals.proteinG -
      mainCarbItem.proteinG -
      mainFatItem.proteinG,
  );
  const rawMainProteinGrams =
    remainingProteinG > 0
      ? (remainingProteinG / template.mainProtein.proteinG) * 100
      : 0;
  const mainProteinGrams = roundGrams(
    Math.min(rawMainProteinGrams, MAIN_PROTEIN_MAX_GRAMS),
  );
  const mainProteinItem = scale(template.mainProtein, mainProteinGrams);
  const proteinNeedsExtra = rawMainProteinGrams > MAIN_PROTEIN_MAX_GRAMS;

  const extraItems = [];
  if (carbNeedsExtra && template.extraCarb) {
    extraItems.push(scale(template.extraCarb.food, template.extraCarb.grams));
  }
  if (proteinNeedsExtra && template.extraProtein) {
    extraItems.push(
      scale(template.extraProtein.food, template.extraProtein.grams),
    );
  }
  const extraTotals = sumMacros(extraItems);

  const allItems = [
    mainCarbItem,
    mainFatItem,
    mainProteinItem,
    ...sideItems,
    ...extraItems,
  ].filter((item) => item.grams > 0);

  const mainTotals = sumMacros([mainCarbItem, mainFatItem, mainProteinItem]);

  return {
    items: allItems.map((item) => ({
      label: item.label,
      grams: item.grams,
      kcal: item.kcal,
    })),
    kcal: mainTotals.kcal + sideTotals.kcal + extraTotals.kcal,
    proteinG: mainTotals.proteinG + sideTotals.proteinG + extraTotals.proteinG,
    fatG: mainTotals.fatG + sideTotals.fatG + extraTotals.fatG,
    carbG: mainTotals.carbG + sideTotals.carbG + extraTotals.carbG,
  };
}
