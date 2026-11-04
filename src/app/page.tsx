import Link from "next/link";
import {
  IconArrowRight,
  IconGauge,
  IconHeartbeat,
  IconLayoutKanban,
  IconShieldCheck,
  IconTarget,
} from "@tabler/icons-react";
import Mascot from "@/components/Mascot";
import { PHASES, STAGES } from "@/content/phases";
import type { IconComponent } from "@/content/types";

const FEATURES: { href: string; title: string; blurb: string; icon: IconComponent; tone: string }[] = [
  { href: "/workbench", title: "Workbench", blurb: "List and board views of every phase", icon: IconLayoutKanban, tone: "text-orange" },
  { href: "/guardrails", title: "Guardrails", blurb: "Privacy, bias and human review", icon: IconShieldCheck, tone: "text-steel-soft" },
  { href: "/scorecard", title: "Scorecard", blurb: "Evaluation metrics and targets", icon: IconGauge, tone: "text-tan" },
  { href: "/pulse", title: "Pulse", blurb: "Drift, feedback and incidents", icon: IconHeartbeat, tone: "text-ink" },
];

export default function OverviewPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-16 md:grid-cols-[1.5fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-steel-bg px-3 py-1 text-xs text-steel-soft">
            <IconShieldCheck size={14} stroke={1.75} aria-hidden />
            Guardrails built into every phase
          </span>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            Good AI has norms.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Seven phases, four AI stages, and the governance to get a workplace AI project from idea
            to production.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/workbench"
              className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 font-medium text-orange-ink transition-colors hover:bg-orange-soft"
            >
              Open the Workbench <IconArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/field-guide"
              className="inline-flex items-center rounded-full border border-line px-5 py-2.5 transition-colors hover:bg-surface"
            >
              Read the Field Guide
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl bg-surface p-5">
          <Mascot mood="wave" size={56} />
          <div>
            <p className="leading-relaxed">
              Not every problem needs AI. Answer ten questions and I&apos;ll tell you if yours does.
            </p>
            <Link
              href="/fit-check"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft"
            >
              <IconTarget size={16} aria-hidden /> Run a Fit Check
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="lifecycle" className="mx-auto max-w-6xl px-5">
        <h2 id="lifecycle" className="sr-only">
          The seven-phase lifecycle
        </h2>
        <ol className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            return (
              <li key={phase.id} className={`border-t-[3px] pt-3 ${STAGES[phase.stages[0]].strip}`}>
                <span className="font-mono text-xs text-faint">0{phase.number}</span>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <Icon size={16} stroke={1.75} aria-hidden />
                  {phase.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{phase.summary}</p>
              </li>
            );
          })}
        </ol>
        <ul className="mt-6 flex flex-wrap gap-4 text-xs text-muted" aria-label="AI stage colors">
          {Object.values(STAGES).map((stage) => {
            const Icon = stage.icon;
            return (
              <li key={stage.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${stage.tag}`}>
                <Icon size={12} aria-hidden />
                {stage.label}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="features" className="mx-auto max-w-6xl px-5 pt-16">
        <h2 id="features" className="sr-only">
          What&apos;s inside
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ href, title, blurb, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl bg-surface p-5 transition-colors hover:bg-line"
            >
              <Icon size={24} stroke={1.75} className={tone} aria-hidden />
              <p className="mt-3 font-display text-lg font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted">{blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
