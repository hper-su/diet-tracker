"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addTrainingLogAction } from "./actions";
import { ExercisePicker, type ExercisePickerHandle } from "../exercise-picker";
import type { Exercise } from "@/lib/db/exercises";

type Row = { key: number };

export function TrainingLogForm({
  clientId,
  date,
  exercises,
}: {
  clientId: string;
  date: string;
  exercises: Exercise[];
}) {
  const [state, formAction, pending] = useActionState(
    addTrainingLogAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nextKey = useRef(1);
  const [rows, setRows] = useState<Row[]>([{ key: 0 }]);
  const exercisePickerRefs = useRef(new Map<number, ExercisePickerHandle | null>());
  const rowRefs = useRef(new Map<number, HTMLDivElement | null>());
  // 重さ・回数・セット数・メモのいずれかに入力がある行だけ、種目の選択を必須にする
  // (何も入力していない行は無視してよいが、他の項目を入力したのに種目の選択を
  // 忘れた行を無言で捨ててしまうと、せっかく入力したデータが失われてしまうため)。
  const [rowRequired, setRowRequired] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      exercisePickerRefs.current.forEach((handle) => handle?.reset());
    }
  }, [pending, state]);

  // rowRequiredのリセットはReact状態の更新なので、effect内ではなくレンダー中に
  // pendingの変化を検知して行う(useEffect内でのsetStateはcascading renderを
  // 招くため避ける。use-editable-row.tsと同じ考え方)。
  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && !state?.error) {
      setRowRequired({});
    }
  }

  function handleRowFieldChange(key: number) {
    const rowEl = rowRefs.current.get(key);
    if (!rowEl) return;
    const inputs = rowEl.querySelectorAll<HTMLInputElement>(
      'input[name="weight"], input[name="reps"], input[name="sets"], input[name="memo"]',
    );
    const hasData = Array.from(inputs).some((input) => input.value.trim() !== "");
    setRowRequired((prev) => ({ ...prev, [key]: hasData }));
  }

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey.current++ }]);
  }

  function removeRow(key: number) {
    exercisePickerRefs.current.delete(key);
    rowRefs.current.delete(key);
    setRowRequired((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  if (exercises.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        先に「種目マスタ」で種目を登録してください。
      </p>
    );
  }

  return (
    <form
      key={date}
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">トレーニングを記録</h2>
      <p className="text-xs text-gray-500">
        実施した種目ごとに、まとめて登録できます。
      </p>
      <input type="hidden" name="client_id" value={clientId} />

      <div>
        <span className="mb-1 block text-xs text-gray-500">記録する日付</span>
        <input
          name="recorded_at"
          type="date"
          required
          defaultValue={date}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={row.key}
            ref={(el) => {
              rowRefs.current.set(row.key, el);
            }}
            className="grid items-start gap-2 sm:grid-cols-12"
          >
            <div className="sm:col-span-4">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">種目</span>
              )}
              <ExercisePicker
                ref={(handle) => {
                  exercisePickerRefs.current.set(row.key, handle);
                }}
                exercises={exercises}
                name="exercise_id"
                required={rowRequired[row.key] ?? false}
              />
            </div>
            <div className="sm:col-span-2">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">重さ</span>
              )}
              <input
                name="weight"
                placeholder="例: 60、25,20"
                onChange={() => handleRowFieldChange(row.key)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">
                  回数/秒数
                </span>
              )}
              <input
                name="reps"
                placeholder="例: 15、10-8-6"
                onChange={() => handleRowFieldChange(row.key)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-1">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">セット数</span>
              )}
              <input
                name="sets"
                inputMode="numeric"
                placeholder="例: 3"
                onChange={() => handleRowFieldChange(row.key)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              {index === 0 && (
                <span className="mb-1 block text-xs text-gray-500">
                  メモ(任意)
                </span>
              )}
              <input
                name="memo"
                placeholder="メモ(任意)"
                onChange={() => handleRowFieldChange(row.key)}
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
        + 種目を追加
      </button>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "登録中..." : "記録する"}
        </button>
      </div>
    </form>
  );
}
