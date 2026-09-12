"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

// ホーム画面へのインストール(PWA化)のためのService Worker登録。
// このアプリは常時オンライン前提のため、public/sw.js はオフラインキャッシュを
// 行わない(過去にキャッシュされたものが残っていれば削除するだけ)。
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // 開発時(next dev)はsw-precache-manifest.jsonが存在せず登録しても
      // 意味がない上、以前npm run serveで同じoriginに登録された古いService
      // Workerが残っていると、キャッシュ優先の挙動でdevサーバーの最新の変更が
      // ブラウザに反映されなくなる。そのため開発時は既存の登録を解除する。
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
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
