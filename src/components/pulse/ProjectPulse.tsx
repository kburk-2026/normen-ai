"use client";

import { useEffect, useId, useState } from "react";
import { IconAlertTriangle, IconChevronRight, IconHeartbeat, IconPlus, IconTrash } from "@tabler/icons-react";
import { ToolsMenu } from "@/components/projects/ProjectTools";
import { INCIDENT_STATUSES, SEVERITIES, type AlertLines, type Incident, type IncidentStatus, type Severity } from "@/content/pulse";
import { formatDate, today } from "@/lib/format";
import { useProject } from "@/state/ProjectProvider";
import { accuracyFloor, accuracyOver, flaggedOver, pulseSummary, weekStart } from "@/state/pulse";
import TrendChart from "./TrendChart";

const PILL: Record<Severity | IncidentStatus, string> = {
  High: "bg-orange-bg text-orange-soft",
  Medium: "bg-tan-bg text-tan-soft",
  Low: "bg-steel-bg text-steel-soft",
  Open: "bg-orange-bg text-orange-soft",
  Investigating: "bg-tan-bg text-tan-soft",
  Resolved: "bg-steel-bg text-steel-soft",
};
const UNDO_MS = 8000;
const field =
  "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-faint focus:border-orange focus:outline-none";
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

type Undo = { label: string; run: () => void };

/** A project's Pulse: weekly check-ins with trends and alert lines, and the incident log. */
export default function ProjectPulse() {
  const { project } = useProject();
  const pulse = project.pulse;
  const s = pulseSummary(pulse);
  const [undo, setUndo] = useState<Undo | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [undo]);

  const floor = accuracyFloor(pulse.alerts);
  const series = (key: "uses" | "flagged" | "accuracy") =>
    pulse.checkIns
      .filter((c) => c[key] !== null)
      .map((c) => ({
        week: c.week,
        value: c[key] as number,
        over: key === "flagged" ? flaggedOver(c, pulse.alerts) : key === "accuracy" ? accuracyOver(c, pulse.alerts) : false,
      }));

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {project.name} <IconChevronRight size={14} aria-hidden /> <span className="text-ink">Pulse</span>
        </p>
        <ToolsMenu />
      </div>
      <h1 className="mt-3 flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconHeartbeat size={26} className="text-orange" aria-hidden /> Pulse
      </h1>
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 max-w-2xl text-sm text-muted">
        How the system is doing in use: one check-in a week, and every incident from report to fix.
      </p>

      {s.weeks === 0 && pulse.incidents.length === 0 && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          Nothing logged yet. Start once people are using the system, usually from the Launch phase: log a check-in each week,
          and report anything that went wrong as an incident.
        </p>
      )}

      <h2 className="sr-only">Summary</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Last check-in", s.lastWeek ? formatDate(s.lastWeek) : "None yet"],
          ["Weeks logged", String(s.weeks)],
          ["Weeks past an alert line", String(s.pastAlert)],
          ["Open incidents", String(s.openIncidents)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse rounded-2xl bg-surface p-4">
            <dt className="mt-1 text-xs text-muted">{k}</dt>
            <dd className="font-display text-2xl font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 font-display text-xl font-medium">Weekly trends</h2>
      <AlertSettings alerts={pulse.alerts} />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <TrendChart title="Uses per week" unit="" points={series("uses")} alert={null} alertLabel="" kind="bar" />
        <TrendChart
          title="Flagged outputs"
          unit="%"
          points={series("flagged")}
          alert={pulse.alerts.flaggedAbove}
          alertLabel={pulse.alerts.flaggedAbove !== null ? `alert above ${fmt(pulse.alerts.flaggedAbove)}%` : ""}
          kind="line"
        />
        <TrendChart
          title="Accuracy on reviewed sample"
          unit="%"
          points={series("accuracy")}
          alert={floor}
          alertLabel={floor !== null ? `alert at ${fmt(floor)}%` : ""}
          kind="line"
        />
      </div>

      <CheckIns onUndo={setUndo} />

      <h2 className="mt-10 font-display text-xl font-medium">Incident log</h2>
      <p className="mt-1 text-sm text-muted">Anything that caused harm or could have: what happened, how serious, and what was done.</p>
      <Incidents onUndo={setUndo} />

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

/** A number field that keeps what is typed and reports a number, or null when empty or invalid. */
function NumberField({
  label,
  value,
  onChange,
  max,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
  suffix?: string;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => setText(value === null ? "" : String(value)), [value]);
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step="any"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = e.target.value === "" ? null : Number(e.target.value);
            if (n === null || (Number.isFinite(n) && n >= 0 && (max === undefined || n <= max))) onChange(n);
          }}
          className={`${field} ${suffix ? "pr-8" : ""}`}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-[35%] text-xs text-faint">{suffix}</span>}
      </span>
    </label>
  );
}

