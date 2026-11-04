import { IconBook } from "@tabler/icons-react";
import SourceTag from "@/components/SourceTag";
import { PHASES, STAGES, type StageId } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS, GUARDRAILS, GUARDRAIL_LABELS, SCORECARD } from "@/content/lifecycle";

export const metadata = { title: "Field Guide · Normen AI" };

/** Short descriptions of the course's four stages, written by Claude. */
const STAGE_NOTES: Record<StageId, string> = {
  ideation: "Find the problem, decide whether AI fits, and set what success looks like.",
  data: "Find, clean and label the data the model will learn from.",
  rnd: "Experiment with models, test them, and prove they work in practice.",
  deployment: "Release the model, run it, watch it, and eventually retire it.",
};

const ADDITIONS = [
  ["Governance", "Policy and compliance checks before work starts, and a record of every override."],
  ["Bias testing", "Error rates compared across the groups that matter, in Develop and again after launch."],
  ["Human review", "Named points where a person approves outputs, plus an off switch and an incident process."],
  ["Evaluation metrics", "The Scorecard: a baseline, agreed targets, and example thresholds for each phase."],
  ["Post-launch monitoring", "Drift, flagged outputs and incidents tracked with an owner for each alert."],
];

const H4 = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mt-6 text-xs font-medium uppercase tracking-wide text-faint">{children}</h4>
);

export default function Page() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[190px_1fr]">
      <nav aria-label="Field Guide contents" className="text-sm md:sticky md:top-24 md:self-start">
        <p className="font-mono text-xs text-faint">Contents</p>
        <ul className="mt-2 space-y-1.5 text-muted">
          <li><a href="#how-to-read" className="hover:text-ink">How to read this</a></li>
          <li><a href="#stages" className="hover:text-ink">The four AI stages</a></li>
          {PHASES.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className="hover:text-ink">
                0{p.number} {p.name}
              </a>
            </li>
          ))}
          <li><a href="#additions" className="hover:text-ink">What Claude added, and why</a></li>
        </ul>
      </nav>

      <div className="min-w-0">
        <h1 className="flex items-center gap-3 font-display text-3xl font-medium tracking-tight">
          <IconBook size={28} stroke={1.75} className="text-orange" aria-hidden /> Field Guide
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          The method behind Normen: seven lifecycle phases, the four AI stages they draw on, and what each phase asks of
          you.
        </p>

        <section id="how-to-read" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl font-medium">How to read this</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li className="flex flex-wrap items-center gap-2">
              <SourceTag source="course" /> restates the course material on AI product development stages and the
              product lifecycle.
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <SourceTag source="claude" /> is governance Claude added on top: guardrails, bias testing, human review,
              metrics and monitoring.
            </li>
          </ul>
        </section>

        <section id="stages" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl font-medium">The four AI stages</h2>
          <p className="mt-1 text-sm text-muted">Stage names come from the course. The one-line descriptions are Claude&apos;s.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.values(STAGES).map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id} className="rounded-xl bg-surface p-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${s.tag}`}>
                    <Icon size={12} aria-hidden /> {s.label}
                  </span>
                  <p className="mt-2 text-sm text-muted">{STAGE_NOTES[s.id]}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {PHASES.map((phase) => (
          <section
            key={phase.id}
            id={phase.id}
            aria-labelledby={`${phase.id}-title`}
            className={`mt-12 scroll-mt-24 border-l-[3px] pl-5 ${STAGES[phase.stages[0]].strip}`}
          >
            <p className="font-mono text-xs text-faint">Phase 0{phase.number}</p>
            <h2 id={`${phase.id}-title`} className="font-display text-2xl font-medium">
              {phase.name}
            </h2>
            <p className="mt-1 text-muted">{phase.summary}</p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {phase.stages.map((s) => (
                <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${STAGES[s].tag}`}>
                  {STAGES[s].label}
                </span>
              ))}
            </p>

            <H4>Activities</H4>
            <ul className="mt-2 space-y-3">
              {ACTIVITIES.filter((a) => a.phase === phase.id).map((a) => (
                <li key={a.id}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="font-mono text-xs font-normal text-faint">{a.id}</span> {a.title}{" "}
                    <SourceTag source={a.source} />
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{a.detail}</p>
                </li>
              ))}
            </ul>

            <H4>Guardrails</H4>
            <ul className="mt-2 space-y-3">
              {GUARDRAILS.filter((g) => g.phase === phase.id).map((g) => (
                <li key={g.id}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {g.title} <span className="text-xs font-normal text-faint">{GUARDRAIL_LABELS[g.category]}</span>{" "}
                    <SourceTag source={g.source} />
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{g.detail}</p>
                </li>
              ))}
            </ul>

            <H4>Scorecard</H4>
            <ul className="mt-2 space-y-3">
              {SCORECARD.filter((s) => s.phase === phase.id).map((s) => (
                <li key={s.id} className="text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {s.metric} <SourceTag source={s.source} />
                  </p>
                  <p className="mt-0.5 text-muted">
                    {s.measure}. Example target: {s.exampleTarget}.
                  </p>
                </li>
              ))}
            </ul>

            <H4>Checkpoint</H4>
            <ul className="mt-2 space-y-1.5">
              {CHECKPOINTS.filter((c) => c.phase === phase.id).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                  {c.text} <SourceTag source={c.source} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section id="additions" className="mt-12 scroll-mt-24">
          <h2 className="font-display text-xl font-medium">What Claude added, and why</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            The course covers how AI products are built. Shipping one in a workplace also means answering to the people it
            affects. Claude added these five layers to cover that. The{" "}
            <SourceTag source="claude" /> label marks them, along with a few practical activities (such as preparing the
            data or planning a switch-over) that the course summaries do not name. Scorecard targets are examples, not
            recommendations.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {ADDITIONS.map(([term, def]) => (
              <div key={term} className="rounded-xl bg-surface p-4">
                <dt className="text-sm font-medium">{term}</dt>
                <dd className="mt-1 text-sm text-muted">{def}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
}
