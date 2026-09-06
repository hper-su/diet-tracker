"use client";

import { useActionState, useRef, useEffect } from "react";
import { addMealLogAction } from "./actions";
import { FoodPicker, type FoodPickerHandle } from "../food-picker";
import type { Food } from "@/lib/db/foods";

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
] as const;

export function MealLogForm({
  clientId,
  date,
  foods,
}: {
  clientId: number;
  date: string;
  foods: Food[];
}) {
  const [state, formAction, pending] = useActionState(
    addMealLogAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const foodPickerRef = useRef<FoodPickerHandle>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      foodPickerRef.current?.reset();
    }
  }, [pending, state]);

  if (foods.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        先に「食品マスタ」で食品を登録してください。
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">食事を記録</h2>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="recorded_at" value={date} />
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">区分</span>
          <select
            name="meal_type"
            required
            defaultValue="breakfast"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {MEAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">食品</span>
          <FoodPicker ref={foodPickerRef} foods={foods} name="food_id" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            数量(基準量の倍数)
          </span>
          <input
            name="quantity"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="例: 1"
            defaultValue="1"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-4">
          <span className="mb-1 block text-xs text-gray-500">メモ(任意)</span>
          <input
            name="memo"
            placeholder="メモ(任意)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "登録中..." : "記録する"}
      </button>
    </form>
  );
}
