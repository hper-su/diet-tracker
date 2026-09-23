"use client";

import { useActionState, useRef, useEffect } from "react";
import { addExerciseAction } from "./actions";

export function ExerciseForm() {
  const [state, formAction, pending] = useActionState(addExerciseAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">種目を登録</h2>
      <p className="text-xs text-gray-500">
        略語や表記ゆれを別名として登録しておくと、筋トレ記録での検索時に見つけやすくなります。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">種目名</span>
          <input
            name="name"
            required
            placeholder="例: ラットプルダウン"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            別名(任意・カンマ区切り)
          </span>
          <input
            name="aliases"
            placeholder="例: ラット"
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
        {pending ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
