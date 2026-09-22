// add-meal-log.mjsが使う、CLI引数のパースと1件分の入力検証。Firestore等の
// 外部通信を伴わない純粋なロジックだけをここに切り出し、vitestでテストできる
// ようにしている(scripts/lib/meal-log-entry.test.mjs参照)。

export const MEAL_TYPE_ALIASES = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snack",
  朝食: "breakfast",
  昼食: "lunch",
  夕食: "dinner",
  間食: "snack",
};

// "--foo bar --baz" → { foo: "bar", baz: true }
// (値を伴わないフラグはtrueになる。次のトークンが"--"始まりの場合も同様)
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

// 1件分の生入力(文字列ベース)を、Firestoreに書き込める形へ検証・変換する。
// 不正な入力についてはErrorをthrowする(呼び出し側でエラーメッセージとして
// そのまま表示する想定)。
export function normalizeEntry(raw, index) {
  const label = `${index + 1}件目`;
  const clientQuery = raw.client;
  const date = raw.date;
  const mealTypeRaw = raw.meal;
  const foodName = raw.food;

  if (!clientQuery) throw new Error(`${label}: client(お客様名またはID)を指定してください。`);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    throw new Error(`${label}: date はYYYY-MM-DD形式で指定してください。`);
  }
  const mealType = MEAL_TYPE_ALIASES[mealTypeRaw];
  if (!mealType) {
    throw new Error(`${label}: meal の値が不正です(breakfast/lunch/dinner/snack): ${mealTypeRaw}`);
  }
  if (!foodName) throw new Error(`${label}: food(品目名)を指定してください。`);

  // qty省略時は1がデフォルト値だが、「--qty」だけを付けて値を書き忘れた場合は
  // (parseArgsがtrueを渡してくる)デフォルト値へ静かに落とさず、他の必須項目と
  // 同様にエラーにする。
  let quantity = 1;
  if (raw.qty !== undefined) {
    const n = Number(raw.qty);
    if (raw.qty === true || !Number.isFinite(n) || n <= 0) {
      throw new Error(`${label}: qty は正の数で指定してください。`);
    }
    quantity = n;
  }

  // kcal/PFCは、AI解析側の誤り(パース漏れ等)をそのまま記録してしまわないよう、
  // アプリ本体のバリデーション(isFiniteNonNegative、負数は不可・0は可。
  // 例: ブラックコーヒー0kcal)と同じ基準にする。
  const toNumber = (value, fieldName) => {
    const n = Number(value);
    if (value === undefined || value === true || !Number.isFinite(n) || n < 0) {
      throw new Error(`${label}: ${fieldName} は0以上の数値で指定してください。`);
    }
    return n;
  };

  return {
    clientQuery: String(clientQuery),
    recordedAt: String(date),
    mealType,
    foodName: String(foodName),
    quantity,
    kcal: toNumber(raw.kcal, "kcal"),
    proteinG: toNumber(raw.protein, "protein"),
    fatG: toNumber(raw.fat, "fat"),
    carbG: toNumber(raw.carb, "carb"),
    memo: typeof raw.memo === "string" && raw.memo.length > 0 ? raw.memo : null,
  };
}
