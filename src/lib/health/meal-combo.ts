// コンビニ・外食の献立例向け: グラム単位で自由に量を調整できる生の食材と違い、
// コンビニ・外食の商品は個数単位でしか選べない(「おにぎり1.3個」のような調整は
// できない)。そのため、候補となる実在の商品の中から、1食分のP/F/C目標に
// 合計が最も近づく組み合わせ(各商品は1個ずつ、最大MAX_ITEMS品目)を
// 貪欲法(greedy)で選ぶ。
//
// 手順: 候補の中から「追加した場合に目標との差が最も縮む商品」を1品ずつ選び、
// 追加してもそれ以上差が縮まらなくなったら打ち切る。目標を超える方向の差は
// (食べ過ぎになるため)下回る方向の差より重く見積もり、大きすぎる商品ばかり
// 選ばれないようにする。
export type ComboCandidate = {
  label: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type ComboTarget = {
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type MealCombo = {
  items: ComboCandidate[];
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

const MAX_ITEMS = 4;
// 総合的なズレ(kcal換算)がこの値を下回ったら、それ以上は品目を追加せず
// 打ち切ってよいとみなす。カロリーだけで判定すると、脂質の多い1品だけで
// カロリーは目標近くまで届いてもたんぱく質が大きく不足したまま止まって
// しまうため、P/F/Cすべてを合算したズレで判定する。
const GOOD_ENOUGH_ERROR_KCAL = 60;

// アプリ全体の方針(高たんぱく・低脂質)に合わせ、栄養素ごとに「目標未達」と
// 「目標超過」の重みを非対称にする。
// - たんぱく質: 未達(足りない)を重く、超過(多め)は軽く見積もる
//   (たんぱく質は目標より多めでもよいので、届かせることを優先する)。
// - 脂質: 超過(多め)を重く、未達(少なめ)は軽く見積もる
//   (脂質は目標より少なめでもよいので、超過を避けることを優先する)。
// - カロリー・炭水化物: 食べ過ぎ方向をやや重く見積もる程度の対称寄り。
const PENALTY_WEIGHTS = {
  kcal: { under: 1, over: 2 },
  proteinG: { under: 3, over: 0.5 },
  fatG: { under: 0.5, over: 3 },
  carbG: { under: 1, over: 2 },
} as const;

function estimateTargetKcal(target: ComboTarget): number {
  return target.proteinG * 4 + target.fatG * 9 + target.carbG * 4;
}

type Totals = { kcal: number; proteinG: number; fatG: number; carbG: number };

function addTotals(a: Totals, b: ComboCandidate): Totals {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    fatG: a.fatG + b.fatG,
    carbG: a.carbG + b.carbG,
  };
}

// (目標 - 現在値)の差を、kcal換算した「ズレの大きさ」に変換する。diffToTargetが
// 正(まだ目標に届いていない)ならunder、負(目標を超えている)ならoverの重みを掛ける。
function weightedPenalty(diffToTarget: number, weights: { under: number; over: number }): number {
  return diffToTarget >= 0 ? diffToTarget * weights.under : Math.abs(diffToTarget) * weights.over;
}

function totalError(totals: Totals, target: ComboTarget, targetKcal: number): number {
  return (
    weightedPenalty(targetKcal - totals.kcal, PENALTY_WEIGHTS.kcal) +
    weightedPenalty((target.proteinG - totals.proteinG) * 4, PENALTY_WEIGHTS.proteinG) +
    weightedPenalty((target.fatG - totals.fatG) * 9, PENALTY_WEIGHTS.fatG) +
    weightedPenalty((target.carbG - totals.carbG) * 4, PENALTY_WEIGHTS.carbG)
  );
}

// candidatesの中から、targetに最も近づく実在商品の組み合わせ(1品ずつ、最大
// MAX_ITEMS品目)を貪欲法で選ぶ。同じ商品(label)は1回しか選ばない。
// excludeLabelsに含まれる商品は候補から除外する(呼び出し側が「既に別の食事で
// 使った商品」や「除外したい商品」を渡す。この関数自体は引数を変更しない)。
export function pickMealCombo(
  candidates: ComboCandidate[],
  target: ComboTarget,
  excludeLabels?: ReadonlySet<string>,
): MealCombo {
  const targetKcal = estimateTargetKcal(target);
  let totals: Totals = { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 };
  const chosen: ComboCandidate[] = [];
  const usedLabels = new Set<string>(excludeLabels);

  for (let i = 0; i < MAX_ITEMS; i++) {
    let best: ComboCandidate | null = null;
    let bestScore = Infinity;
    for (const candidate of candidates) {
      if (usedLabels.has(candidate.label)) continue;
      const newTotals = addTotals(totals, candidate);
      const score = totalError(newTotals, target, targetKcal);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (!best) break;

    const currentScore = totalError(totals, target, targetKcal);
    if (chosen.length > 0 && bestScore >= currentScore) break;

    chosen.push(best);
    usedLabels.add(best.label);
    totals = addTotals(totals, best);

    if (bestScore <= GOOD_ENOUGH_ERROR_KCAL) break;
  }

  return { items: chosen, ...totals };
}

// combo(pickMealComboの結果)がtargetにどれだけ近いかをkcal換算のズレで返す。
// 値が小さいほど良い。複数の候補(コンビニ編で「どのチェーン単独が一番良いか」を
// 比較する場合など)を比べるのに使う。
export function scoreCombo(combo: MealCombo, target: ComboTarget): number {
  const targetKcal = estimateTargetKcal(target);
  return totalError(combo, target, targetKcal);
}