function AlertSettings({ alerts }: { alerts: AlertLines }) {
  const { setAlerts } = useProject();
  const floor = accuracyFloor(alerts);
  return (
    <details className="mt-2 rounded-2xl bg-surface p-4 text-sm" open={alerts.flaggedAbove === null && floor === null}>
      <summary className="cursor-pointer text-muted">
        Alert lines:{" "}
        <span className="text-ink">
          {alerts.flaggedAbove === null && floor === null
            ? "not set"
            : [
                alerts.flaggedAbove !== null ? `flagged outputs above ${fmt(alerts.flaggedAbove)}%` : null,
                floor !== null ? `accuracy at or below ${fmt(floor)}%` : null,
              ]
                .filter(Boolean)
                .join(", ")}
        </span>
      </summary>
      <p className="mt-2 text-xs text-faint">
        Weeks past a line are marked. These are the one place Normen compares for you, because both sides are numbers you enter.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <NumberField label="Flagged outputs: alert above" suffix="%" max={100} value={alerts.flaggedAbove} onChange={(v) => setAlerts({ ...alerts, flaggedAbove: v })} />
        <NumberField label="Accuracy at launch" suffix="%" max={100} value={alerts.accuracyBaseline} onChange={(v) => setAlerts({ ...alerts, accuracyBaseline: v })} />
        <NumberField label="Alert when accuracy drops by" suffix="pts" max={100} value={alerts.accuracyDrop} onChange={(v) => setAlerts({ ...alerts, accuracyDrop: v })} />
      </div>
    </details>
  );
}

