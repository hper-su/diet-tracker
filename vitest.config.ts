import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // scripts/lib/**/*.test.mjs: add-meal-log.mjs等のCLIツールから
    // 切り出した、Firestore通信を伴わない純粋な検証ロジックのテスト。
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    env: {
      // import-export.test.ts はFirestoreへの通信を伴わない純粋関数だけを
      // テストするが、モジュール読み込み時にFirebaseアプリを初期化する
      // ため、テスト環境でもダミー値を与えて読み込みエラーを防ぐ。
      NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "example",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "example.firebasestorage.app",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:0000000000000000000000",
    },
  },
});
