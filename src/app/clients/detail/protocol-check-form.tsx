"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PROTOCOL_CONDITIONS } from "@/lib/conditions";
import { MovementIcon, MOVEMENT_ICON_LABELS } from "@/lib/movement-icons";
import { todayISODate } from "@/lib/date";
import { addProtocolCheckAction } from "./protocol-check-actions";

type StepStatus = "achieved" | "not_achieved" | undefined;

export function ProtocolCheckForm({ clientId }: { clientId: number }) {
  const [state, formAction, pending] = useActionState(
    addProtocolCheckAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [conditionId, setConditionId] = useState<string>("");
  const [stepStatus, setStepStatus] = useState<Record<number, StepStatus>>({});

  const condition = PROTOCOL_CONDITIONS.find((c) => c.id === conditionId);

  useEffect(() => {
    if (!pending && !state?.error && formRef.current) {
      formRef.current.reset();
      setConditionId("");
      setStepStatus({});
    }
  }, [pending, state]);

  function selectCondition(id: string) {
    setConditionId(id);
    setStepStatus({});
  }

  function setStep(index: number, value: StepStatus) {
    setStepStatus((prev) => ({
      ...prev,
      [index]: prev[index] === value ? undefined : value,
    }));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div>
        <h2 className="font-medium">動作チェック</h2>
        <p className="mt-1 text-xs text-gray-500">
          気になる症状を選ぶと、確認すべき動作チェックの手順が表示されます。各ステップを「できた/できなかった」で記録できます。
        </p>
      </div>

      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="condition_id" value={conditionId} />

      <div className="flex flex-wrap gap-2">
        {PROTOCOL_CONDITIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCondition(c.id)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${
              conditionId === c.id
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600"
            }`}
          >
            {c.symptomLabel}
          </button>
        ))}
      </div>

      {condition && (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">日付</span>
            <input
              name="recorded_at"
              type="date"
              required
              defaultValue={todayISODate()}
              className="w-full max-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-2">
            {condition.protocolTable.map((step, index) => {
              const status = stepStatus[index];
              return (
                <div
                  key={step.step}
                  className={`rounded-lg border p-3 ${
                    status === "not_achieved"
                      ? "border-red-200 bg-red-50"
                      : status === "achieved"
                        ? "border-green-200 bg-green-50"
                        : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-2">
                      {step.movements && (
                        <div className="flex shrink-0 gap-1">
                          {step.movements.map((m) => (
                            <div
                              key={m}
                              className="rounded border border-gray-200 bg-white p-0.5"
                              title={MOVEMENT_ICON_LABELS[m]}
                            >
                              <MovementIcon id={m} size={36} />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {step.step}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {step.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStep(index, "achieved")}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          status === "achieved"
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-300 bg-white text-gray-600"
                        }`}
                      >
                        できた
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(index, "not_achieved")}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          status === "not_achieved"
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 bg-white text-gray-600"
                        }`}
                      >
                        できなかった
                      </button>
                    </div>
                  </div>

                  {status === "not_achieved" && (
                    <div className="mt-2 space-y-1 border-t border-red-200 pt-2 text-xs text-red-900">
                      <p>
                        <span className="font-semibold">注意点:</span>
                        {step.ifNotAchieved}
                      </p>
                      <p>
                        <span className="font-semibold">次にやること:</span>
                        {step.next}
                      </p>
                    </div>
                  )}

                  {status && (
                    <input
                      type="hidden"
                      name={`result_${index}`}
                      value={status}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-gray-500">
              メモ(任意)
            </span>
            <input
              name="memo"
              placeholder="メモ(任意)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "記録中..." : "記録する"}
          </button>
        </div>
      )}
    </form>
  );
}
