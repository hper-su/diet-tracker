"use client";

import { useActionState, useState } from "react";
import { updateClientProfileAction } from "./profile-actions";
import type { Client } from "@/lib/db/clients";
import {
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_SOURCE,
  DEFAULT_ACTIVITY_LEVEL,
  type ActivityLevel,
} from "@/lib/health/activity-level";
import {
  PFC_PRESETS,
  DEFAULT_PFC_PRESET,
  type PFCPreset,
} from "@/lib/health/pfc-preset";

export function ProfileForm({ client }: { client: Client }) {
  const [state, formAction, pending] = useActionState(
    updateClientProfileAction,
    undefined,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    client.activityLevel ?? DEFAULT_ACTIVITY_LEVEL,
  );
  const [pfcPreset, setPfcPreset] = useState<PFCPreset>(
    client.pfcPreset ?? DEFAULT_PFC_PRESET,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">プロフィール</h2>
      <input type="hidden" name="client_id" value={client.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">お名前</span>
          <input
            name="name"
            required
            defaultValue={client.name}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">生年月日</span>
          <input
            name="birthdate"
            type="date"
            defaultValue={client.birthdate ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">身長(cm)</span>
          <input
            name="height_cm"
            type="number"
            step="0.1"
            min="0"
            placeholder="例: 170.0"
            defaultValue={client.heightCm ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">性別</span>
          <select
            name="gender"
            defaultValue={client.gender ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">選択してください</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">活動レベル</span>
          <select
            name="activity_level"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.entries(ACTIVITY_LEVELS).map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}(×{info.factor})
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">
            {ACTIVITY_LEVELS[activityLevel].description}
          </span>
          <span className="mt-1 block text-[10px] text-gray-400">
            {ACTIVITY_LEVEL_SOURCE}
          </span>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">
            理想のPFCバランス
          </span>
          <select
            name="pfc_preset"
            value={pfcPreset}
            onChange={(e) => setPfcPreset(e.target.value as PFCPreset)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.entries(PFC_PRESETS).map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}(P{Math.round(info.proteinRatio * 100)}%・F
                {Math.round(info.fatRatio * 100)}%・C
                {Math.round(info.carbRatio * 100)}%)
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">
            {PFC_PRESETS[pfcPreset].description}
          </span>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">メモ(任意)</span>
          <input
            name="memo"
            defaultValue={client.memo ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {!pending && state?.success && (
        <p className="text-sm text-green-600">保存しました。</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
