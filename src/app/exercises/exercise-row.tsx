"use client";

import { useActionState, useState } from "react";
import type { Exercise } from "@/lib/db/exercises";
import { updateExerciseAction, deleteExerciseAction } from "./actions";

export function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateExerciseAction,
    undefined,
  );

  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && !state?.error) {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2 font-medium">{exercise.name}</td>
        <td className="px-4 py-2 text-gray-500">
          {exercise.aliases.join("、") || "—"}
        </td>
        <td className="sticky right-0 bg-white px-4 py-2 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            編集
          </button>
          <form action={deleteExerciseAction} className="inline">
            <input type="hidden" name="id" value={exercise.id} />
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

  return (
    <tr className="border-t border-gray-100 bg-gray-50">
      <td colSpan={3} className="px-4 py-3">
        <form action={formAction} className="grid gap-2 sm:grid-cols-6">
          <input type="hidden" name="id" value={exercise.id} />
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">種目名</span>
            <input
              name="name"
              defaultValue={exercise.name}
              required
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-3">
            <span className="mb-1 block text-gray-500">別名(カンマ区切り)</span>
            <input
              name="aliases"
              defaultValue={exercise.aliases.join(", ")}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-6">
            {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {pending ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
