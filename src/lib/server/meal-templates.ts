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
// 同じ(名前・分類)の組み合わせは1回のfetchを使い回す(ラベルだけ違う場合も
// 取得自体は共有し、ラベルのみ後から差し替える)。
async function buildIngredientsFromFoodMaster(): Promise<MealSuggestionIngredients> {
  const cache = new Map<string, Promise<RepresentativeFood>>();
  function fetchFood(name: string, category?: string): Promise<RepresentativeFood> {
    const key = `${category ?? ""}::${name}`;
    let promise = cache.get(key);
    if (!promise) {
      promise = toRepresentativeFood(name, { category });
      cache.set(key, promise);
    }
    return promise;
  }
  function withLabel(
    promise: Promise<RepresentativeFood>,
    label: string,
  ): Promise<RepresentativeFood> {
    return promise.then((food) => ({ ...food, label }));
  }

  // 全粒粉パンの代わりに、食物繊維が多く腹持ちの良いさつまいもを主食にする。
  const wholeWheatBread = fetchFood("さつまいも(蒸し)", "野菜・フルーツ単品");
  const grilledSalmon = fetchFood("鮭(切り身)");
  const chickenThigh = fetchFood("鶏もも肉(皮つき)");
  const porkLoin = fetchFood("豚ロース(脂身つき)");
  const avocado = fetchFood("アボカド", "野菜・フルーツ単品");

  // 25件前後の代表食品を1件ずつ順番に取得すると(食品マスタが数千件規模の今は
  // 特に)往復回数がそのまま待ち時間になるため、依存関係のない取得はすべて
  // 並列に投げ、最後にまとめてawaitする。
  const entries: Record<keyof MealSuggestionIngredients, Promise<RepresentativeFood>> = {
    wholeWheatBread,
    friedEgg: fetchFood("目玉焼き（2個）", "卵料理"),
    grilledSalmon,
    // 食品マスタに「ブロッコリーのごま和え」は無いため、同じく低脂質な
    // 副菜「ブロッコリーのおかか和え」で代替する。
    broccoliSide: fetchFood("ブロッコリーのおかか和え"),
    // 食品マスタに「ミニトマト」は無いため、単品の「トマト」で代替する。
    tomato: fetchFood("トマト", "野菜・フルーツ単品"),
    brownRice: fetchFood("玄米ご飯"),
    chickenBreast: fetchFood("鶏むね肉(皮なし)"),
    porkLoin,
    boiledSpinach: fetchFood("ほうれん草お浸し"),
    misoSoup: fetchFood("味噌汁", "副菜"),
    whiteRice: fetchFood("白米ご飯"),
    chickenThigh,
    saladChicken: fetchFood("サラダチキン(セブン)"),
    // 食品マスタに「絹ごし豆腐」は無いため、同じ主菜区分の「木綿豆腐」で代替する。
    tofu: fetchFood("木綿豆腐"),
    // 食品マスタに「きのこのソテー」は無いため、「しめじとエリンギのソテー」で代替する。
    mushroomSaute: fetchFood("しめじとエリンギのソテー"),
    extraCarb: withLabel(fetchFood("白米ご飯"), "白米ご飯(追加)"),
    extraProtein: withLabel(fetchFood("ゆで卵", "副菜"), "ゆで卵(追加)"),
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
    extraLowCarbBread: withLabel(
      fetchFood("さつまいも(蒸し)", "野菜・フルーツ単品"),
      "さつまいも(追加)",
    ),
    natto: fetchFood("納豆", "主菜"),
    banana: fetchFood("バナナ", "野菜・フルーツ単品"),
    // 食品マスタに「素焼きミックスナッツ」は無いため、同区分の「素焼きアーモンド」で代替する。
    mixedNuts: fetchFood("素焼きアーモンド"),
    // 食品マスタに「牛肩ロースのグリル」は無いため、より高たんぱく・低脂質な
    // 「牛もも肉(赤身・輸入)」で代替する。
    beefLoin: fetchFood("牛もも肉(赤身・輸入)"),
  };

  const keys = Object.keys(entries) as (keyof MealSuggestionIngredients)[];
  const resolved = await Promise.all(keys.map((key) => entries[key]));
  return Object.fromEntries(
    keys.map((key, i) => [key, resolved[i]]),
  ) as MealSuggestionIngredients;
}

// 現在の食品マスタから献立テンプレート一式を組み立てる。プランタブなど、
// 献立例を表示する箇所はこの関数の戻り値を使う。
export async function getMealTemplates(): Promise<MealTemplateBundle> {
  return buildMealTemplates(await buildIngredientsFromFoodMaster());
}
