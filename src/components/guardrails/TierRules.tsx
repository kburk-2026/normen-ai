import SourceTag from "@/components/SourceTag";
import { GUARDRAILS } from "@/content/lifecycle";
import { TIERS, TIER_ADDS, TIER_QUESTIONS } from "@/content/riskTier";
import { TIER_PILL } from "./ProjectGuardrails";

/** How tiering works: the five questions and the guardrails each tier adds. Shared by the Field Guide and the Guardrails page. */
export default function TierRules({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h3" | "h4";
  const title = (id: string) => GUARDRAILS.find((g) => g.id === id)?.title ?? id;
  return (
    <div>
      <H className="flex flex-wrap items-center gap-2 font-display text-xl font-medium">
        Risk tiers <SourceTag source="claude" />
      </H>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Five questions set a project&apos;s tier. Each answer points to a tier, and the project takes the highest one, so a
        single serious answer is enough. The tier decides which guardrails are required; the rest stay recommended. This is
        Claude&apos;s design, not legal advice.
      </p>
      <Sub className="mt-5 text-sm font-medium">The questions</Sub>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
        {TIER_QUESTIONS.map((q) => (
          <li key={q.id}>
            {q.question}
            <span className="block text-xs text-muted">{q.answers.map((a) => `${a.label} (${a.tier})`).join(" · ")}</span>
          </li>
        ))}
      </ol>
      <Sub className="mt-5 text-sm font-medium">What each tier requires</Sub>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {TIERS.map((t, i) => (
          <div key={t} className="rounded-xl bg-surface p-4 text-sm">
            <p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${TIER_PILL[t]}`}>{t}</span>
            </p>
            <p className="mt-2 text-xs text-faint">{i === 0 ? "Every project" : `Everything in ${TIERS[i - 1]}, plus`}</p>
            <ul className="mt-1 space-y-1">
              {TIER_ADDS[t].map((id) => (
                <li key={id}>{title(id)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
