import { listFoodsByCategories, type Food } from "@/lib/db/foods";
import {
  pickMealCombo,
  scoreCombo,
  type ComboCandidate,
  type ComboTarget,
  type MealCombo,
} from "@/lib/health/meal-combo";

// コンビニ編で候補にする分類(チェーンごと)。
const CONVENIENCE_STORE_CATEGORIES = [
  "セブンイレブン",
  "ローソン",
  "ファミリーマート",
  "ミニストップ",
];

// どのコンビニでも買える、特定チェーンに紐づかない高たんぱく・低脂質な
// プロテイン飲料・バー。「セブンで完結」のようにチェーンを1つに揃えたい場合でも、
// 手軽な朝食用に組み合わせられるよう、店の判定とは別枠の共通候補として扱う。
const UNIVERSAL_QUICK_PROTEIN_CATEGORIES = ["明治", "ダノンジャパン", "森永製菓"];

function isUniversalQuickProteinItem(food: Food): boolean {
  return (
    UNIVERSAL_QUICK_PROTEIN_CATEGORIES.includes(food.category) &&
    (food.name.includes("プロテイン") || food.name.includes("ザバス") || food.name.includes("オイコス"))
  );
}

// 外食編で候補にする分類(飲食店・カフェ・持ち帰り弁当のチェーンごと)。
// ケーキ・ドーナツ専門店(ビアードパパ・シャトレーゼ等)は満腹感の得にくい
// 甘味中心のため含めない。
const EATING_OUT_CATEGORIES = [
  "ガスト",
  "ガスト・単品",
  "ガスト・月",
  "ガスト・火",
  "ガスト・水",
  "ガスト・木",
  "ガスト・金",
  "やよい軒",
  "やよい軒・テイクアウト",
  "大戸屋",
  "ほっともっと",
  "ほっかほっか亭",
  "リンガーハット",
  "日高屋",
  "かつや",
  "スシロー",
  "松屋",
  "からやま",
  "丸亀製麺",
  "一風堂",
  "いきなり！ステーキ",
  "スターバックス",
  "CoCo壱番屋",
  "マクドナルド",
  "ケンタッキーフライドチキン",
  "すき家",
  "吉野家",
  "バーガーキング",
  "鳥貴族",
  "サブウェイ",
  "ジョリーパスタ",
  "はなまるうどん",
  "しゃぶ葉",
  "サンマルクカフェ",
  "なか卯",
  "デニーズ",
  "フレッシュネスバーガー",
  "モスバーガー",
  "ロイヤルホスト",
  "天丼てんや",
  "ドトール",
  "居酒屋メニュー",
];

// 外食編の朝食に限り、この中からチェーンを選ぶ(手軽に食べられる店に絞るが、
// ケーキ・ドーナツ専門店は満腹感が得にくいため外し、サンドイッチ・バーガーなど
// 具材のあるものが中心の店にする。定食屋やラーメン店などは昼食・夕食に回す)。
const QUICK_BREAKFAST_EATING_OUT_CATEGORIES = [
  "スターバックス",
  "ドトール",
  "サンマルクカフェ",
  "サブウェイ",
  "フレッシュネスバーガー",
];

// 食事の献立例としてふさわしくない、お酒(アルコール飲料)を名前・分類のキーワードで除外する。
const ALCOHOL_KEYWORDS = [
  "ビール", "チューハイ", "ハイボール", "サワー", "ウォッカ", "ワイン", "焼酎",
  "カクテル", "スピリッツ", "梅酒", "ジン", "ラム", "テキーラ", "ブランデー",
  "ウイスキー", "発泡酒", "日本酒", "サングリア", "梅サワー",
];

// 常に献立例から除外するキーワード(コーヒーは栄養補給が目的の献立に不向きなため)。
const ALWAYS_EXCLUDE_KEYWORDS = ["コーヒー"];

