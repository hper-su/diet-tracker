"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "@/lib/db/use-live-query";
import { listFoodsPage, countFoods, listFoodCategories } from "@/lib/db/foods";
import { FoodForm } from "./food-form";
import { FoodRow } from "./food-row";

const DATA_SOURCE_NOTE =
  "出典: 文部科学省「日本食品標準成分表」より算出。一人前の目安量あたりの値です。";

export default function FoodsPage() {
  return (
    <Suspense>
      <FoodsPageInner />
    </Suspense>
  );
}

function FoodsPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const page = Number(searchParams.get("page")) || 1;

  const data = useLiveQuery(async () => {
    const [{ foods, total, totalPages }, grandTotal, categories] = await Promise.all([
      listFoodsPage(query, page),
      countFoods(),
      listFoodCategories(),
    ]);
    return { foods, total, totalPages, grandTotal, categories };
  }, [query, page], ["foods"]);

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(targetPage));
    return `/foods?${params.toString()}`;
  }

  if (!data) return null;
  const { foods, total, totalPages, grandTotal, categories } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">食品マスタ</h1>

      <FoodForm categories={categories} />

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="mb-3 font-medium">
            登録済みの食品(全{grandTotal.toLocaleString()}件)
          </h2>
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="食品名・分類で検索(例: 鶏、りんご、韓国料理)"
              className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              検索
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-400">
            {query
              ? `「${query}」に一致する食品 ${total.toLocaleString()}件中 ${
                  foods.length
                }件を表示しています。`
              : `全${total.toLocaleString()}件を分類・食品名順で表示しています。`}
          </p>
          <p className="mt-1 text-[10px] text-gray-400">{DATA_SOURCE_NOTE}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">分類</th>
                <th className="px-4 py-2">食品名</th>
                <th className="px-4 py-2">一人前の目安量</th>
                <th className="px-4 py-2">kcal</th>
                <th className="px-4 py-2">P(g)</th>
                <th className="px-4 py-2">F(g)</th>
                <th className="px-4 py-2">C(g)</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
              {foods.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    {query
                      ? "該当する食品が見つかりませんでした。"
                      : "まだ食品が登録されていません。"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 p-4 text-sm">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={`rounded border border-gray-300 px-3 py-1 ${
                page <= 1
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-gray-50"
              }`}
            >
              ← 前へ
            </Link>
            <span className="text-gray-500">
              {page} / {totalPages} ページ
            </span>
            <Link
              href={pageHref(Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={`rounded border border-gray-300 px-3 py-1 ${
                page >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-gray-50"
              }`}
            >
              次へ →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
