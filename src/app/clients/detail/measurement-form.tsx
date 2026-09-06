"use client";

import { useActionState, useRef, useEffect } from "react";
import { addMeasurementAction } from "./measurement-actions";
import { todayISODate } from "@/lib/date";

export function MeasurementForm({ clientId }: { clientId: number }) {
  const [state, formAction, pending] = useActionState(
    addMeasurementAction,
    undefined,
  );
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
      <h2 className="font-medium">測定値を記録</h2>
      <p className="text-xs text-gray-500">
        体組成計で測れる項目のうち、わかるものだけでも記録できます(1つ以上入力してください)。
      </p>
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">日付</span>
          <input
            name="recorded_at"
            type="date"
            required
            defaultValue={todayISODate()}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">体重(kg)</span>
          <input
            name="weight_kg"
            type="number"
            step="0.1"
            placeholder="例: 65.0"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            体脂肪率(%)
          </span>
          <input
            name="body_fat_pct"
            type="number"
            step="0.1"
            placeholder="例: 20.0"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            筋肉量(kg)
          </span>
          <input
            name="muscle_mass_kg"
            type="number"
            step="0.1"
            placeholder="例: 50.0"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            内臓脂肪レベル
          </span>
          <input
            name="visceral_fat_level"
            type="number"
            step="0.1"
            placeholder="例: 8"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            基礎代謝(kcal)
          </span>
          <input
            name="bmr_kcal"
            type="number"
            step="1"
            placeholder="例: 1500"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-3">
          <span className="mb-1 block text-xs text-gray-500">メモ(任意)</span>
          <input
            name="memo"
            placeholder="メモ(任意)"
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
        {pending ? "登録中..." : "記録する"}
      </button>
    </form>
  );
}