// パン単品は量の割に満腹感が得にくいため除外したいが、単純な部分一致だと
// 「ダノン“ジャパン”」のようなブランド名や、パンとは別の料理である
// 「パンケーキ」「パンナコッタ」「フライパン(調理器具)」まで誤って
// 除外してしまう(実際に、コンビニ編の朝食候補としてUNIVERSAL_QUICK_PROTEIN_CATEGORIESに
// 加えたダノンジャパンのオイコス等プロテイン飲料が、名前末尾の「(ダノンジャパン)」の
// せいで全滅していたバグがあった)。そのため「パン」自体は除外しつつ、
// これらの前後の文字列と一致する場合は除外しない。
const BREAD_KEYWORD_PATTERN = /(?<!ジャ|フライ)パン(?!ケーキ|ナコッタ)/;

function includesStandaloneBread(name: string): boolean {
  return BREAD_KEYWORD_PATTERN.test(name);
}
// 昼食に限り除外するキーワード。
const LUNCH_EXCLUDE_KEYWORDS = ["おでん"];
// コンビニ編の朝食に限り除外するキーワード(座って食べる重めの食事を避け、
// おにぎり・サンドイッチ・プロテイン飲料等の手軽なものに絞る)。
const QUICK_BREAKFAST_EXCLUDE_KEYWORDS = [
  "弁当", "丼", "麺", "ラーメン", "うどん", "そば", "パスタ", "カレー", "ピザ",
  "グラタン", "定食", "セット", "雑炊", "リゾット", "鍋",
];

