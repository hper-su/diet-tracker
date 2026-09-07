"use client";

import { useMemo, useState } from "react";
import {
  GI_FOODS,
  GI_CATEGORY_ORDER,
  GI_HIGH_THRESHOLD,
  GI_MEDIUM_THRESHOLD,
  GI_LEVEL_LABELS,
  GI_COMBINATION_EXAMPLES,
  SNACK_GUIDE,
  getGILevel,
  type GILevel,
  type GIFood,
} from "@/lib/gi-foods";

const LEVEL_CHIP_CLASS: Record<GILevel, string> = {
  high: "border-red-200 bg-red-50 text-red-900",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-green-200 bg-green-50 text-green-900",
};

const LEVEL_DOT_CLASS: Record<GILevel, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const LEVEL_ORDER: GILevel[] = ["high", "medium", "low"];

function FoodChip({ food }: { food: GIFood }) {
  const level = getGILevel(food.giValue);
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${LEVEL_CHIP_CLASS[level]}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${LEVEL_DOT_CLASS[level]}`} />
        <span className="truncate font-medium">{food.name}</span>
      </span>
      <span className="shrink-0 font-semibold">{food.giValue}</span>
    </div>
  );
}

export default function GIFoodsPage() {
  const [query, setQuery] = useState("");

  const groupedByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? GI_FOODS.filter(
          (food) =>
            food.name.toLowerCase().includes(q) ||
            food.category.toLowerCase().includes(q),
        )
      : GI_FOODS;

    const byCategory = new Map<string, GIFood[]>();
    for (const food of rows) {
      const list = byCategory.get(food.category) ?? [];
      list.push(food);
      byCategory.set(food.category, list);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.giValue - b.giValue);
    }

    // GI_CATEGORY_ORDERに無いカテゴリ(データ追加時の入力漏れ・typo等)があっても
    // 一覧から静かに消えてしまわないよう、末尾に補って表示する。
    const knownCategories = new Set<string>(GI_CATEGORY_ORDER);
    const extraCategories = Array.from(byCategory.keys()).filter(
      (category) => !knownCategories.has(category),
    );

    return [...GI_CATEGORY_ORDER, ...extraCategories]
      .map((category) => ({
        category,
        foods: byCategory.get(category) ?? [],
      }))
      .filter((group) => group.foods.length > 0);
  }, [query]);

  const totalCount = groupedByCategory.reduce((sum, g) => sum + g.foods.length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">GI食品</h1>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <h2 className="font-medium text-gray-900">GI値とは</h2>
        <p>
          GI値(グリセミック・インデックス、Glycemic
          Index)は、食後の血糖値の上がりやすさを、ブドウ糖(グルコース)を摂取した場合を100として相対的に数値化した指標です。同じ糖質量でも、GI値が高い食品ほど血糖値が急上昇しやすく、低い食品ほど緩やかに上昇するとされています。血糖コントロールを意識した食事指導の参考情報として使えます。
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-700">高GI食品</p>
            <p className="text-lg font-semibold text-red-900">
              {GI_HIGH_THRESHOLD}以上
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">中GI食品</p>
            <p className="text-lg font-semibold text-amber-900">
              {GI_MEDIUM_THRESHOLD}〜{GI_HIGH_THRESHOLD - 1}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-xs text-green-700">低GI食品</p>
            <p className="text-lg font-semibold text-green-900">
              {GI_MEDIUM_THRESHOLD - 1}以下
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
          <p className="text-xs font-medium">食後の眠気とGI値の関係</p>
          <p className="mt-1 text-xs">
            高GI食品を摂ると血糖値が急上昇し、それを下げようとインスリンが多く分泌されます。その結果、今度は血糖値が急降下する「血糖値スパイク」と呼ばれる乱高下が起こることがあり、これが食後の強い眠気やだるさ、集中力の低下につながるとされています。低GI食品を選んだり、野菜から先に食べる、単品ではなく他の食品と組み合わせるといった工夫で血糖値の変動を緩やかにすると、食後の眠気を抑えやすくなると考えられています。
          </p>
        </div>
        <p className="text-xs text-gray-400">
          ※
          ブドウ糖を基準とした国際的な分類基準です。掲載しているGI値は複数の公表資料で広く紹介されている代表的な目安であり、品種・熟度・調理法・測定条件によって数値には幅があります。厳密な数値が必要な場合は最新の学術資料を参照してください。
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <h2 className="font-medium text-gray-900">
            組み合わせでGI値は変わる(白米の例)
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            同じ白米でも、一緒に食べるものや食べ方でGI値の目安は変わります。
          </p>
          <ul className="mt-3 space-y-1.5">
            {GI_COMBINATION_EXAMPLES.map((example) => (
              <li
                key={example.combination}
                className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-1.5"
              >
                <span>{example.combination}</span>
                <span className="font-semibold text-gray-900">
                  {example.giValue}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <h2 className="font-medium text-gray-900">間食(おやつ)の目安量</h2>
          <p className="mt-1 text-xs text-gray-500">
            出典: 日本糖尿病学会「糖尿病食事療法のための食品交換表」の例
          </p>
          <ul className="mt-3 space-y-1.5">
            {SNACK_GUIDE.map((snack) => (
              <li
                key={snack.name}
                className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-1.5"
              >
                <span>{snack.name}</span>
                <span className="font-semibold text-gray-900">{snack.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">食品のGI値一覧(全{totalCount}件)</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {LEVEL_ORDER.map((level) => (
              <span key={level} className="flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${LEVEL_DOT_CLASS[level]}`}
                />
                {GI_LEVEL_LABELS[level]}
              </span>
            ))}
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="食品名・分類で検索(例: 米、りんご、パン)"
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="mt-4 space-y-5">
          {groupedByCategory.map((group) => (
            <div key={group.category}>
              <h3 className="mb-2 text-sm font-medium text-gray-500">
                {group.category}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.foods.map((food) => (
                  <FoodChip key={food.name} food={food} />
                ))}
              </div>
            </div>
          ))}
          {groupedByCategory.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              該当する食品が見つかりませんでした。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
