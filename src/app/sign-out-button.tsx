"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/db/firebase";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut(auth)}
      className="text-sm text-gray-400 hover:text-gray-900"
    >
      ログアウト
    </button>
  );
}
