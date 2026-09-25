"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/db/exercises";
import { useEditableRow } from "@/components/use-editable-row";
import { WgerExercisePanel } from "@/components/wger-exercise-panel";
import { getWgerExercise } from "@/lib/wger/data";
import { updateExerciseAction, deleteExerciseAction } from "./actions";
import { WgerSelect } from "./wger-select";

export function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const { editing, setEditing, formAction, pending, error, cancel } = useEditableRow(
    updateExerciseAction,
    undefined,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const wger = getWgerExercise(exercise.wgerId);

  if (!editing) {
    return (
      <>
        <tr className="border-t border-gray-100">
          <td className="px-4 py-2">
            <div className="font-medium">{exercise.name}</div>
            {/* 右端の操作列が固定表示のため、別の列にすると狭い画面で隠れてしまう。
                種目名の下に置いて常に見えるようにする。 */}
            {wger && (
              <button
                type="button"
                onClick={() => setDetailOpen((open) => !open)}
                aria-expanded={detailOpen}
                className="-ml-1 mt-0.5 rounded px-1 py-1 text-left text-xs text-blue-600 hover:bg-blue-50"
              >
                {detailOpen ? "▾" : "▸"} wger: {wger.name}
              </button>
            )}
          </td>
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
        {detailOpen && exercise.wgerId != null && (
          <tr className="bg-gray-50">
            <td colSpan={3} className="px-4 py-3">
              {/* 表は横スクロールできる幅(min-w-max)のため、そのままだと詳細が表の幅いっぱいに
                  広がり画面の外へはみ出す。横スクロールしても左端に留め、画面幅に収める。 */}
              <div className="sticky left-0 w-[min(calc(100vw-5rem),48rem)]">
                <WgerExercisePanel wgerId={exercise.wgerId} />
              </div>
            </td>
          </tr>
        )}
      </>
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
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">別名(カンマ区切り)</span>
            <input
              name="aliases"
              defaultValue={exercise.aliases.join(", ")}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">wger種目</span>
            <WgerSelect
              defaultValue={exercise.wgerId}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-6">
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
