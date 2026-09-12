// このアプリは常時オンライン(共有データベースに毎回アクセスする)前提のため、
// オフラインキャッシュは行わない。Service Workerはホーム画面へのインストール
// (PWA化)のためだけに登録している。
//
// install/activateでは、過去バージョン(オフラインキャッシュ機能があった頃)の
// キャッシュが端末に残っていれば削除し、常にネットワークから最新を取得する
// 状態に揃える。fetchイベントは何もハンドルしない(ブラウザ標準の通信に任せる)。

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});
