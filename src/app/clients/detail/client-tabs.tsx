"use client";

import Link from "next/link";

export function ClientTabs({
  id,
  active,
}: {
  id: number;
  active: "profile" | "plan" | "meals";
}) {
  const tabs = [
    { key: "profile", href: `/clients/detail?id=${id}`, label: "概要" },
    { key: "plan", href: `/clients/detail/plan?id=${id}`, label: "プラン" },
    { key: "meals", href: `/clients/detail/meals?id=${id}`, label: "食事記録" },
  ] as const;

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-block text-sm text-gray-500 hover:text-gray-900"
      >
        ← お客様一覧に戻る
      </Link>
      <nav className="flex gap-4 border-b border-gray-200 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={
              tab.key === active
                ? "border-b-2 border-gray-900 px-1 pb-2 text-gray-900"
                : "border-b-2 border-transparent px-1 pb-2 text-gray-500 hover:border-gray-300 hover:text-gray-900"
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
