"use client";

import { useEffect, useState } from "react";
import { verifyPassword, AUTH_STORAGE_KEY } from "@/lib/auth/site-lock";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">(
    "checking",
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setStatus(
      localStorage.getItem(AUTH_STORAGE_KEY) === "1" ? "unlocked" : "locked",
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    const ok = await verifyPassword(input);
    setVerifying(false);
    if (ok) {
      localStorage.setItem(AUTH_STORAGE_KEY, "1");
      setStatus("unlocked");
    } else {
      setError(true);
      setInput("");
    }
  }

  // 初回マウント時のlocalStorage確認が終わるまでは、サーバー側の描画と
  // 揃えるため何も出さない(ロック画面/本体のどちらかで確定させない)。
  if (status === "checking") {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (status === "locked") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-base font-semibold text-gray-900">
            パスワードを入力してください
          </h1>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {error && (
            <p className="mt-2 text-xs text-red-600">パスワードが違います</p>
          )}
          <button
            type="submit"
            disabled={verifying || input.length === 0}
            className="mt-4 w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            開く
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
