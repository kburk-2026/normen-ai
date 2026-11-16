import type { Project } from "@/content/demo";
import {
  INCIDENT_STATUSES,
  SEVERITIES,
  emptyPulse,
  type AlertLines,
  type CheckIn,
  type Incident,
  type IncidentStatus,
  type Pulse,
  type Severity,
} from "@/content/pulse";
import { formatDate } from "@/lib/format";
import { addLog } from "./log";

/** The Monday of the week a date falls in, YYYY-MM-DD. */
export function weekStart(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** The accuracy level below which a week is past the alert line, or null if the lines are not set. */
export function accuracyFloor(a: AlertLines): number | null {
  return a.accuracyBaseline !== null && a.accuracyDrop !== null ? a.accuracyBaseline - a.accuracyDrop : null;
}

export const flaggedOver = (c: CheckIn, a: AlertLines) => c.flagged !== null && a.flaggedAbove !== null && c.flagged > a.flaggedAbove;
export const accuracyOver = (c: CheckIn, a: AlertLines) => {
  const floor = accuracyFloor(a);
  return c.accuracy !== null && floor !== null && c.accuracy <= floor;
};
export const pastAlert = (c: CheckIn, a: AlertLines) => flaggedOver(c, a) || accuracyOver(c, a);

export function pulseSummary(p: Pulse) {
  return {
    lastWeek: p.checkIns.at(-1)?.week ?? null,
    weeks: p.checkIns.length,
    pastAlert: p.checkIns.filter((c) => pastAlert(c, p.alerts)).length,
    openIncidents: p.incidents.filter((i) => i.status !== "Resolved").length,
  };
}

const byWeek = (cs: CheckIn[]) => [...cs].sort((a, b) => a.week.localeCompare(b.week));
const withPulse = (p: Project, fn: (x: Pulse) => Pulse): Project => ({ ...p, pulse: fn(p.pulse) });

/** Log a week. A second check-in for the same week replaces the first. */
export function saveCheckIn(p: Project, c: CheckIn): Project {
  const existing = p.pulse.checkIns.find((x) => x.week === c.week);
  const next = withPulse(p, (x) => ({ ...x, checkIns: byWeek([...x.checkIns.filter((y) => y.week !== c.week), c]) }));
  return addLog(next, `Pulse check-in ${existing ? "updated" : "logged"}: week of ${formatDate(c.week)}`);
}

export function deleteCheckIn(p: Project, id: string): [Project, CheckIn | undefined] {
  const gone = p.pulse.checkIns.find((c) => c.id === id);
  if (!gone) return [p, undefined];
  const next = withPulse(p, (x) => ({ ...x, checkIns: x.checkIns.filter((c) => c.id !== id) }));
  return [addLog(next, `Pulse check-in removed: week of ${formatDate(gone.week)}`), gone];
}

export function restoreCheckIn(p: Project, c: CheckIn): Project {
  if (p.pulse.checkIns.some((x) => x.week === c.week)) return p;
  const next = withPulse(p, (x) => ({ ...x, checkIns: byWeek([...x.checkIns, c]) }));
  return addLog(next, `Pulse check-in restored: week of ${formatDate(c.week)}`);
}

export function setAlerts(p: Project, alerts: AlertLines, today: string): Project {
  const a = p.pulse.alerts;
  if (a.flaggedAbove === alerts.flaggedAbove && a.accuracyBaseline === alerts.accuracyBaseline && a.accuracyDrop === alerts.accuracyDrop) return p;
  return addLog(withPulse(p, (x) => ({ ...x, alerts })), "Pulse alert lines changed", `alerts:${today}`);
}

export function reportIncident(p: Project, i: Omit<Incident, "number">): Project {
  const number = Math.max(0, ...p.pulse.incidents.map((x) => x.number)) + 1;
  const next = withPulse(p, (x) => ({ ...x, incidents: [{ ...i, number }, ...x.incidents] }));
  return addLog(next, `Incident #${number} reported (${i.severity}): ${i.what}`);
}

/** Change an incident. Resolving it stamps the resolved date if none is set; reopening clears it. */
export function updateIncident(p: Project, id: string, patch: Partial<Omit<Incident, "id" | "number">>, today: string): Project {
  const before = p.pulse.incidents.find((i) => i.id === id);
  if (!before) return p;
  const after: Incident = { ...before, ...patch };
  if (patch.status === "Resolved" && !after.resolved) after.resolved = today;
  if (patch.status && patch.status !== "Resolved") after.resolved = "";
  let next = withPulse(p, (x) => ({ ...x, incidents: x.incidents.map((i) => (i.id === id ? after : i)) }));
  if (patch.status && patch.status !== before.status) next = addLog(next, `Incident #${before.number}: ${before.status} to ${patch.status}`);
  else if (patch.severity && patch.severity !== before.severity) next = addLog(next, `Incident #${before.number}: severity ${before.severity} to ${patch.severity}`);
  else next = addLog(next, `Incident #${before.number} edited`, `incident:${id}:${today}`);
  return next;
}

export function deleteIncident(p: Project, id: string): [Project, { incident: Incident; index: number } | undefined] {
  const index = p.pulse.incidents.findIndex((i) => i.id === id);
  if (index < 0) return [p, undefined];
  const incident = p.pulse.incidents[index];
  const next = withPulse(p, (x) => ({ ...x, incidents: x.incidents.filter((i) => i.id !== id) }));
  return [addLog(next, `Incident #${incident.number} deleted`), { incident, index }];
}

export function restoreIncident(p: Project, saved: { incident: Incident; index: number }): Project {
  if (p.pulse.incidents.some((i) => i.id === saved.incident.id)) return p;
  const incidents = [...p.pulse.incidents];
  incidents.splice(Math.min(saved.index, incidents.length), 0, saved.incident);
  return addLog(withPulse(p, (x) => ({ ...x, incidents })), `Incident #${saved.incident.number} restored`);
}

// ---- Repair of saved data ----

const str = (v: unknown) => (typeof v === "string" ? v : "");
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const num = (v: unknown, max?: number): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && (max === undefined || v <= max) ? v : null;

export function normalizePulse(raw: unknown): Pulse {
  if (!raw || typeof raw !== "object") return emptyPulse();
  const r = raw as Partial<Pulse>;
  const weeks = new Set<string>();
  const checkIns: CheckIn[] = [];
  for (const c of Array.isArray(r.checkIns) ? r.checkIns : []) {
    if (!c || !isDay(c.week)) continue;
    const week = weekStart(c.week);
    if (weeks.has(week)) continue;
    weeks.add(week);
    checkIns.push({ id: str(c.id) || `ci-${week}`, week, uses: num(c.uses), flagged: num(c.flagged, 100), accuracy: num(c.accuracy, 100), note: str(c.note) });
  }
  const ids = new Set<string>();
  const incidents: Incident[] = [];
  for (const i of Array.isArray(r.incidents) ? r.incidents : []) {
    if (!i || !isDay(i.date) || !str(i.what).trim()) continue;
    let id = str(i.id) || `inc-${incidents.length}`;
    while (ids.has(id)) id = `${id}-x`;
    ids.add(id);
    const status: IncidentStatus = INCIDENT_STATUSES.includes(i.status) ? i.status : "Open";
    incidents.push({
      id,
      number: typeof i.number === "number" && i.number > 0 ? Math.floor(i.number) : incidents.length + 1,
      date: i.date,
      what: str(i.what),
      severity: (SEVERITIES as readonly string[]).includes(i.severity) ? (i.severity as Severity) : "Medium",
      status,
      action: str(i.action),
      resolved: status === "Resolved" && isDay(i.resolved) ? i.resolved : "",
    });
  }
  const a = (r.alerts ?? {}) as Partial<AlertLines>;
  return {
    checkIns: byWeek(checkIns),
    incidents,
    alerts: { flaggedAbove: num(a.flaggedAbove, 100), accuracyBaseline: num(a.accuracyBaseline, 100), accuracyDrop: num(a.accuracyDrop, 100) },
  };
}
