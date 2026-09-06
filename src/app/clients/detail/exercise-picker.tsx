"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import type { Exercise } from "@/lib/db/exercises";
import { CUSTOM_EXERCISE_VALUE } from "@/lib/validation/usual-exercise";
import { useSearchCombobox } from "./use-search-combobox";

const MAX_RESULTS = 50;

function formatLabel(exercise: Exercise): string {
  return `${exercise.name}(${exercise.mets}メッツ)`;
}

export type ExercisePickerHandle = {
  reset: () => void;
};

// 種目数は数十件程度だが、名前で絞り込めた方が探しやすいため、
// 食品選択と同じ「入力しながら候補を絞り込むコンボボックス」にする。
// 未入力時は全件を候補として表示するので、一覧から選ぶこともできる。
export const ExercisePicker = forwardRef<
  ExercisePickerHandle,
  { exercises: Exercise[] }
>(function ExercisePicker({ exercises }, ref) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const combo = useSearchCombobox();
  const { query, setQuery, isOpen, setIsOpen, highlighted } = combo;

  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedId(null);
      setIsCustom(false);
      combo.reset();
    },
  }));

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    const pool = trimmed
      ? exercises.filter(
          (exercise) =>
            exercise.name.toLowerCase().includes(trimmed) ||
            exercise.category.toLowerCase().includes(trimmed),
        )
      : exercises;
    return pool.slice(0, MAX_RESULTS);
  }, [exercises, trimmed]);

  const customIndex = results.length;

  function selectExercise(exercise: Exercise) {
    setSelectedId(exercise.id);
    setIsCustom(false);
    setQuery(formatLabel(exercise));
    setIsOpen(false);
  }

  function selectCustom() {
    setSelectedId(null);
    setIsCustom(true);
    setQuery("その他(自由入力)");
    setIsOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="hidden"
          name="exercise_id"
          value={isCustom ? CUSTOM_EXERCISE_VALUE : (selectedId ?? "")}
        />
        <input
          type="text"
          required={!isCustom}
          value={query}
          autoComplete="off"
          placeholder="運動名で検索(例: 散歩、自転車)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
            setIsCustom(false);
            setIsOpen(true);
            combo.setHighlighted(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={combo.scheduleBlur}
          onKeyDown={(e) =>
            combo.handleKeyDown(e, customIndex + 1, (index) =>
              index === customIndex
                ? selectCustom()
                : results[index] && selectExercise(results[index]),
            )
          }
        />
        {isOpen && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-200 bg-white text-sm shadow-lg">
            {trimmed && results.length === 0 && (
              <li className="px-3 py-2 text-gray-400">
                該当する運動が見つかりません
              </li>
            )}
            {results.map((exercise, index) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    combo.cancelBlur();
                  }}
                  onClick={() => selectExercise(exercise)}
                  className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    index === highlighted ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="font-medium">{exercise.name}</span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({exercise.mets}メッツ)
                  </span>
                  <span className="block text-xs text-gray-400">
                    {exercise.category}
                  </span>
                </button>
              </li>
            ))}
            <li className="border-t border-gray-100">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  combo.cancelBlur();
                }}
                onClick={selectCustom}
                className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${
                  highlighted === customIndex ? "bg-gray-100" : ""
                }`}
              >
                その他(自由入力)
              </button>
            </li>
          </ul>
        )}
      </div>
      {isCustom && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="custom_name"
            placeholder="運動の名前"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="custom_mets"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="メッツ(METs)。例: 4.0"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
});
