"use client";

import { useActionState, useState } from "react";
import type { Food } from "@/lib/db/foods";
import { updateFoodAction, deleteFoodAction } from "./actions";

export function FoodRow({ food }: { food: Food }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateFoodAction,
    undefined,
  );

  // 保存が成功したら(pendingがtrue->falseに変わり、エラーが無ければ)編集欄を閉じる。
  // レンダー中にpendingの変化を検知して同期的に状態を調整する(Reactが推奨する
  // 「レンダー中の状態調整」パターン)ことで、useEffectでのcascading re-renderを避ける。
  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && !state?.error) {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2 text-gray-500">{food.category || "—"}</td>
        <td className="px-4 py-2 font-medium">{food.name}</td>
        <td className="px-4 py-2 text-gray-500">{food.servingLabel}</td>
        <td className="px-4 py-2">{food.kcal}</td>
        <td className="px-4 py-2">{food.proteinG}</td>
        <td className="px-4 py-2">{food.fatG}</td>
        <td className="px-4 py-2">{food.carbG}</td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-gray-900"
          >
            編集
          </button>
          <form action={deleteFoodAction} className="inline">
            <input type="hidden" name="id" value={food.id} />
            <button
              type="submit"
              className="ml-3 text-xs text-gray-400 hover:text-red-600"
            >
              削除
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100 bg-gray-50">
      <td colSpan={8} className="px-4 py-3">
        <form action={formAction} className="grid gap-2 sm:grid-cols-8">
          <input type="hidden" name="id" value={food.id} />
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">分類</span>
            <input
              name="category"
              defaultValue={food.category}
              list="food-category-options"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">食品名</span>
            <input
              name="name"
              defaultValue={food.name}
              required
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">一人前の目安量</span>
            <input
              name="serving_label"
              defaultValue={food.servingLabel}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">kcal</span>
            <input
              name="kcal"
              type="number"
              step="0.1"
              min="0"
              defaultValue={food.kcal}
              required
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">P(g)</span>
            <input
              name="protein_g"
              type="number"
              step="0.1"
              min="0"
              defaultValue={food.proteinG}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">F(g)</span>
            <input
              name="fat_g"
              type="number"
              step="0.1"
              min="0"
              defaultValue={food.fatG}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">C(g)</span>
            <input
              name="carb_g"
              type="number"
              step="0.1"
              min="0"
              defaultValue={food.carbG}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-8">
            {state?.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {pending ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
