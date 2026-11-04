"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/content/nav";
import Wordmark from "./Wordmark";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-orange focus:px-3 focus:py-1 focus:text-orange-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/" aria-label="Normen AI home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="flex flex-1 gap-1 overflow-x-auto text-sm">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-surface text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={16} stroke={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/fit-check"
          className="hidden shrink-0 rounded-full bg-orange px-4 py-1.5 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft sm:inline-flex"
        >
          Run a Fit Check
        </Link>
      </div>
    </header>
  );
}
