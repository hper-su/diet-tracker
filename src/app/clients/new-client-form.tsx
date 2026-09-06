"use client";

import { useActionState, useState } from "react";
import { addClientAction, type AddClientState } from "./actions";
import { getBodyAverageForGender } from "@/lib/health/body-averages";

export function NewClientForm() {
  const [state, formAction, pending] = useActionState(
    addClientAction,
    undefined,
  );

  // 送信が成功して pending が true→false に戻ったタイミングでキーを更新し、
  // フォーム全体(ローカルstateを含む)を再マウントして初期状態に戻す。
  const [prevPending, setPrevPending] = useState(pending);
  const [formGeneration, setFormGeneration] = useState(0);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && !state?.error) {
      setFormGeneration((g) => g + 1);
    }
  }

  return (
    <NewClientFormFields
      key={formGeneration}
      formAction={formAction}
      pending={pending}
      state={state}
    />
  );
}

function NewClientFormFields({
  formAction,
  pending,
  state,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: AddClientState;
}) {
  const [height, setHeight] = useState("");
  const [heightTouched, setHeightTouched] = useState(false);

  function handleGenderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const average = getBodyAverageForGender(e.target.value);
    if (!average) return;
    if (!heightTouched) setHeight(String(average.heightCm));
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="font-medium">お客様を新規登録</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">お名前</span>
          <input
            name="name"
            placeholder="お名前"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            生年月日(任意)
          </span>
          <input
            name="birthdate"
            type="date"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">性別(任意)</span>
          <select
            name="gender"
            defaultValue=""
            onChange={handleGenderChange}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">未設定</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            身長(cm・任意)
          </span>
          <input
            name="height_cm"
            type="number"
            step="0.1"
            placeholder="例: 165.0"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              setHeightTouched(true);
            }}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">メモ(任意)</span>
          <input
            name="memo"
            placeholder="メモ(任意)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-gray-400">
        性別を選択すると、身長に成人の平均的な目安値を自動入力します(実測値がわかれば上書きしてください)。
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "登録中..." : "登録"}
      </button>
    </form>
  );
}
