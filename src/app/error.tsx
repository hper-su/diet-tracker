"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ブラウザの開発者ツール(F12)のコンソールで詳細を確認できるようにする。
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        エラーが発生しました
      </h1>
      <p className="text-sm text-gray-500">
        予期しない問題が発生しました。時間をおいて再度お試しください。
        <br />
        問題が続く場合は、ブラウザの開発者ツール(F12)のコンソールに表示される内容をご確認ください。
      </p>
      <button
        onClick={reset}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        もう一度試す
      </button>
    </div>
  );
}
