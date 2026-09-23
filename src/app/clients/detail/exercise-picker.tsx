"use client";

import { forwardRef } from "react";
import type { Exercise } from "@/lib/db/exercises";
import { useItemPicker, type ItemPickerHandle } from "./use-item-picker";

export type ExercisePickerHandle = ItemPickerHandle;

function getExerciseId(exercise: Exercise): string {
  return exercise.id;
}

function formatExerciseLabel(exercise: Exercise): string {
  return exercise.name;
}

// モジュールスコープの安定した関数参照にする(コンポーネント内でインライン定義
// すると毎レンダー新しい関数になり、useItemPicker内のresultsのメモ化が
// 効かなくなってしまうため)。
function matchesExercise(exercise: Exercise, query: string): boolean {
  return (
    exercise.name.toLowerCase().includes(query) ||
    exercise.aliases.some((alias) => alias.toLowerCase().includes(query))
  );
}

// 種目マスタが100件超になり得るため、プルダウンでは選びにくい。食品選択の
// FoodPickerと同様、入力しながら候補(種目名・別名)を絞り込めるコンボボックスにする
// (状態管理はuseItemPicker、見た目だけここで組み立てる)。
export const ExercisePicker = forwardRef<
  ExercisePickerHandle,
  { exercises: Exercise[]; name: string; required?: boolean; defaultExercise?: Exercise | null }
>(function ExercisePicker({ exercises, name, required, defaultExercise }, ref) {
  const { selectedId, results, highlighted, isOpen, select, cancelBlur, inputProps } =
    useItemPicker({
      items: exercises,
      ref,
      getId: getExerciseId,
      matches: matchesExercise,
      formatLabel: formatExerciseLabel,
      required,
      defaultItem: defaultExercise,
      requiredMessage: "候補一覧から種目を選択してください。",
    });

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <input
        {...inputProps}
        type="text"
        placeholder="種目名で検索(例: ラット、スクワット)"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {isOpen && inputProps.value.trim() && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-200 bg-white text-sm shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">該当する種目が見つかりません</li>
          ) : (
            results.map((exercise, index) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    cancelBlur();
                  }}
                  onClick={() => select(exercise)}
                  className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    index === highlighted ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="font-medium">{exercise.name}</span>
                  {exercise.aliases.length > 0 && (
                    <span className="ml-1 text-xs text-gray-400">
                      ({exercise.aliases.join("、")})
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
