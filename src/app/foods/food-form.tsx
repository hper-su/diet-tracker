"use client";

import { useActionState, useRef, useEffect } from "react";
import { addFoodAction } from "./actions";

export function FoodForm({ categories }: { categories: string[] }) {
  const [state, formAction, pending] = useActionState(addFoodAction, undefined);
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
      <h2 className="font-medium">食品を登録</h2>
      <p className="text-xs text-gray-500">
        普段食べる量(1人前など)あたりの栄養価で登録しておくと、食事記録時に選ぶだけで済みます。
      </p>
      <div className="grid gap-3 sm:grid-cols-6">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">分類(任意)</span>
          <input
            name="category"
            list="food-category-options"
            placeholder="例: アルコール飲料類"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <datalist id="food-category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">食品名</span>
          <input
            name="name"
            required
            placeholder="例: 鶏むね肉(皮なし)200g"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            一人前の目安量
          </span>
          <input
            name="serving_label"
            placeholder="例: 1人前(150g)"
            defaultValue="1人前"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            カロリー(kcal)
          </span>
          <input
            name="kcal"
            type="number"
            step="0.1"
            min="0"
            required
            placeholder="例: 230"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            たんぱく質(g)
          </span>
          <input
            name="protein_g"
            type="number"
            step="0.1"
            min="0"
            placeholder="例: 45"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">脂質(g)</span>
          <input
            name="fat_g"
            type="number"
            step="0.1"
            min="0"
            placeholder="例: 2"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            炭水化物(g)
          </span>
          <input
            name="carb_g"
            type="number"
            step="0.1"
            min="0"
            placeholder="例: 0"
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
