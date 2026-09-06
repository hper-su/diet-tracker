"use client";

import { useActionState } from "react";
import { updatePlanGoal } from "./actions";

export function PlanGoalForm({
  clientId,
  currentWeightChangeKg,
  currentPeriodMonths,
  currentTargetWeightKg,
}: {
  clientId: number;
  currentWeightChangeKg: number | null;
  currentPeriodMonths: number | null;
  currentTargetWeightKg: number | null;
}) {
  const [state, formAction, pending] = useActionState(
    updatePlanGoal,
    undefined,
  );

  return (
    <form
      key={`${currentWeightChangeKg}-${currentPeriodMonths}-${currentTargetWeightKg}`}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">目標設定</h2>
      <input type="hidden" name="client_id" value={clientId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            目標体重変化(kg)。減量ならマイナス、増量ならプラスで入力
          </span>
          <input
            name="target_weight_change_kg"
            type="number"
            step="0.1"
            defaultValue={currentWeightChangeKg ?? ""}
            placeholder="例: -5.0"
            required
            className="w-full max-w-[10rem] rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">期間(か月)</span>
          <input
            name="target_period_months"
            type="number"
            step="0.5"
            min="0.5"
            defaultValue={currentPeriodMonths ?? 1}
            placeholder="例: 3"
            required
            className="w-full max-w-[8rem] rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            目標体重(kg)・任意
          </span>
          <input
            name="target_weight_kg"
            type="number"
            step="0.1"
            min="0.1"
            defaultValue={currentTargetWeightKg ?? ""}
            placeholder="例: 55.0"
            className="w-full max-w-[10rem] rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-gray-500">
        例: 3か月で5kg減量したい場合は、体重変化に「-5.0」、期間に「3」と入力してください(1か月あたり約-1.67kgのペースで算出します)。
        目標体重を入力すると、「概要」タブの体重推移グラフに目標ラインと到達予測日を表示します。
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "更新中..." : "目標を更新"}
      </button>
    </form>
  );
}
