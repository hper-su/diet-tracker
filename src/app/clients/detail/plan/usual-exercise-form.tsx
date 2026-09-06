"use client";

import { useActionState, useRef, useEffect } from "react";
import { addUsualExerciseAction } from "./usual-exercise-actions";
import {
  ExercisePicker,
  type ExercisePickerHandle,
} from "../exercise-picker";
import type { Exercise } from "@/lib/db/exercises";

export function UsualExerciseForm({
  clientId,
  exercises,
}: {
  clientId: number;
  exercises: Exercise[];
}) {
  const [state, formAction, pending] = useActionState(
    addUsualExerciseAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const exercisePickerRef = useRef<ExercisePickerHandle>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      exercisePickerRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">運動習慣を追加</h2>
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">種目</span>
          <ExercisePicker ref={exercisePickerRef} exercises={exercises} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            1回あたりの時間(分)
          </span>
          <input
            name="duration_min"
            type="number"
            step="1"
            min="1"
            required
            placeholder="例: 30"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            頻度(週あたりの回数)
          </span>
          <input
            name="frequency_per_week"
            type="number"
            step="0.5"
            min="0.5"
            max="14"
            required
            placeholder="例: 3"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "登録中..." : "追加する"}
      </button>
    </form>
  );
}
