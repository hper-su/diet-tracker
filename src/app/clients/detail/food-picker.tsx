"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import type { Food } from "@/lib/db/foods";
import { useSearchCombobox } from "./use-search-combobox";

const MAX_RESULTS = 20;

function formatLabel(food: Food): string {
  return `${food.name}(${food.servingLabel} ${food.kcal}kcal)`;
}

export type FoodPickerHandle = {
  reset: () => void;
};

// 食品マスタが数千件規模のため、プルダウンでは選びにくい。
// 入力しながら候補を絞り込めるコンボボックスにして検索性を上げる。
export const FoodPicker = forwardRef<
  FoodPickerHandle,
  { foods: Food[]; name: string; required?: boolean }
>(function FoodPicker({ foods, name, required }, ref) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const combo = useSearchCombobox();
  const { query, setQuery, isOpen, setIsOpen, highlighted } = combo;

  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedId(null);
      combo.reset();
    },
  }));

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return [];
    return foods
      .filter(
        (food) =>
          food.name.toLowerCase().includes(trimmed) ||
          food.category.toLowerCase().includes(trimmed),
      )
      .slice(0, MAX_RESULTS);
  }, [foods, trimmed]);

  function selectFood(food: Food) {
    setSelectedId(food.id);
    setQuery(formatLabel(food));
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <input
        type="text"
        required={required}
        value={query}
        autoComplete="off"
        placeholder="食品名で検索(例: 鶏、りんご)"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
          setIsOpen(true);
          combo.setHighlighted(0);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={combo.scheduleBlur}
        onKeyDown={(e) =>
          combo.handleKeyDown(e, results.length, (index) => selectFood(results[index]))
        }
      />
      {isOpen && trimmed && (
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
                    combo.cancelBlur();
                  }}
                  onClick={() => selectFood(food)}
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
