import Link from "next/link";
import type { IconComponent } from "@/content/types";
import Mascot from "./Mascot";

export default function ComingSoon({
  title,
  icon: Icon,
  description,
  milestone,
}: {
  title: string;
  icon: IconComponent;
  description: string;
  milestone: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="flex items-center gap-3 font-display text-3xl font-medium tracking-tight">
        <Icon size={28} stroke={1.75} className="text-orange" aria-hidden />
        {title}
      </h1>
      <p className="mt-3 max-w-xl leading-relaxed text-muted">{description}</p>

      <div className="mt-10 flex max-w-xl items-start gap-4 rounded-2xl border border-dashed border-line p-5">
        <Mascot mood="think" size={48} />
        <div>
          <p className="text-sm">Norm is still building this one.</p>
          <p className="mt-1 font-mono text-xs text-faint">Arrives in {milestone}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-orange hover:text-orange-soft">
            Back to Overview
          </Link>
        </div>
      </div>
    </section>
  );
}
