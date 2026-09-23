"use client";

import { useActionState, useEffect, useRef } from "react";
import { setDailyMemoAction } from "./actions";

// 種目ごとのメモとは別に、その日全体の総括(体調・様子・次回への申し送りなど)を
// 1件だけ記録する(食事記録の「1日の合計を手入力で修正」と同じ、1日1件の特別行)。
export function DailyMemoForm({
  clientId,
  date,
  memo,
}: {
  clientId: string;
  date: string;
  memo: string | null;
}) {
  const [state, formAction, pending] = useActionState(setDailyMemoAction, undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 日付を切り替えたとき、前の日の入力欄の値が残らないようにする
  // (defaultValueはマウント時にしか反映されないため、date変更時に手動で戻す)。
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = memo ?? "";
    }
  }, [date, memo]);

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-lg border border-gray-200 bg-white p-4"
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="recorded_at" value={date} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{date} の総括メモ</span>
        <textarea
          ref={textareaRef}
          name="memo"
          rows={3}
          defaultValue={memo ?? ""}
          placeholder="その日のトレーニング全体の様子・体調・次回への申し送りなど"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="flex items-center gap-2">
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "保存中..." : "メモを保存"}
        </button>
      </div>
    </form>
  );
}
