"use client";

import { useEffect, useId, useState } from "react";
import { IconChevronDown, IconChevronRight, IconGauge, IconPlus, IconTrash } from "@tabler/icons-react";
import { ToolsMenu } from "@/components/projects/ProjectTools";
import { PHASES, type PhaseId } from "@/content/phases";
import { VERDICTS, type MetricStatus, type Verdict } from "@/content/scorecard";
import { formatDate, today } from "@/lib/format";
import { useProject } from "@/state/ProjectProvider";
import { STATUS_ORDER, allMetrics, readingNumber, recordOf, statusCounts, statusOf, type Metric } from "@/state/scorecard";

/** Status colors. The word is always shown too, so color is never the only signal. */
export const STATUS_PILL: Record<MetricStatus, string> = {
  "On target": "bg-steel-bg text-steel-soft",
  Close: "bg-tan-bg text-tan-soft",
  "Off target": "bg-orange-bg text-orange-soft",
  "Not measured": "bg-canvas text-muted ring-1 ring-line",
};

const UNDO_MS = 8000;
const fieldClass =
  "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-faint focus:border-orange focus:outline-none";

/** A project's Scorecard: every measure by phase, with its target, readings and status. */
export default function ProjectScorecard() {
  const { project } = useProject();
  const card = project.scorecard;
  const metrics = allMetrics(card);
  const counts = statusCounts(card);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [undo]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {project.name} <IconChevronRight size={14} aria-hidden /> <span className="text-ink">Scorecard</span>
        </p>
        <ToolsMenu />
      </div>
      <h1 className="mt-3 flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconGauge size={26} className="text-orange" aria-hidden /> Scorecard
      </h1>
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 max-w-2xl text-sm text-muted">
        The measures this project sets itself, what it is aiming for, and what it actually got. You write the targets and make
        the call on each reading.
      </p>

      <h2 className="sr-only">Summary</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="flex flex-col-reverse rounded-2xl bg-surface p-4">
            <dt className="mt-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_PILL[s]}`}>{s}</span>
            </dt>
            <dd className="font-display text-3xl font-medium">{counts[s]}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 space-y-6">
        {PHASES.map((phase) => (
          <section key={phase.id} aria-labelledby={`sc-${phase.id}`} className={`rounded-2xl border-l-4 bg-surface p-4 ${phase.strip}`}>
            <h2 id={`sc-${phase.id}`} className="font-display text-lg font-medium">
              <span className="mr-2 font-mono text-xs text-faint">0{phase.number}</span>
              {phase.name}
            </h2>
            <ul className="mt-2">
              {metrics
                .filter((m) => m.phase === phase.id)
                .map((m) => (
                  <MetricRow key={m.id} m={m} open={open.has(m.id)} onToggle={() => toggle(m.id)} onUndo={setUndo} />
                ))}
            </ul>
            <AddMeasure phase={phase.id} />
          </section>
        ))}
      </div>

      {undo && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-line bg-surface px-5 py-2.5 text-sm shadow-2xl print:hidden"
        >
          {undo.label}
          <button
            type="button"
            onClick={() => {
              undo.run();
              setUndo(null);
            }}
            className="font-medium text-orange hover:text-orange-soft"
          >
            Undo
          </button>
        </div>
      )}
    </article>
  );
}

