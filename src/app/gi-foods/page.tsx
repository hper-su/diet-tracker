"use client";

import { Suspense, useMemo, useState } from "react";
import {
  GI_FOODS,
  GI_HIGH_THRESHOLD,
  GI_MEDIUM_THRESHOLD,
  GI_LEVEL_LABELS,
  getGILevel,
  type GILevel,
} from "@/lib/gi-foods";

const LEVEL_BADGE_CLASS: Record<GILevel, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

function GILevelBadge({ level }: { level: GILevel }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE_CLASS[level]}`}
    >
      {GI_LEVEL_LABELS[level]}
    </span>
  );
}

export default function GIFoodsPage() {
  return (
    <Suspense>
      <GIFoodsPageInner />
    </Suspense>
  );
}

function GIFoodsPageInner() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? GI_FOODS.filter(
          (food) =>
            food.name.toLowerCase().includes(q) ||
            food.category.toLowerCase().includes(q),
        )
      : GI_FOODS;
    return [...rows].sort(
      (a, b) => a.category.localeCompare(b.category) || a.giValue - b.giValue,
    );
  }, [query]);

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
        <p className="text-xs text-gray-400">
          ※
          ブドウ糖を基準とした国際的な分類基準です。掲載しているGI値は複数の公表資料で広く紹介されている代表的な目安であり、品種・熟度・調理法・測定条件によって数値には幅があります。厳密な数値が必要な場合は最新の学術資料を参照してください。
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="mb-3 font-medium">
            食品のGI値一覧(全{GI_FOODS.length}件)
          </h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="食品名・分類で検索(例: 米、りんご、パン)"
            className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-gray-400">
            {query
              ? `「${query}」に一致する食品 ${filtered.length}件を表示しています。`
              : `全${filtered.length}件を分類・GI値の低い順で表示しています。`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">分類</th>
                <th className="px-4 py-2">食品名</th>
                <th className="px-4 py-2">GI値</th>
                <th className="px-4 py-2">区分</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((food) => (
                <tr
                  key={`${food.category}-${food.name}`}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-2 text-gray-500">{food.category}</td>
                  <td className="px-4 py-2 font-medium">{food.name}</td>
                  <td className="px-4 py-2">{food.giValue}</td>
                  <td className="px-4 py-2">
                    <GILevelBadge level={getGILevel(food.giValue)} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    該当する食品が見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
