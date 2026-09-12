import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      // import-export.test.ts はSupabaseへの通信を伴わない純粋関数だけを
      // テストするが、モジュール読み込み時にsupabaseクライアントを生成する
      // ため、テスト環境でもダミー値を与えて読み込みエラーを防ぐ。
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
