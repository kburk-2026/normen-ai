import { IconGitCommit } from "@tabler/icons-react";
import { SHIPPED } from "@/content/shipped";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Shipped · Normen AI" };

export default function Page() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="flex items-center gap-3 font-display text-3xl font-medium tracking-tight">
        <IconGitCommit size={28} stroke={1.75} className="text-orange" aria-hidden /> Shipped
      </h1>
      <p className="mt-3 leading-relaxed text-muted">What changed in Normen AI, and when. Newest first.</p>

      <ol className="mt-8 space-y-6 border-l border-line pl-6">
        {SHIPPED.map((e) => (
          <li key={e.title} className="relative">
            <span aria-hidden className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-orange" />
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <time dateTime={e.date} className="font-mono text-xs text-faint">
                {formatDate(e.date)}
              </time>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">{e.label}</span>
            </p>
            <h2 className="mt-1 font-medium">{e.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{e.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
