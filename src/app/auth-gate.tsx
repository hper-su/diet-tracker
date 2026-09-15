"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/db/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | "checking">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(false);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(true);
      setPassword("");
    }
    setVerifying(false);
  }

  // 初回マウント時のセッション確認が終わるまでは、サーバー側の描画と
  // 揃えるため何も出さない(ログイン画面/本体のどちらかで確定させない)。
  if (session === "checking") {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-base font-semibold text-gray-900">ログイン</h1>
          <label className="mt-4 block text-xs text-gray-500">
            メールアドレス
            <input
              type="email"
              autoFocus
              required
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(false);
              }}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs text-gray-500">
            パスワード
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          {error && (
            <p className="mt-2 text-xs text-red-600">
              メールアドレスまたはパスワードが違います
            </p>
          )}
          <button
            type="submit"
            disabled={verifying}
            className="mt-4 w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {verifying ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
