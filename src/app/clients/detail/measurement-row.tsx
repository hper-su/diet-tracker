"use client";

import { useActionState, useState } from "react";
import type { Measurement } from "@/lib/db/measurements";
import { calculateBMI } from "@/lib/health/bmi";
import {
  updateMeasurementAction,
  deleteMeasurementAction,
} from "./measurement-actions";

export function MeasurementRow({
  measurement,
  clientId,
  heightCm,
}: {
  measurement: Measurement;
  clientId: number;
  heightCm: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMeasurementAction,
    undefined,
  );
  // キャンセル後に編集欄を開き直したとき、前回送信時のエラーが
  // (再送信していないのに)表示され続けないようにするためのフラグ。
  const [errorDismissed, setErrorDismissed] = useState(false);

  // 保存が成功したら(pendingがtrue->falseに変わり、エラーが無ければ)編集欄を閉じる。
  // pendingがfalse->trueに変わるとき(=新規送信開始)は、古いエラーの表示を解除する。
  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (pending) {
      setErrorDismissed(false);
    } else if (!state?.error) {
      setEditing(false);
    }
  }

  const bmi =
    heightCm != null && measurement.weightKg != null
      ? calculateBMI({ weightKg: measurement.weightKg, heightCm })
      : null;

  if (!editing) {
    return (
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2 whitespace-nowrap">{measurement.recordedAt}</td>
        <td className="px-4 py-2">{measurement.weightKg ?? "-"}</td>
        <td className="px-4 py-2">{bmi ?? "-"}</td>
        <td className="px-4 py-2">{measurement.bodyFatPct ?? "-"}</td>
        <td className="px-4 py-2">{measurement.muscleMassKg ?? "-"}</td>
        <td className="px-4 py-2">{measurement.visceralFatLevel ?? "-"}</td>
        <td className="px-4 py-2">{measurement.bmrKcal ?? "-"}</td>
        <td className="px-4 py-2 text-gray-500">{measurement.memo ?? ""}</td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-gray-900"
          >
            編集
          </button>
          <form action={deleteMeasurementAction} className="inline">
            <input type="hidden" name="id" value={measurement.id} />
            <input type="hidden" name="client_id" value={clientId} />
            <button
              type="submit"
              className="ml-3 text-xs text-gray-400 hover:text-red-600"
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
      <td colSpan={9} className="px-4 py-3">
        <form action={formAction} className="grid gap-2 sm:grid-cols-8">
          <input type="hidden" name="id" value={measurement.id} />
          <input type="hidden" name="client_id" value={clientId} />
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">日付</span>
            <input
              name="recorded_at"
              type="date"
              required
              defaultValue={measurement.recordedAt}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">体重(kg)</span>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              defaultValue={measurement.weightKg ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">体脂肪率(%)</span>
            <input
              name="body_fat_pct"
              type="number"
              step="0.1"
              defaultValue={measurement.bodyFatPct ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">筋肉量(kg)</span>
            <input
              name="muscle_mass_kg"
              type="number"
              step="0.1"
              defaultValue={measurement.muscleMassKg ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">内臓脂肪レベル</span>
            <input
              name="visceral_fat_level"
              type="number"
              step="0.1"
              defaultValue={measurement.visceralFatLevel ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-gray-500">基礎代謝(kcal)</span>
            <input
              name="bmr_kcal"
              type="number"
              step="1"
              defaultValue={measurement.bmrKcal ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-gray-500">メモ</span>
            <input
              name="memo"
              defaultValue={measurement.memo ?? ""}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-8">
            {state?.error && !errorDismissed && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
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
              onClick={() => {
                setEditing(false);
                setErrorDismissed(true);
              }}
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
