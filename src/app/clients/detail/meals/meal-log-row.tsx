"use client";

import { useActionState, useState } from "react";
import type { MealLog } from "@/lib/db/meal-logs";
import type { Food } from "@/lib/db/foods";
import { FoodPicker } from "../food-picker";
import { updateMealLogAction, deleteMealLogAction } from "./actions";

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
] as const;

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export function MealLogRow({
  log,
  clientId,
  foods,
}: {
  log: MealLog;
  clientId: string;
  foods: Food[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMealLogAction,
    undefined,
  );
  // キャンセル後に編集欄を開き直したとき、前回送信時のエラーが
  // (再送信していないのに)表示され続けないようにするためのフラグ。
  const [errorDismissed, setErrorDismissed] = useState(false);

  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (pending) {
      setErrorDismissed(false);
    } else if (!state?.error) {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <tr
        className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 focus-visible:bg-gray-50"
        tabIndex={0}
        aria-label={`${log.foodName}を編集`}
        onClick={() => {
          // 文字を選択してコピーしようとしただけのときは編集を開かない。
          if (window.getSelection()?.toString()) return;
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setEditing(true);
          }
        }}
      >
        <td className="px-4 py-2">{MEAL_TYPE_LABELS[log.mealType]}</td>
        <td className="px-4 py-2">{log.foodName}</td>
        <td className="px-4 py-2">{log.quantity}</td>
        <td className="px-4 py-2">{log.kcal.toFixed(0)}</td>
        <td className="px-4 py-2 text-gray-500">
          {log.proteinG.toFixed(1)}/{log.fatG.toFixed(1)}/{log.carbG.toFixed(1)}
        </td>
        <td className="px-4 py-2 text-gray-500">{log.memo ?? ""}</td>
        <td
          className="sticky right-0 bg-white px-4 py-2 text-right whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            編集
          </button>
          <form action={deleteMealLogAction} className="inline">
            <input type="hidden" name="id" value={log.id} />
            <input type="hidden" name="client_id" value={clientId} />
            <button
              type="submit"
              className="rounded px-2 py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              削除
            </button>
          </form>
        </td>
      </tr>
    );
  }

  const currentFood =
    log.foodId != null ? (foods.find((food) => food.id === log.foodId) ?? null) : null;

  return (
    <tr className="border-t border-gray-100 bg-gray-50">
      <td colSpan={7} className="px-4 py-3">
        <form
          action={formAction}
          className="sticky left-0 grid w-[min(52rem,calc(100vw-4rem))] gap-2 sm:grid-cols-10"
        >
          <input type="hidden" name="id" value={log.id} />
          <input type="hidden" name="client_id" value={clientId} />
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">日付</span>
            <input
              name="recorded_at"
              type="date"
              required
              defaultValue={log.recordedAt}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">区分</span>
            <select
              name="meal_type"
              required
              defaultValue={log.mealType}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {MEAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs sm:col-span-3">
            <span className="mb-1 block text-gray-500">食品</span>
            <FoodPicker foods={foods} name="food_id" defaultFood={currentFood} required />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">数量(倍数)</span>
            <input
              name="quantity"
              type="number"
              step="0.1"
              min="0.1"
              defaultValue={log.quantity}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">メモ</span>
            <input
              name="memo"
              defaultValue={log.memo ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-10">
            {state?.error && !errorDismissed && (
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
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setErrorDismissed(true);
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
