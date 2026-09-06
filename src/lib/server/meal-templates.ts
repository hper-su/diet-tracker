import { getFoodByName } from "@/lib/db/foods";
import {
  buildMealTemplates,
  type MealSuggestionIngredients,
  type MealTemplateBundle,
  type RepresentativeFood,
} from "@/lib/health/meal-suggestion";

// 「150g(茶碗1杯)」「1袋(約100g)」「150ml」のような基準量表記から、
// 先頭に現れるグラム数(mlはg相当とみなす近似)を取り出す。見つからない場合
// (「1個」「1食」など重さ・容量の記載がない基準量)はnull。
//
// 以前は「g」のみに対応しており、「150ml」のような液体の基準量表記が
// マッチせず便宜上100gとして扱われていた(味噌汁が該当し、実際は150mlで
// 40kcalなのに100gで40kcalとして計算され、量を150g分に換算する際に
// 実際の1.5倍(60kcal)を表示してしまっていた)。
function parseServingGrams(servingLabel: string): number | null {
  const match = servingLabel.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
  return match ? Number(match[1]) : null;
}

// 食品マスタから名前で1件取得し、基準量(serving_label)を可食部100gあたりに
// 換算したRepresentativeFoodを返す。基準量にグラム数の記載がない場合は
// 便宜上そのまま100gとみなす。
async function toRepresentativeFood(
  name: string,
  options?: { category?: string; label?: string },
): Promise<RepresentativeFood> {
  const food = await getFoodByName(name, options?.category);
  if (!food) {
    throw new Error(
      `食品マスタに「${name}」が見つかりません(献立例の生成に使う代表食品です)。`,
    );
  }
  const grams = parseServingGrams(food.servingLabel) ?? 100;
  const factor = 100 / grams;
  return {
    label: options?.label ?? food.name,
    kcal: food.kcal * factor,
    proteinG: food.proteinG * factor,
    fatG: food.fatG * factor,
    carbG: food.carbG * factor,
  };
}

// 現在の食品マスタから、献立例(meal-suggestion.ts)が必要とする代表食品一式を
// 組み立てる。食品マスタを編集すればここでの取得値も変わるため、献立例は
// 常に「今の食品マスタ」の内容を反映する。
//
// お客様のPFCバランス表に存在しない食品(絹ごし豆腐・ミニトマト・きのこのソテー・
// 素焼きミックスナッツなど)は、現在の食品マスタにある高たんぱく・低脂質な食品で
// 代替している。また、パン・チーズは(栄養価は悪くないものの)量の割に満腹感が
// 得にくいため、より腹持ちの良い食品(さつまいも・アボカド)に置き換えている。
async function buildIngredientsFromFoodMaster(): Promise<MealSuggestionIngredients> {
  // 全粒粉パンの代わりに、食物繊維が多く腹持ちの良いさつまいもを主食にする。
  const wholeWheatBread = await toRepresentativeFood("さつまいも(蒸し)", {
    category: "野菜・フルーツ単品",
  });
  const grilledSalmon = await toRepresentativeFood("鮭(切り身)");
  const chickenThigh = await toRepresentativeFood("鶏もも肉(皮つき)");
  const porkLoin = await toRepresentativeFood("豚ロース(脂身つき)");
  const avocado = await toRepresentativeFood("アボカド", { category: "野菜・フルーツ単品" });

  return {
    wholeWheatBread,
    friedEgg: await toRepresentativeFood("目玉焼き（2個）", { category: "卵料理" }),
    grilledSalmon,
    // 食品マスタに「ブロッコリーのごま和え」は無いため、同じく低脂質な
    // 副菜「ブロッコリーのおかか和え」で代替する。
    broccoliSide: await toRepresentativeFood("ブロッコリーのおかか和え"),
    // 食品マスタに「ミニトマト」は無いため、単品の「トマト」で代替する。
    tomato: await toRepresentativeFood("トマト", { category: "野菜・フルーツ単品" }),
    brownRice: await toRepresentativeFood("玄米ご飯"),
    chickenBreast: await toRepresentativeFood("鶏むね肉(皮なし)"),
    porkLoin,
    boiledSpinach: await toRepresentativeFood("ほうれん草お浸し"),
    misoSoup: await toRepresentativeFood("味噌汁", { category: "副菜" }),
    whiteRice: await toRepresentativeFood("白米ご飯"),
    chickenThigh,
    saladChicken: await toRepresentativeFood("サラダチキン(セブン)"),
    // 食品マスタに「絹ごし豆腐」は無いため、同じ主菜区分の「木綿豆腐」で代替する。
    tofu: await toRepresentativeFood("木綿豆腐"),
    // 食品マスタに「きのこのソテー」は無いため、「しめじとエリンギのソテー」で代替する。
    mushroomSaute: await toRepresentativeFood("しめじとエリンギのソテー"),
    extraCarb: await toRepresentativeFood("白米ご飯", { label: "白米ご飯(追加)" }),
    extraProtein: await toRepresentativeFood("ゆで卵", { category: "副菜", label: "ゆで卵(追加)" }),
    // ブランパンの代わりに、さつまいもを糖質制限の主食にも使う。
    lowCarbBread: wholeWheatBread,
    // 食品マスタに「鮭の塩焼き(皮つき)」は無いため、鮭(切り身)を代用する。
    saltGrilledSalmon: grilledSalmon,
    // 食品マスタに「鶏もも肉のグリル(皮つき)」は無いため、鶏もも肉(皮つき)を代用する。
    chickenThighGrill: chickenThigh,
    // 食品マスタに「豚肩ロースのソテー」は無いため、豚ロース(脂身つき)を代用する。
    porkShoulderLoin: porkLoin,
    avocado,
    // プロセスチーズの代わりに、食物繊維が多く腹持ちの良いアボカドを脂質源にする。
    cheese: avocado,
    extraLowCarbBread: await toRepresentativeFood("さつまいも(蒸し)", {
      category: "野菜・フルーツ単品",
      label: "さつまいも(追加)",
    }),
    natto: await toRepresentativeFood("納豆", { category: "主菜" }),
    banana: await toRepresentativeFood("バナナ", { category: "野菜・フルーツ単品" }),
    // 食品マスタに「素焼きミックスナッツ」は無いため、同区分の「素焼きアーモンド」で代替する。
    mixedNuts: await toRepresentativeFood("素焼きアーモンド"),
    // 食品マスタに「牛肩ロースのグリル」は無いため、より高たんぱく・低脂質な
    // 「牛もも肉(赤身・輸入)」で代替する。
    beefLoin: await toRepresentativeFood("牛もも肉(赤身・輸入)"),
  };
}

// 現在の食品マスタから献立テンプレート一式を組み立てる。プランタブなど、
// 献立例を表示する箇所はこの関数の戻り値を使う。
export async function getMealTemplates(): Promise<MealTemplateBundle> {
  return buildMealTemplates(await buildIngredientsFromFoodMaster());
}