function isAlcoholic(category: string, name: string): boolean {
  const text = category + name;
  return ALCOHOL_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isExcludedByKeyword(name: string, keywords: string[]): boolean {
  return keywords.some((keyword) => name.includes(keyword));
}

function toCandidate(food: Food): ComboCandidate {
  return {
    label: food.name,
    kcal: food.kcal,
    proteinG: food.proteinG,
    fatG: food.fatG,
    carbG: food.carbG,
  };
}

function filterFoods(foods: Food[], extraExcludeKeywords: string[]): Food[] {
  return foods.filter(
    (food) =>
      !isAlcoholic(food.category, food.name) &&
      !isExcludedByKeyword(food.name, ALWAYS_EXCLUDE_KEYWORDS) &&
      !includesStandaloneBread(food.name) &&
      !isExcludedByKeyword(food.name, extraExcludeKeywords),
  );
}

export type DailyMealCombos = {
  breakfast: MealCombo;
  lunch: MealCombo;
  dinner: MealCombo;
};

export type MealCombosByEdition = {
  convenienceStore: DailyMealCombos;
  eatingOut: DailyMealCombos;
};

type ChainCandidates = { chain: string; candidates: ComboCandidate[] };

// 複数の「店(チェーン)」候補それぞれについて単独で組み合わせを作り、targetに
// 最も近いもの(1店で完結する組み合わせ)を選ぶ。universalCandidatesは店を
// 問わず常に候補に加えるもの(コンビニ編のプロテイン飲料など)。
function pickBestSingleChainCombo(
  chainCandidatesList: ChainCandidates[],
  universalCandidates: ComboCandidate[],
  target: ComboTarget,
  excludeLabels: ReadonlySet<string>,
): { chain: string; combo: MealCombo } | null {
  let best: { chain: string; combo: MealCombo; score: number } | null = null;
  for (const { chain, candidates } of chainCandidatesList) {
    const pool = [...candidates, ...universalCandidates];
    if (pool.length === 0) continue;
    const combo = pickMealCombo(pool, target, excludeLabels);
    if (combo.items.length === 0) continue;
    const score = scoreCombo(combo, target);
    if (!best || score < best.score) {
      best = { chain, combo, score };
    }
  }
  return best ? { chain: best.chain, combo: best.combo } : null;
}

async function buildConvenienceStoreCombos(perMealTarget: ComboTarget): Promise<DailyMealCombos> {
  const rawFoodsByChain = new Map(
    await Promise.all(
      CONVENIENCE_STORE_CATEGORIES.map(
        async (chain) => [chain, await listFoodsByCategories([chain])] as const,
      ),
    ),
  );
  const universalFoods = (
    await listFoodsByCategories(UNIVERSAL_QUICK_PROTEIN_CATEGORIES)
  ).filter(isUniversalQuickProteinItem);

  const usedLabels = new Set<string>();

  function pickForMeal(extraExcludeKeywords: string[]): MealCombo {
    const chainCandidatesList: ChainCandidates[] = CONVENIENCE_STORE_CATEGORIES.map((chain) => ({
      chain,
      candidates: filterFoods(rawFoodsByChain.get(chain) ?? [], extraExcludeKeywords).map(toCandidate),
    }));
    const universalCandidates = filterFoods(universalFoods, extraExcludeKeywords).map(toCandidate);

    const result = pickBestSingleChainCombo(chainCandidatesList, universalCandidates, perMealTarget, usedLabels);
    const combo = result?.combo ?? { items: [], kcal: 0, proteinG: 0, fatG: 0, carbG: 0 };
    for (const item of combo.items) usedLabels.add(item.label);
    return combo;
  }

  return {
    breakfast: pickForMeal(QUICK_BREAKFAST_EXCLUDE_KEYWORDS),
    lunch: pickForMeal(LUNCH_EXCLUDE_KEYWORDS),
    dinner: pickForMeal([]),
  };
}

async function buildEatingOutCombos(perMealTarget: ComboTarget): Promise<DailyMealCombos> {
  const rawFoodsByChain = new Map(
    await Promise.all(
      EATING_OUT_CATEGORIES.map(
        async (chain) => [chain, await listFoodsByCategories([chain])] as const,
      ),
    ),
  );

  const usedLabels = new Set<string>();
  const usedChains = new Set<string>();

  function pickForMeal(chainPool: string[], extraExcludeKeywords: string[]): MealCombo {
    const chainCandidatesList: ChainCandidates[] = chainPool
      .filter((chain) => !usedChains.has(chain))
      .map((chain) => ({
        chain,
        candidates: filterFoods(rawFoodsByChain.get(chain) ?? [], extraExcludeKeywords).map(toCandidate),
      }));

    const result = pickBestSingleChainCombo(chainCandidatesList, [], perMealTarget, usedLabels);
    const combo = result?.combo ?? { items: [], kcal: 0, proteinG: 0, fatG: 0, carbG: 0 };
    if (result) {
      usedChains.add(result.chain);
      for (const item of combo.items) usedLabels.add(item.label);
    }
    return combo;
  }

  // 朝食はカフェ・軽食系の店に絞り、手軽に食べられるものにする。
  // 昼食・夕食は(朝食で使った店を除く)全チェーンから選ぶ。
  return {
    breakfast: pickForMeal(QUICK_BREAKFAST_EATING_OUT_CATEGORIES, []),
    lunch: pickForMeal(EATING_OUT_CATEGORIES, LUNCH_EXCLUDE_KEYWORDS),
    dinner: pickForMeal(EATING_OUT_CATEGORIES, []),
  };
}

// 現在の食品マスタから、コンビニ編・外食編それぞれの献立例(朝食・昼食・夕食)を
// 組み立てる。実在の商品を個数単位(1個ずつ、最大4品目)で組み合わせ、
// 1食分のP/F/C目標に近づけるので、家庭料理の献立例(meal-templates.ts)と違って
// グラム単位の調整はしない。
// - コンビニ編: 1食は必ず1つのチェーン(+チェーンを問わないプロテイン飲料)で完結する。
// - 外食編: 1食は必ず1つの店で完結し、朝食・昼食・夕食で同じ店を繰り返さない
//   (朝食はカフェ・軽食系の店に限定する)。
export async function getMealCombos(perMealTarget: ComboTarget): Promise<MealCombosByEdition> {
  const [convenienceStore, eatingOut] = await Promise.all([
    buildConvenienceStoreCombos(perMealTarget),
    buildEatingOutCombos(perMealTarget),
  ]);
  return { convenienceStore, eatingOut };
}
