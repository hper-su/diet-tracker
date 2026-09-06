"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addUsualMealAction } from "./usual-meal-actions";
import { FoodPicker, type FoodPickerHandle } from "../food-picker";
import type { Food } from "@/lib/db/foods";

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
] as const;

type Row = { key: number };

export function UsualMealForm({
  clientId,
  foods,
}: {
  clientId: number;
  foods: Food[];
}) {
  const [state, formAction, pending] = useActionState(
    addUsualMealAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nextKey = useRef(1);
  const [rows, setRows] = useState<Row[]>([{ key: 0 }]);
  const foodPickerRefs = useRef(new Map<number, FoodPickerHandle | null>());

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      foodPickerRefs.current.forEach((handle) => handle?.reset());
    }
  }, [pending, state]);

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey.current++ }]);
  }

  function removeRow(key: number) {
    foodPickerRefs.current.delete(key);
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

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
      <h2 className="font-medium">普段の3食を記録</h2>
      <p className="text-xs text-gray-500">
        品目ごとに区分を選び、まとめて登録できます。
      </p>
      <input type="hidden" name="client_id" value={clientId} />

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="grid items-start gap-2 sm:grid-cols-6">
            <div className="sm:col-span-1">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">区分</span>
              )}
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
            </div>
            <div className="sm:col-span-3">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">食品</span>
              )}
              <FoodPicker
                ref={(handle) => {
                  foodPickerRefs.current.set(row.key, handle);
                }}
                foods={foods}
                name="food_id"
              />
            </div>
            <div className="sm:col-span-1">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">
                  数量(倍数)
                </span>
              )}
              <input
                name="quantity"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="例: 1"
                defaultValue="1"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex sm:col-span-1 sm:items-end sm:pb-0.5">
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-30"
              >
                行を削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
      >
        + 品目を追加
      </button>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "登録中..." : "登録"}
        </button>
      </div>
    </form>
  );
}
