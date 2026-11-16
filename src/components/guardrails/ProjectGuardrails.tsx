"use client";

import { IconChevronRight, IconShieldCheck } from "@tabler/icons-react";
import { ToolsMenu } from "@/components/projects/ProjectTools";
import { GUARDRAILS, GUARDRAIL_LABELS } from "@/content/lifecycle";
import { PHASES } from "@/content/phases";
import { GUARDRAIL_STATUSES, TIER_QUESTIONS, type GuardrailStatus, type Tier } from "@/content/riskTier";
import { useProject } from "@/state/ProjectProvider";
import { coverage, requiredFor, stateOf, tierExplanation } from "@/state/guardrails";

export const TIER_PILL: Record<Tier, string> = {
  Low: "bg-steel-bg text-steel-soft",
  Medium: "bg-tan-bg text-tan-soft",
  High: "bg-orange-bg text-orange-soft",
};
export const GUARD_STATUS_PILL: Record<GuardrailStatus, string> = {
  "To do": "bg-canvas text-muted ring-1 ring-line",
  "In progress": "bg-tan-bg text-tan-soft",
  "In place": "bg-steel-bg text-steel-soft",
  "Not needed": "bg-canvas text-faint ring-1 ring-line",
};

/** A project's risk tier questions and the status of every guardrail. */
export default function ProjectGuardrails() {
  const { project, setTierAnswer, setGuardrailStatus, setGuardrailReason } = useProject();
  const plan = project.guardrails;
  const c = coverage(plan);
  const required = new Set(c.tier ? requiredFor(c.tier) : []);

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {project.name} <IconChevronRight size={14} aria-hidden /> <span className="text-ink">Guardrails</span>
        </p>
        <ToolsMenu />
      </div>
      <h1 className="mt-3 flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconShieldCheck size={26} className="text-orange" aria-hidden /> Guardrails
      </h1>
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Five questions set the project&apos;s risk tier. The tier decides which guardrails it must have; the rest stay
        recommended.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="tier-questions" className="rounded-2xl bg-surface p-5">
          <h2 id="tier-questions" className="font-display text-lg font-medium">
            Risk tier
          </h2>
          <ol className="mt-3 space-y-5">
            {TIER_QUESTIONS.map((q, qi) => (
              <li key={q.id}>
                <fieldset>
                  <legend className="text-sm font-medium">
                    <span className="mr-1.5 font-mono text-xs text-faint">{qi + 1}</span>
                    {q.question}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.answers.map((a, ai) => {
                      const on = plan.answers[q.id] === ai;
                      return (
                        <label
                          key={a.label}
                          className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 focus-within:outline focus-within:outline-2 focus-within:outline-orange ${
                            on ? "bg-orange-bg text-ink ring-orange" : "text-muted ring-line hover:text-ink"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`tier-${q.id}`}
                            className="sr-only"
                            checked={on}
                            onChange={() => setTierAnswer(q.id, ai)}
                          />
                          {a.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="Tier and coverage" className="self-start rounded-2xl bg-surface p-5 lg:sticky lg:top-20">
          <p className="text-xs uppercase tracking-wide text-faint">This project&apos;s tier</p>
          {c.tier ? (
            <>
              <p className="mt-2">
                <span className={`rounded-full px-3 py-1 font-display text-2xl font-medium ${TIER_PILL[c.tier]}`}>{c.tier}</span>
              </p>
              <p className="mt-3 text-sm text-muted">
                {tierExplanation(plan)}. The tier is the highest any answer reaches, so one serious answer is enough.
              </p>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm">
                  <span className="font-display text-2xl font-medium">{c.inPlace}</span>
                  <span className="text-muted"> of {c.required} required guardrails in place</span>
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"
                  role="progressbar"
                  aria-label="Required guardrails in place"
                  aria-valuemin={0}
                  aria-valuemax={c.required}
                  aria-valuenow={c.inPlace}
                >
                  <div className="h-full rounded-full bg-steel-soft" style={{ width: `${(c.inPlace / (c.required || 1)) * 100}%` }} />
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Not set yet: {c.answered} of {TIER_QUESTIONS.length} questions answered. Until all five are, every guardrail is
              recommended.
            </p>
          )}
          <p className="mt-3 text-xs text-faint">
            Low requires {requiredFor("Low").length} guardrails, Medium {requiredFor("Medium").length}, High all{" "}
            {requiredFor("High").length}.
          </p>
          <p className="mt-3 text-xs text-faint">
            The questions and tiers are Claude&apos;s design, not legal advice. Check the tier with your legal or compliance team.
          </p>
        </aside>
      </div>

      <h2 className="mt-10 font-display text-xl font-medium">Guardrails by phase</h2>
      <div className="mt-4 space-y-4">
        {PHASES.map((phase) => (
          <section key={phase.id} aria-labelledby={`gr-${phase.id}`} className={`rounded-2xl border-l-4 bg-surface p-4 ${phase.strip}`}>
            <h3 id={`gr-${phase.id}`} className="font-display text-base font-medium">
              <span className="mr-2 font-mono text-xs text-faint">0{phase.number}</span>
              {phase.name}
            </h3>
            <ul className="mt-2">
              {GUARDRAILS.filter((g) => g.phase === phase.id).map((g) => {
                const st = stateOf(plan, g.id);
                const req = required.has(g.id);
                return (
                  <li key={g.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-line py-3 text-sm first:border-t-0">
                    <div className="min-w-[16rem] flex-1">
                      <p className="font-medium">
                        {g.title}
                        <span className="ml-2 rounded-full bg-steel-bg px-2 py-0.5 text-[11px] font-normal text-steel-soft">
                          {GUARDRAIL_LABELS[g.category]}
                        </span>
                      </p>
                      <p className="text-xs text-muted">{g.detail}</p>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${
                        req ? "bg-orange-bg text-orange-soft" : "text-faint ring-1 ring-line"
                      }`}
                    >
                      {req ? `Required at ${c.tier}` : "Recommended"}
                    </span>
                    <select
                      aria-label={`Status of ${g.title}`}
                      value={st.status}
                      onChange={(e) => setGuardrailStatus(g.id, e.target.value as GuardrailStatus)}
                      className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange ${GUARD_STATUS_PILL[st.status]}`}
                    >
                      {GUARDRAIL_STATUSES.map((o) => (
                        <option key={o} className="bg-canvas text-ink">
                          {o}
                        </option>
                      ))}
                    </select>
                    {st.status === "Not needed" && (
                      <label className="block basis-full">
                        <span className="text-xs text-muted">
                          Why it is not needed{req ? " (it is required at this tier)" : ""}
                        </span>
                        <input
                          value={st.reason}
                          onChange={(e) => setGuardrailReason(g.id, e.target.value)}
                          placeholder="For example: no personal data is stored"
                          className="mt-1 block w-full rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm placeholder:text-faint focus:border-orange focus:outline-none"
                        />
                        {req && !st.reason.trim() && (
                          <span className="mt-1 block text-xs text-tan-soft">A required guardrail marked Not needed should say why.</span>
                        )}
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
