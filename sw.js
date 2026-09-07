// オフライン動作の要。install時にsw-precache-manifest.json(scripts/generate-sw-manifest.mjs
// が next build 後に生成)に列挙された全URLを取得してキャッシュし、以後は
// ネットワークが無くてもキャッシュから応答する。

// 相対パスにすることで、GitHub Pagesのようにサブパス(/diet-tracker/等)配信の場合でも
// sw.js自身が置かれている場所(=basePath直下)を基準に正しく解決される。
const MANIFEST_URL = "./sw-precache-manifest.json";

async function precache() {
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  const { buildId, urls } = await res.json();
  const cacheName = `diet-tracker-${buildId}`;
  const cache = await caches.open(cacheName);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.error(`precache failed: ${url}`, error);
      }
    }),
  );

  return cacheName;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch(MANIFEST_URL, { cache: "no-store" }).catch(() => null);
      const currentCacheName = res ? `diet-tracker-${(await res.json()).buildId}` : null;

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("diet-tracker-") && name !== currentCacheName)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;

      try {
        return await fetch(event.request);
      } catch (error) {
        // オフラインでキャッシュにも無い場合(未訪問の外部リソース等)は、
        // ナビゲーション要求ならアプリの入口だけは返す。
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("./clients/");
          if (fallback) return fallback;
        }
        throw error;
      }
    })(),
  );
});

// build: mtrvektb
