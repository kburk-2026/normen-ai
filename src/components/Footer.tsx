import Link from "next/link";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted">
        <Wordmark className="text-base text-ink" />
        <div className="flex gap-5">
          <Link href="/shipped" className="hover:text-ink">
            Shipped
          </Link>
          <Link href="/field-guide" className="hover:text-ink">
            Field Guide
          </Link>
          <a href="https://github.com/kburk-2026/normen-ai" className="hover:text-ink">
            Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
