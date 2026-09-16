import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { AuthGate } from "./auth-gate";
import { SiteNav } from "./site-nav";
import { BASE_PATH } from "@/lib/base-path";

// next/metadataの manifest/icons は <Link> と違い basePath が自動で付与されない
// ため、ここだけ手動で BASE_PATH を付ける。
export const metadata: Metadata = {
  title: "食事・体組成管理",
  description: "お客様ごとの食事記録・ダイエット/増量プラン管理アプリ",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: [{ url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  // GitHub Pagesのプロジェクトサイト(/diet-tracker/配下)は robots.txt が
  // オリジンのルート(hper-su.github.io/robots.txt)にしか効かず、このリポジトリ
  // からは配置できないため、各ページのmetaタグで直接クロール拒否する。
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ServiceWorkerRegister />
        <AuthGate>
          <div className="flex flex-1 flex-col">
            <SiteNav />
            <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
