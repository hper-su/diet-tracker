"use client";

import type { TrainingLog } from "@/lib/db/training-logs";
import type { Exercise } from "@/lib/db/exercises";
import { useEditableRow } from "@/components/use-editable-row";
import { ExercisePicker } from "../exercise-picker";
import { updateTrainingLogAction, deleteTrainingLogAction } from "./actions";

export function TrainingLogRow({
  log,
  clientId,
  exercises,
}: {
  log: TrainingLog;
  clientId: string;
  exercises: Exercise[];
}) {
  const { editing, setEditing, formAction, pending, error, cancel } = useEditableRow(
    updateTrainingLogAction,
    undefined,
  );

  if (!editing) {
    return (
      <tr
        className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 focus-visible:bg-gray-50"
        tabIndex={0}
        aria-label={`${log.exerciseName}を編集`}
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
        <td className="px-4 py-2 font-medium">{log.exerciseName}</td>
        <td className="px-4 py-2">{log.weight}</td>
        <td className="px-4 py-2">{log.reps}</td>
        <td className="px-4 py-2">{log.sets}</td>
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
          <form action={deleteTrainingLogAction} className="inline">
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

  const currentExercise =
    log.exerciseId != null
      ? (exercises.find((exercise) => exercise.id === log.exerciseId) ?? null)
      : null;

  return (
    <tr className="border-t border-gray-100 bg-gray-50">
      <td colSpan={6} className="px-4 py-3">
        <form
          action={formAction}
          className="sticky left-0 grid w-[min(56rem,calc(100vw-4rem))] gap-2 sm:grid-cols-12"
        >
          <input type="hidden" name="id" value={log.id} />
          <input type="hidden" name="client_id" value={clientId} />
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">日付</span>
            <input
              name="recorded_at"
              type="date"
              required
              defaultValue={log.recordedAt ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-3">
            <span className="mb-1 block text-gray-500">種目</span>
            <ExercisePicker
              exercises={exercises}
              name="exercise_id"
              defaultExercise={currentExercise}
              required
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">重さ</span>
            <input
              name="weight"
              defaultValue={log.weight}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">回数/秒数</span>
            <input
              name="reps"
              defaultValue={log.reps}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">セット数</span>
            <input
              name="sets"
              inputMode="numeric"
              defaultValue={log.sets}
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
          <div className="flex items-end gap-2 sm:col-span-12">
            {error && <p className="text-xs text-red-600">{error}</p>}
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
              onClick={cancel}
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
