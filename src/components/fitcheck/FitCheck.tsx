"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconArrowRight, IconCircleCheck, IconRefresh, IconTarget } from "@tabler/icons-react";
import Mascot from "@/components/Mascot";
import { FIT_BANDS, FIT_QUESTIONS, scoreFit, type FitBand } from "@/content/fitCheck";
import { formatDate, today } from "@/lib/format";
import { useWorkspace } from "@/state/ProjectProvider";

/** Smooth scrolling, unless the user's system asks for less motion. */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const MOOD: Record<FitBand, "cheer" | "think" | "alert"> = { good: "cheer", simpler: "think", no: "alert" };
const TONE: Record<FitBand, string> = { good: "text-orange", simpler: "text-steel-soft", no: "text-tan" };

export default function FitCheck() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const result = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const answered = Object.keys(answers).length;
  const complete = answered === FIT_QUESTIONS.length;

  // Bring the result into view the moment the last question is answered.
  const wasComplete = useRef(false);
  useEffect(() => {
    if (complete && !wasComplete.current) result.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    wasComplete.current = complete;
  }, [complete]);

  const startOver = () => {
    setAnswers({});
    top.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  };

  return (
    <div ref={top} className="mx-auto max-w-2xl scroll-mt-24">
      <div className="flex items-start gap-4 rounded-2xl bg-surface p-5">
        <Mascot mood="wave" size={52} />
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
            <IconTarget size={28} stroke={1.75} className="text-orange" aria-hidden /> Fit Check
          </h1>
          <p className="mt-1 text-muted">
            Not every problem needs AI. Answer ten questions about yours and I&apos;ll tell you if it does.
          </p>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-faint" aria-live="polite">
        {answered} of {FIT_QUESTIONS.length} answered
      </p>

      <ol className="mt-3 space-y-3">
        {FIT_QUESTIONS.map((q, qi) => (
          <li key={q.id}>
            <fieldset className="rounded-2xl bg-surface p-5">
              <legend className="sr-only">{q.question}</legend>
              <p className="font-mono text-xs text-faint" aria-hidden>
                {String(qi + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-medium" aria-hidden>
                {q.question}
              </p>
              <p className="mt-1 text-sm text-muted">{q.hint}</p>
              <div className="mt-3 flex flex-col gap-2">
                {q.answers.map((a, ai) => {
                  const picked = answers[q.id] === ai;
                  return (
                    <label
                      key={a.label}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-orange ${
                        picked ? "border-orange bg-orange-bg" : "border-line hover:border-faint"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        className="sr-only"
                        checked={picked}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: ai }))}
                      />
                      <span
                        aria-hidden
                        className={`h-4 w-4 shrink-0 rounded-full border-2 ${picked ? "border-orange bg-orange" : "border-faint"}`}
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

      <div ref={result} className="mt-8 scroll-mt-24">
        {complete ? (
          <Result answers={answers} onStartOver={startOver} />
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
            Your result appears here once all ten questions are answered.
          </p>
        )}
      </div>
    </div>
  );
}

function Result({ answers, onStartOver }: { answers: Record<string, number>; onStartOver: () => void }) {
  const r = scoreFit(answers);
  const band = FIT_BANDS[r.band];

  return (
    <section aria-labelledby="fit-result" className="rounded-2xl bg-surface p-6" role="status">
      <div className="flex items-start gap-4">
        <Mascot mood={MOOD[r.band]} size={64} />
        <div>
          <p className={`font-display text-5xl font-medium ${TONE[r.band]}`}>
            {r.score}
            <span className="text-xl text-faint">/100</span>
          </p>
          <h2 id="fit-result" className="mt-1 font-display text-xl font-medium">
            {band.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {r.capped ? "The cost of a mistake rules AI out here, even though the score is " + r.score + "." : band.body}
          </p>
        </div>
      </div>

      <div className="mt-5" aria-hidden>
        <div className="relative h-2 rounded-full bg-canvas">
          <div className="absolute inset-y-0 left-0 w-[40%] rounded-l-full bg-tan/40" />
          <div className="absolute inset-y-0 left-[40%] w-[30%] bg-steel/40" />
          <div className="absolute inset-y-0 left-[70%] w-[30%] rounded-r-full bg-orange/40" />
          <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded bg-ink" style={{ left: `${r.score}%` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-faint">
          <span>0 not AI</span>
          <span>40 simpler first</span>
          <span>70 good fit</span>
        </div>
      </div>

      {/* When the cap applies, its reason leads so it is not buried under the strengths. */}
      {(r.capped ? ["watch", "favor"] : ["favor", "watch"]).map((kind) =>
        kind === "favor" ? (
          <ResultList key={kind} title="In its favor" items={r.strengths} tone="favor" />
        ) : (
          <ResultList key={kind} title="Watch out" items={r.watchOuts} tone="watch" />
        ),
      )}

      <SaveResult key={JSON.stringify(answers)} score={r.score} band={r.band} capped={r.capped} />

      <div className="mt-6 flex flex-wrap gap-3">
        {r.band === "good" && (
          <Link
            href="/workbench"
            className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft"
          >
            Open the Project Console <IconArrowRight size={16} aria-hidden />
          </Link>
        )}
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:bg-canvas"
        >
          <IconRefresh size={16} aria-hidden /> Start over
        </button>
      </div>
    </section>
  );
}

/**
 * Save the result to a project, where it shows as evidence on the Conceive
 * checkpoint. Arriving from a project's Tools menu (?project=ID) skips the picker.
 */
function SaveResult({ score, band, capped }: { score: number; band: FitBand; capped: boolean }) {
  const { loaded, projects, saveFitCheck } = useWorkspace();
  // Read ?project= straight from the address. This component only ever renders in the browser
  // (after the last answer), and useSearchParams would force a Suspense boundary around the whole
  // page, which left a hidden second copy of the form in the document.
  const [asked] = useState(() => (typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("project") ?? "")));
  const preset = projects.find((p) => p.id === asked);
  const [chosen, setChosen] = useState("");
  const [savedTo, setSavedTo] = useState<{ id: string; name: string }>();
  const selectId = useId();

  if (!loaded) return null;
  if (projects.length === 0)
    return (
      <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
        To keep this result, create a project in the{" "}
        <Link href="/workbench" className="text-orange hover:text-orange-soft">
          Project Console
        </Link>{" "}
        and run the Fit Check from its Tools menu.
      </p>
    );

  const target = preset ?? projects.find((p) => p.id === chosen) ?? projects[0];
  const save = () => {
    saveFitCheck(target.id, { score, band, capped, at: today() });
    setSavedTo({ id: target.id, name: target.name });
  };

  return (
    <div className="mt-6 border-t border-line pt-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        {preset ? (
          <span className="text-muted">
            For <span className="text-ink">{preset.name}</span>
          </span>
        ) : (
          <>
            <label htmlFor={selectId} className="text-muted">
              Save to
            </label>
            <select
              id={selectId}
              value={target.id}
              onChange={(e) => {
                setChosen(e.target.value);
                setSavedTo(undefined);
              }}
              className="max-w-full rounded-full bg-canvas px-3 py-1.5 text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          type="button"
          onClick={save}
          disabled={savedTo?.id === target.id}
          className="rounded-full bg-orange px-4 py-1.5 font-medium text-orange-ink transition-colors hover:bg-orange-soft disabled:cursor-default disabled:bg-canvas disabled:font-normal disabled:text-faint"
        >
          {savedTo?.id === target.id ? "Saved" : "Save result"}
        </button>
      </div>
      {target.fitCheck && !savedTo && (
        <p className="mt-2 text-xs text-faint">
          This replaces the result saved {formatDate(target.fitCheck.at)} ({target.fitCheck.score} out of 100). The old score stays
          in the project&apos;s changelog.
        </p>
      )}
      {savedTo && (
        <p className="mt-2 text-steel-soft">
          Saved to {savedTo.name}.{" "}
          <Link href={`/workbench/${savedTo.id}/conceive/conceive-checklist`} className="text-orange hover:text-orange-soft">
            See it on the Conceive checkpoint
          </Link>
        </p>
      )}
    </div>
  );
}

function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "favor" | "watch" }) {
  if (items.length === 0) return null;
  const Icon = tone === "favor" ? IconCircleCheck : IconAlertTriangle;
  return (
    <div className="mt-5">
      <h3 className={`text-xs font-medium uppercase tracking-wide ${tone === "favor" ? "text-orange-soft" : "text-tan"}`}>
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2 text-sm">
            <Icon size={16} className={`mt-0.5 shrink-0 ${tone === "favor" ? "text-orange" : "text-tan"}`} aria-hidden />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
