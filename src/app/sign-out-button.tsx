"use client";

import { supabase } from "@/lib/db/supabase";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => supabase.auth.signOut()}
      className="text-sm text-gray-400 hover:text-gray-900"
    >
      ログアウト
    </button>
  );
}
