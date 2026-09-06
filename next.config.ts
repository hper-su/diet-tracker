import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // GitHub Pagesなど拡張子なしのパスに弱い静的ホスティングでも
  // /clients/index.html のようにフォルダ+index.htmlで解決できるようにする。
  trailingSlash: true,
};

export default nextConfig;
