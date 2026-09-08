import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { AuthGate } from "./auth-gate";
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
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

const NAV_LINKS = [
  { href: "/clients", label: "お客様" },
  { href: "/foods", label: "食品マスタ" },
  { href: "/gi-foods", label: "GI食品" },
  { href: "/body-composition", label: "体組成ガイド" },
  { href: "/nutrition-guidance", label: "食事指導" },
  { href: "/data", label: "データ管理" },
];

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
            <header className="border-b border-gray-200 bg-white">
              <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
                <Link href="/" className="font-semibold">
                  食事・体組成管理
                </Link>
                <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
            <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
