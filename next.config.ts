import type { NextConfig } from "next";

// GitHub Pagesのプロジェクトサイトは https://<user>.github.io/<repo>/ という
// サブパス配信になるため、アプリ内の全リンク・アセット参照にこの接頭辞を
// 付ける必要がある(付けないと "/clients" 等が誤ってドメイン直下を指してしまい、
// CSS/JSの読み込み・画面遷移が軒並み404になる)。
// ローカルでの動作確認(npm run dev / npm run serve)はこれまで通りルート直下で
// 行えるよう、デプロイ時(npm run deploy)だけ GITHUB_PAGES=true を付けて切り替える。
export const BASE_PATH = process.env.GITHUB_PAGES === "true" ? "/diet-tracker" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // GitHub Pagesなど拡張子なしのパスに弱い静的ホスティングでも
  // /clients/index.html のようにフォルダ+index.htmlで解決できるようにする。
  trailingSlash: true,
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
