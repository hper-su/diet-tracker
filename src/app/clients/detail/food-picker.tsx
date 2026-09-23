"use client";

import { forwardRef } from "react";
import type { Food } from "@/lib/db/foods";
import { useItemPicker, type ItemPickerHandle } from "./use-item-picker";

export type FoodPickerHandle = ItemPickerHandle;

function formatLabel(food: Food): string {
  return `${food.name}(${food.servingLabel} ${food.kcal}kcal)`;
}

// 食品マスタが数千件規模のため、プルダウンでは選びにくい。
// 入力しながら候補を絞り込めるコンボボックスにして検索性を上げる
// (状態管理はuseItemPicker、見た目だけここで組み立てる)。
export const FoodPicker = forwardRef<
  FoodPickerHandle,
  { foods: Food[]; name: string; required?: boolean; defaultFood?: Food | null }
>(function FoodPicker({ foods, name, required, defaultFood }, ref) {
  const { selectedId, results, highlighted, isOpen, select, cancelBlur, inputProps } =
    useItemPicker({
      items: foods,
      ref,
      getId: (food) => food.id,
      matches: (food, q) =>
        food.name.toLowerCase().includes(q) || food.category.toLowerCase().includes(q),
      formatLabel,
      required,
      defaultItem: defaultFood,
      requiredMessage: "候補一覧から食品を選択してください。",
    });

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <input
        {...inputProps}
        type="text"
        placeholder="食品名で検索(例: 鶏、りんご)"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {isOpen && inputProps.value.trim() && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-200 bg-white text-sm shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">
              該当する食品が見つかりません
            </li>
          ) : (
            results.map((food, index) => (
              <li key={food.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    cancelBlur();
                  }}
                  onClick={() => select(food)}
                  className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    index === highlighted ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="font-medium">{food.name}</span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({food.servingLabel} {food.kcal}kcal)
                  </span>
                  {food.category && (
                    <span className="block text-xs text-gray-400">
                      {food.category}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});
