"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/db/exercises";
import { useSearchCombobox } from "./use-search-combobox";

const MAX_RESULTS = 20;

export type ExercisePickerHandle = {
  reset: () => void;
};

// 種目マスタが100件超になり得るため、プルダウンでは選びにくい。食品選択の
// FoodPickerと同様、入力しながら候補(種目名・別名)を絞り込めるコンボボックスにする。
export const ExercisePicker = forwardRef<
  ExercisePickerHandle,
  { exercises: Exercise[]; name: string; required?: boolean; defaultExercise?: Exercise | null }
>(function ExercisePicker({ exercises, name, required, defaultExercise }, ref) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultExercise?.id ?? null);
  const combo = useSearchCombobox();
  const { query, setQuery, isOpen, setIsOpen, highlighted } = combo;
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedId(null);
      combo.reset();
    },
  }));

  // 編集フォームなど、既存の選択済み種目をあらかじめ表示したい場合に使う
  // (defaultValueと同様、マウント時の初期表示だけに使い、以後の変化は追わない)。
  useEffect(() => {
    if (defaultExercise) {
      setQuery(defaultExercise.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // requiredはvalue(=selectedId)ではなく見た目上のテキスト欄に付いていると、
  // 候補を選ばず文字だけ入力した状態でもネイティブのバリデーションを通ってしまう。
  // selectedIdの有無で独自にカスタムバリデーションメッセージを出す。
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && selectedId === null ? "候補一覧から種目を選択してください。" : "",
    );
  }, [required, selectedId]);

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return [];
    return exercises
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(trimmed) ||
          exercise.aliases.some((alias) => alias.toLowerCase().includes(trimmed)),
      )
      .slice(0, MAX_RESULTS);
  }, [exercises, trimmed]);

  function selectExercise(exercise: Exercise) {
    setSelectedId(exercise.id);
    setQuery(exercise.name);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        autoComplete="off"
        placeholder="種目名で検索(例: ラット、スクワット)"
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
          combo.handleKeyDown(e, results.length, (index) => selectExercise(results[index]))
        }
      />
      {isOpen && trimmed && (
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
                    combo.cancelBlur();
                  }}
                  onClick={() => selectExercise(exercise)}
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
