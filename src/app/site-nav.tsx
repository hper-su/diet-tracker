"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const NAV_LINKS = [
  { href: "/clients", label: "お客様" },
  { href: "/foods", label: "食品マスタ" },
  { href: "/exercises", label: "種目マスタ" },
  { href: "/body-composition", label: "体組成ガイド" },
  { href: "/anatomy", label: "筋肉・骨" },
  { href: "/conditions", label: "疾患" },
  { href: "/nutrition-guidance", label: "食事指導" },
  { href: "/diet-plateau", label: "停滞期ガイド" },
  { href: "/menstrual-cycle", label: "生理" },
  { href: "/course-pricing", label: "料金" },
  { href: "/hip-care", label: "股関節" },
  { href: "/complete-nutrition", label: "完全栄養素" },
  { href: "/vitamin-mineral-guide", label: "栄養素ガイド" },
  { href: "/data", label: "データ管理" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 画面遷移したらモバイルメニューを閉じる(effect内のsetStateを避け、
  // 描画中にpathnameの変化を検知して閉じる)。
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-x-4 px-6 py-4">
        <Link href="/" className="whitespace-nowrap font-semibold">
          食事・体組成管理
        </Link>
        <nav className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <SignOutButton />
          <button
            type="button"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center text-gray-600 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-gray-200 px-6 py-3 text-sm text-gray-600 sm:hidden">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-1">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