function MetricRow({
  m,
  open,
  onToggle,
  onUndo,
}: {
  m: Metric;
  open: boolean;
  onToggle: () => void;
  onUndo: (u: { label: string; run: () => void }) => void;
}) {
  const { project, setTarget, deleteReading, restoreReading, removeCustomMetric, restoreCustomMetric } = useProject();
  const rec = recordOf(project.scorecard, m.id);
  const last = rec.readings.at(-1);
  const status = statusOf(project.scorecard, m.id);
  const [logging, setLogging] = useState(false);
  const panelId = useId();
  const logButtonId = `log-${m.id}`;
  // After the form closes or a reading goes, keep keyboard users on this measure. A timeout, not
  // requestAnimationFrame: animation frames pause in background tabs.
  const focusLog = () => window.setTimeout(() => document.getElementById(logButtonId)?.focus(), 0);

  return (
    <li className="border-t border-line py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-w-[14rem] flex-1 items-start gap-2 rounded-lg text-left"
        >
          {open ? (
            <IconChevronDown size={16} className="mt-1 shrink-0 text-faint" aria-hidden />
          ) : (
            <IconChevronRight size={16} className="mt-1 shrink-0 text-faint" aria-hidden />
          )}
          <span>
            <span className="font-medium">{m.metric}</span>
            {m.custom && <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-faint ring-1 ring-line">Your own</span>}
            {m.measure && <span className="block text-xs text-muted">{m.measure}</span>}
          </span>
        </button>
        <Spark values={rec.readings.map((r) => r.value)} />
        <span className="w-40 text-sm">
          {last ? (
            <>
              <span className="font-mono">{last.value}</span>
              <span className="block text-xs text-faint">{formatDate(last.date)}</span>
            </>
          ) : (
            <span className="text-xs text-faint">No readings yet</span>
          )}
        </span>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${STATUS_PILL[status]}`}>{status}</span>
      </div>

      {open && (
        <div id={panelId} className="mt-3 rounded-xl bg-canvas p-4 text-sm sm:ml-6">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-faint">Target</span>
            <input
              value={rec.target}
              placeholder={m.exampleTarget ? `For example: ${m.exampleTarget}` : "What you are aiming for"}
              onChange={(e) => setTarget(m.id, e.target.value)}
              className={fieldClass}
            />
          </label>
          {m.exampleTarget && !rec.target && (
            <p className="mt-1 text-xs text-faint">The example is an illustration, not a recommendation. Set your own.</p>
          )}

          <h3 className="mt-4 text-xs font-normal uppercase tracking-wide text-faint">Readings</h3>
          {rec.readings.length ? (
            <ol className="mt-1">
              {[...rec.readings].reverse().map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line py-2 first:border-t-0">
                  <span className="w-24 font-mono text-xs text-faint">{formatDate(r.date)}</span>
                  <span className="w-28 break-words font-mono">{r.value}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_PILL[r.verdict]}`}>{r.verdict}</span>
                  <span className="min-w-[10rem] flex-1 text-muted">{r.note}</span>
                  <button
                    type="button"
                    aria-label={`Delete reading ${r.value} from ${formatDate(r.date)}`}
                    title="Delete reading"
                    onClick={() => {
                      const gone = deleteReading(m.id, r.id);
                      if (gone) onUndo({ label: "Reading deleted.", run: () => restoreReading(m.id, gone) });
                      focusLog();
                    }}
                    className="self-center rounded p-1 text-faint hover:bg-surface hover:text-ink"
                  >
                    <IconTrash size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-1 text-muted">Nothing logged yet.</p>
          )}

          {logging ? (
            <LogForm
              m={m}
              onDone={() => {
                setLogging(false);
                focusLog();
              }}
            />
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                id={logButtonId}
                type="button"
                onClick={() => setLogging(true)}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-orange"
              >
                <IconPlus size={12} aria-hidden /> Log a reading
              </button>
              {m.custom && (
                <button
                  type="button"
                  onClick={() => {
                    const saved = removeCustomMetric(m.id);
                    if (saved) onUndo({ label: `${m.metric} removed.`, run: () => restoreCustomMetric(saved) });
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-faint hover:text-ink"
                >
                  <IconTrash size={12} aria-hidden /> Remove this measure
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function LogForm({ m, onDone }: { m: Metric; onDone: () => void }) {
  const { addReading } = useProject();
  const [date, setDate] = useState(today());
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict>("On target");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const errorId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return setError("Write what you measured.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Pick the date you measured it.");
        addReading(m.id, { date, value: value.trim(), verdict, note: note.trim() });
        onDone();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
      className="mt-3 grid gap-3 rounded-xl border border-orange/50 p-4 sm:grid-cols-[9rem_1fr_10rem]"
    >
      <p className="text-xs uppercase tracking-wide text-faint sm:col-span-3">Log a reading: {m.metric}</p>
      <label>
        <span className="text-xs text-muted">Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} px-2 [color-scheme:dark]`} />
      </label>
      <label>
        <span className="text-xs text-muted">What you measured</span>
        <input
          autoFocus
          value={value}
          aria-invalid={!!error && !value.trim()}
          aria-describedby={error ? errorId : undefined}
          placeholder="For example: 84% or Signed off"
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          className={fieldClass}
        />
      </label>
      <label>
        <span className="text-xs text-muted">Against the target</span>
        <select value={verdict} onChange={(e) => setVerdict(e.target.value as Verdict)} className={`${fieldClass} px-2`}>
          {VERDICTS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-3">
        <span className="text-xs text-muted">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed, or where the number came from" className={fieldClass} />
      </label>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-tan-soft sm:col-span-3">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-3">
        <button type="button" onClick={onDone} className="rounded-full px-4 py-1.5 text-sm text-muted hover:text-ink">
          Cancel
        </button>
        <button type="submit" className="rounded-full bg-orange px-4 py-1.5 text-sm font-medium text-orange-ink hover:bg-orange-soft">
          Save reading
        </button>
      </div>
    </form>
  );
}

function AddMeasure({ phase }: { phase: PhaseId }) {
  const { addCustomMetric } = useProject();
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState("");
  const [measure, setMeasure] = useState("");
  const [error, setError] = useState("");
  const name = PHASES.find((p) => p.id === phase)?.name;
  const close = () => {
    setAdding(false);
    setMetric("");
    setMeasure("");
    setError("");
  };

  if (!adding)
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        aria-label={`Add your own measure to ${name}`}
        className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-faint hover:text-ink"
      >
        <IconPlus size={12} aria-hidden /> Add your own measure
      </button>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!metric.trim()) return setError("Give the measure a name.");
        addCustomMetric(phase, metric, measure);
        close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
      className="mt-3 grid gap-3 rounded-xl bg-canvas p-4 text-sm sm:grid-cols-2"
    >
      <p className="text-xs uppercase tracking-wide text-faint sm:col-span-2">New measure in {name}</p>
      <label>
        <span className="text-xs text-muted">Name</span>
        <input
          autoFocus
          value={metric}
          aria-invalid={!!error}
          onChange={(e) => {
            setMetric(e.target.value);
            setError("");
          }}
          placeholder="For example: Reviewer overrides"
          className={fieldClass}
        />
      </label>
      <label>
        <span className="text-xs text-muted">How it is measured (optional)</span>
        <input value={measure} onChange={(e) => setMeasure(e.target.value)} placeholder="For example: Share of flags reviewers reject" className={fieldClass} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-tan-soft sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={close} className="rounded-full px-4 py-1.5 text-muted hover:text-ink">
          Cancel
        </button>
        <button type="submit" className="rounded-full bg-orange px-4 py-1.5 font-medium text-orange-ink hover:bg-orange-soft">
          Add measure
        </button>
      </div>
    </form>
  );
}

/** A small trend line when two or more readings start with a number. Described in words for screen readers. */
export function Spark({ values }: { values: string[] }) {
  const pts = values.map(readingNumber).filter((n): n is number => n !== null);
  if (pts.length < 2) return <span className="hidden w-20 sm:block" aria-hidden />;
  const min = Math.min(...pts);
  const span = Math.max(...pts) - min || 1;
  const xy = pts.map((p, i) => [4 + (i * 72) / (pts.length - 1), 22 - ((p - min) / span) * 18] as const);
  return (
    <svg viewBox="0 0 80 26" className="h-6 w-20 shrink-0" role="img" aria-label={`Trend over ${pts.length} readings: ${pts.join(", then ")}`}>
      <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--color-steel-soft)" strokeWidth="1.5" strokeLinejoin="round" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 2.5 : 1.5} fill={i === xy.length - 1 ? "var(--color-orange)" : "var(--color-steel-soft)"} />
      ))}
    </svg>
  );
}