function CheckIns({ onUndo }: { onUndo: (u: Undo) => void }) {
  const { project, deleteCheckIn, restoreCheckIn } = useProject();
  const { checkIns, alerts } = project.pulse;
  const [logging, setLogging] = useState(false);
  const focusLog = () => window.setTimeout(() => document.getElementById("pulse-log")?.focus(), 0);
  const warn = <IconAlertTriangle size={13} className="mr-1 inline text-orange-soft" aria-hidden />;

  return (
    <div className="mt-4 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Check-ins</h3>
        {!logging && (
          <button
            id="pulse-log"
            type="button"
            onClick={() => setLogging(true)}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-orange"
          >
            <IconPlus size={12} aria-hidden /> Log a week
          </button>
        )}
      </div>
      {logging && (
        <CheckInForm
          onDone={() => {
            setLogging(false);
            focusLog();
          }}
        />
      )}
      {checkIns.length === 0 ? (
        <p className="mt-3 text-sm text-faint">No weeks logged yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-faint">
                <th scope="col" className="py-1.5 pr-3 font-normal">Week of</th>
                <th scope="col" className="px-3 py-1.5 text-right font-normal">Uses</th>
                <th scope="col" className="px-3 py-1.5 text-right font-normal">Flagged</th>
                <th scope="col" className="px-3 py-1.5 text-right font-normal">Accuracy</th>
                <th scope="col" className="px-3 py-1.5 font-normal">Note</th>
                <th scope="col" className="w-8">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...checkIns].reverse().map((c) => {
                const fo = flaggedOver(c, alerts);
                const ao = accuracyOver(c, alerts);
                return (
                  <tr key={c.id} className="border-t border-line align-top">
                    <td className="py-1.5 pr-3 font-mono text-xs text-muted">{formatDate(c.week)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{c.uses === null ? "-" : fmt(c.uses)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {fo && warn}
                      {c.flagged === null ? "-" : `${fmt(c.flagged)}%`}
                      {fo && <span className="sr-only"> past the alert line</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {ao && warn}
                      {c.accuracy === null ? "-" : `${fmt(c.accuracy)}%`}
                      {ao && <span className="sr-only"> past the alert line</span>}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{c.note}</td>
                    <td className="py-1">
                      <button
                        type="button"
                        aria-label={`Delete the check-in for the week of ${formatDate(c.week)}`}
                        title="Delete check-in"
                        onClick={() => {
                          const gone = deleteCheckIn(c.id);
                          if (gone) onUndo({ label: "Check-in deleted.", run: () => restoreCheckIn(gone) });
                          focusLog();
                        }}
                        className="rounded p-1 text-faint hover:bg-canvas hover:text-ink"
                      >
                        <IconTrash size={14} aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(alerts.flaggedAbove !== null || accuracyFloor(alerts) !== null) && (
            <p className="mt-2 text-xs text-faint">{warn}Past an alert line.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CheckInForm({ onDone }: { onDone: () => void }) {
  const { project, saveCheckIn } = useProject();
  const [day, setDay] = useState(weekStart(today()));
  const [uses, setUses] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const errorId = useId();
  const week = /^\d{4}-\d{2}-\d{2}$/.test(day) ? weekStart(day) : "";
  const existing = week ? project.pulse.checkIns.find((c) => c.week === week) : undefined;

  // Picking a week that is already logged loads its numbers, so saving edits it rather than wiping it.
  const [loadedWeek, setLoadedWeek] = useState("");
  useEffect(() => {
    if (!week || week === loadedWeek) return;
    setLoadedWeek(week);
    if (existing) {
      setUses(existing.uses);
      setFlagged(existing.flagged);
      setAccuracy(existing.accuracy);
      setNote(existing.note);
    }
  }, [week, loadedWeek, existing]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!week) return setError("Pick a day in the week you are logging.");
        if (uses === null && flagged === null && accuracy === null && !note.trim()) return setError("Enter at least one number or a note.");
        saveCheckIn({ week, uses: uses === null ? null : Math.round(uses), flagged, accuracy, note: note.trim() });
        onDone();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
      aria-describedby={error ? errorId : undefined}
      className="mt-3 grid gap-3 rounded-xl border border-orange/50 bg-canvas p-4 text-sm sm:grid-cols-4"
    >
      <p className="text-xs uppercase tracking-wide text-faint sm:col-span-4">Log a week</p>
      <label className="block">
        <span className="text-xs text-muted">Any day in the week</span>
        <input type="date" autoFocus value={day} onChange={(e) => setDay(e.target.value)} className={`${field} px-2 [color-scheme:dark]`} />
        {week && <span className="mt-1 block text-xs text-faint">Week of {formatDate(week)}</span>}
      </label>
      <NumberField label="Uses" value={uses} onChange={setUses} />
      <NumberField label="Flagged outputs" suffix="%" max={100} value={flagged} onChange={setFlagged} />
      <NumberField label="Accuracy on sample" suffix="%" max={100} value={accuracy} onChange={setAccuracy} />
      <label className="block sm:col-span-4">
        <span className="text-xs text-muted">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything that explains the numbers" className={field} />
      </label>
      {existing && <p className="text-xs text-tan-soft sm:col-span-4">That week is already logged, so its numbers are filled in. Saving updates it.</p>}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-tan-soft sm:col-span-4">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-4">
        <button type="button" onClick={onDone} className="rounded-full px-4 py-1.5 text-muted hover:text-ink">
          Cancel
        </button>
        <button type="submit" className="rounded-full bg-orange px-4 py-1.5 font-medium text-orange-ink hover:bg-orange-soft">
          Save check-in
        </button>
      </div>
    </form>
  );
}

function Incidents({ onUndo }: { onUndo: (u: Undo) => void }) {
  const { project, updateIncident, deleteIncident, restoreIncident } = useProject();
  const [reporting, setReporting] = useState(false);
  const focusReport = () => window.setTimeout(() => document.getElementById("pulse-report")?.focus(), 0);
  const incidents = project.pulse.incidents;

  return (
    <div className="mt-4 rounded-2xl bg-surface p-4">
      {reporting ? (
        <IncidentForm
          onDone={() => {
            setReporting(false);
            focusReport();
          }}
        />
      ) : (
        <button
          id="pulse-report"
          type="button"
          onClick={() => setReporting(true)}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-orange"
        >
          <IconPlus size={12} aria-hidden /> Report an incident
        </button>
      )}
      {incidents.length === 0 ? (
        <p className="mt-3 text-sm text-faint">No incidents reported.</p>
      ) : (
        <ol className="mt-3">
          {incidents.map((i) => (
            <IncidentRow
              key={i.id}
              i={i}
              onChange={(patch) => updateIncident(i.id, patch)}
              onDelete={() => {
                const saved = deleteIncident(i.id);
                if (saved) onUndo({ label: `Incident #${i.number} deleted.`, run: () => restoreIncident(saved) });
                focusReport();
              }}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function IncidentRow({
  i,
  onChange,
  onDelete,
}: {
  i: Incident;
  onChange: (patch: Partial<Omit<Incident, "id" | "number">>) => void;
  onDelete: () => void;
}) {
  const select = (label: string, value: string, options: readonly string[], set: (v: string) => void) => (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-faint">{label}</span>
      <select
        aria-label={`${label} of incident ${i.number}`}
        value={value}
        onChange={(e) => set(e.target.value)}
        className={`cursor-pointer rounded-full px-2.5 py-0.5 ${PILL[value as Severity | IncidentStatus]} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange`}
      >
        {options.map((o) => (
          <option key={o} className="bg-canvas text-ink">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <li className="border-t border-line py-3 text-sm first:border-t-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="font-mono text-xs text-faint">
          #{i.number} · {formatDate(i.date)}
        </span>
        <span className="min-w-[14rem] flex-1 font-medium">{i.what}</span>
        {select("Severity", i.severity, SEVERITIES, (v) => onChange({ severity: v as Severity }))}
        {select("Status", i.status, INCIDENT_STATUSES, (v) => onChange({ status: v as IncidentStatus }))}
        <button
          type="button"
          aria-label={`Delete incident ${i.number}`}
          title="Delete incident"
          onClick={onDelete}
          className="rounded p-1 text-faint hover:bg-canvas hover:text-ink"
        >
          <IconTrash size={14} aria-hidden />
        </button>
      </div>
      <label className="mt-2 block">
        <span className="text-xs uppercase tracking-wide text-faint">What was done</span>
        <input
          value={i.action}
          placeholder="Who looked at it, what changed, who was told"
          onChange={(e) => onChange({ action: e.target.value })}
          className={field}
        />
      </label>
      {i.resolved && <p className="mt-1 text-xs text-faint">Resolved {formatDate(i.resolved)}</p>}
    </li>
  );
}

function IncidentForm({ onDone }: { onDone: () => void }) {
  const { reportIncident } = useProject();
  const [date, setDate] = useState(today());
  const [what, setWhat] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!what.trim()) return setError("Describe what happened.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Pick the date it happened.");
        reportIncident({ date, what: what.trim(), severity, status: "Open", action: action.trim(), resolved: "" });
        onDone();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
      className="grid gap-3 rounded-xl border border-orange/50 bg-canvas p-4 text-sm sm:grid-cols-[9rem_1fr_9rem]"
    >
      <p className="text-xs uppercase tracking-wide text-faint sm:col-span-3">Report an incident</p>
      <label className="block">
        <span className="text-xs text-muted">Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} px-2 [color-scheme:dark]`} />
      </label>
      <label className="block">
        <span className="text-xs text-muted">What happened</span>
        <input
          autoFocus
          value={what}
          aria-invalid={!!error && !what.trim()}
          onChange={(e) => {
            setWhat(e.target.value);
            setError("");
          }}
          placeholder="Who or what was affected, and how"
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">Severity</span>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className={`${field} px-2`}>
          {SEVERITIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-3">
        <span className="text-xs text-muted">What has been done so far (optional)</span>
        <input value={action} onChange={(e) => setAction(e.target.value)} className={field} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-tan-soft sm:col-span-3">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-3">
        <button type="button" onClick={onDone} className="rounded-full px-4 py-1.5 text-muted hover:text-ink">
          Cancel
        </button>
        <button type="submit" className="rounded-full bg-orange px-4 py-1.5 font-medium text-orange-ink hover:bg-orange-soft">
          Report incident
        </button>
      </div>
    </form>
  );
}
