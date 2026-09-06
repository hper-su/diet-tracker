"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

// アプリ全体を機内モードでも動かすためのService Worker登録。
// public/sw.js が out/ 内の全ファイルをキャッシュする(scripts/generate-sw-manifest.mjs参照)。
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
      .catch((error) => {
        console.error("Service Workerの登録に失敗しました", error);
      });
  }, []);

  return null;
}
