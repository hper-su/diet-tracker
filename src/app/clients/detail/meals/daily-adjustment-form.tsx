"use client";

import { useActionState, useState } from "react";
import { setDailyAdjustmentAction, type DailyAdjustmentState } from "./actions";

type Amounts = { kcal: number; proteinG: number; fatG: number; carbG: number };

const FIELDS = [
  { name: "kcal", label: "カロリー(kcal)", key: "kcal" },
  { name: "protein_g", label: "たんぱく質(g)", key: "proteinG" },
  { name: "fat_g", label: "脂質(g)", key: "fatG" },
  { name: "carb_g", label: "炭水化物(g)", key: "carbG" },
] as const;

const MODES = [
  ["total", "合計を指定"],
  ["delta", "増減を入力(−可)"],
] as const;

// その日の合計を手入力で修正する。品目は変えず、差分を「手入力調整」行として保存する。
export function DailyAdjustmentForm({
  clientId,
  date,
  totals,
  adjustment,
}: {
  clientId: string;
  date: string;
  totals: Amounts;
  adjustment: Amounts | null;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"total" | "delta">("total");
  const [state, formAction, pending] = useActionState(
    async (prev: DailyAdjustmentState, formData: FormData) => {
      const result = await setDailyAdjustmentAction(prev, formData);
      if (!result?.error) setOpen(false);
      return result;
    },
    undefined,
  );

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50"
        >
          1日の合計を手入力で修正
        </button>
        {adjustment && (
          <span className="text-xs text-gray-500">
            手入力調整あり: {signed(adjustment.kcal)}kcal / P{signed(adjustment.proteinG)} / F
            {signed(adjustment.fatG)} / C{signed(adjustment.carbG)}
          </span>
        )}
      </div>
    );
  }

  // 合計・モードが変わったら入力欄を初期化し直す(defaultValueを反映させるため)。
  const formKey = `${mode}-${totals.kcal}-${totals.proteinG}-${totals.fatG}-${totals.carbG}`;

  return (
    <form
      key={formKey}
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="recorded_at" value={date} />
      <input type="hidden" name="mode" value={mode} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">{date} の合計を手入力で修正</h2>
        <div className="flex gap-2 text-xs">
          {MODES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded border px-2 py-1 ${
                mode === value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {mode === "total"
          ? "その日の最終的な合計を入力します。品目との差分が「手入力調整」として保存されます。"
          : "現在の合計に足す(または引く)量を入力します。例: -100 で100減らす。空欄は変更なし。"}
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        {FIELDS.map((f) => (
          <label key={f.name} className="block text-xs">
            <span className="mb-1 block text-gray-500">{f.label}</span>
            <input
              name={f.name}
              type="number"
              inputMode="decimal"
              step="any"
              defaultValue={mode === "total" ? Math.round(totals[f.key] * 10) / 10 : ""}
              placeholder={mode === "delta" ? "0" : undefined}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        <button
          type="submit"
          name="intent"
          value="clear"
          disabled={pending || !adjustment}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          調整を解除
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r > 0 ? `+${r}` : `${r}`;
}
