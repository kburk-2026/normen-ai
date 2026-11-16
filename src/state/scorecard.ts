import { SCORECARD } from "@/content/lifecycle";
import { PHASES, type PhaseId } from "@/content/phases";
import type { Project } from "@/content/demo";
import {
  VERDICTS,
  emptyScorecard,
  type CustomMetric,
  type MetricRecord,
  type MetricStatus,
  type Reading,
  type Scorecard,
  type Verdict,
} from "@/content/scorecard";
import { addLog } from "./log";

/** One row of a Scorecard: a built-in or custom measure. */
export type Metric = {
  id: string;
  phase: PhaseId;
  metric: string;
  measure: string;
  /** The Field Guide's example target, for built-in measures only. */
  exampleTarget?: string;
  custom: boolean;
};

/** Every measure for a project, in phase order: the Field Guide's, then the project's own. */
export function allMetrics(card: Scorecard): Metric[] {
  return PHASES.flatMap((ph) => [
    ...SCORECARD.filter((s) => s.phase === ph.id).map((s) => ({
      id: s.id,
      phase: s.phase,
      metric: s.metric,
      measure: s.measure,
      exampleTarget: s.exampleTarget,
      custom: false,
    })),
    ...card.custom.filter((c) => c.phase === ph.id).map((c) => ({ ...c, custom: true })),
  ]);
}

export const recordOf = (card: Scorecard, id: string): MetricRecord => card.metrics[id] ?? { target: "", readings: [] };

/** Readings oldest first; the last one is the latest. Same-day readings keep the order they were logged. */
const byDate = (rs: Reading[]) => rs.map((r, i) => ({ r, i })).sort((a, b) => a.r.date.localeCompare(b.r.date) || a.i - b.i).map((x) => x.r);

/** A measure's status is its latest reading's verdict. */
export function statusOf(card: Scorecard, id: string): MetricStatus {
  return recordOf(card, id).readings.at(-1)?.verdict ?? "Not measured";
}

export const STATUS_ORDER: MetricStatus[] = ["On target", "Close", "Off target", "Not measured"];

export function statusCounts(card: Scorecard): Record<MetricStatus, number> {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<MetricStatus, number>;
  for (const m of allMetrics(card)) counts[statusOf(card, m.id)]++;
  return counts;
}

/** The first number in a reading's value, for the trend line. "7 points" gives 7; "Signed off" gives null. */
export function readingNumber(value: string): number | null {
  const m = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// ---- Changes. Each returns a new project and writes the changelog. ----

const nameOf = (card: Scorecard, id: string) => allMetrics(card).find((m) => m.id === id)?.metric ?? "a measure";

function withCard(p: Project, fn: (c: Scorecard) => Scorecard): Project {
  return { ...p, scorecard: fn(p.scorecard) };
}
const setRecord = (c: Scorecard, id: string, rec: MetricRecord): Scorecard => ({ ...c, metrics: { ...c.metrics, [id]: rec } });

export function setTarget(p: Project, id: string, target: string, today: string): Project {
  const rec = recordOf(p.scorecard, id);
  if (rec.target === target) return p;
  const next = withCard(p, (c) => setRecord(c, id, { ...rec, target }));
  // One line per measure per day, however much is typed.
  return addLog(next, `Scorecard target edited: ${nameOf(p.scorecard, id)}`, `target:${id}:${today}`);
}

export function addReading(p: Project, id: string, reading: Reading): Project {
  const rec = recordOf(p.scorecard, id);
  const next = withCard(p, (c) => setRecord(c, id, { ...rec, readings: byDate([...rec.readings, reading]) }));
  return addLog(next, `Scorecard reading: ${nameOf(p.scorecard, id)}, ${reading.value} (${reading.verdict})`);
}

export function deleteReading(p: Project, id: string, readingId: string): Project {
  const rec = recordOf(p.scorecard, id);
  const gone = rec.readings.find((r) => r.id === readingId);
  if (!gone) return p;
  const next = withCard(p, (c) => setRecord(c, id, { ...rec, readings: rec.readings.filter((r) => r.id !== readingId) }));
  return addLog(next, `Scorecard reading removed: ${nameOf(p.scorecard, id)}, ${gone.value}`);
}

/** Put a deleted reading back (Undo). */
export function restoreReading(p: Project, id: string, reading: Reading): Project {
  const rec = recordOf(p.scorecard, id);
  if (rec.readings.some((r) => r.id === reading.id)) return p;
  const next = withCard(p, (c) => setRecord(c, id, { ...rec, readings: byDate([...rec.readings, reading]) }));
  return addLog(next, `Scorecard reading restored: ${nameOf(p.scorecard, id)}, ${reading.value}`);
}

export function addCustomMetric(p: Project, metric: CustomMetric): Project {
  const next = withCard(p, (c) => ({ ...c, custom: [...c.custom, metric] }));
  return addLog(next, `Scorecard measure added in ${PHASES.find((x) => x.id === metric.phase)?.name}: ${metric.metric}`);
}

/** What Undo needs to put a removed measure back. */
export type RemovedMetric = { metric: CustomMetric; index: number; record?: MetricRecord };

/** Remove one of the project's own measures, with its target and readings. Returns what Undo needs. */
export function removeCustomMetric(p: Project, id: string): [Project, RemovedMetric | null] {
  const index = p.scorecard.custom.findIndex((c) => c.id === id);
  if (index < 0) return [p, null];
  const metric = p.scorecard.custom[index];
  const record = p.scorecard.metrics[id];
  const metrics = { ...p.scorecard.metrics };
  delete metrics[id];
  const next = withCard(p, (c) => ({ metrics, custom: c.custom.filter((x) => x.id !== id) }));
  return [addLog(next, `Scorecard measure removed: ${metric.metric}`), { metric, index, record }];
}

export function restoreCustomMetric(p: Project, saved: RemovedMetric): Project {
  if (p.scorecard.custom.some((c) => c.id === saved.metric.id)) return p;
  const custom = [...p.scorecard.custom];
  custom.splice(Math.min(saved.index, custom.length), 0, saved.metric);
  const metrics = saved.record ? { ...p.scorecard.metrics, [saved.metric.id]: saved.record } : p.scorecard.metrics;
  return addLog(withCard(p, () => ({ metrics, custom })), `Scorecard measure restored: ${saved.metric.metric}`);
}

// ---- Repair of saved data ----

const str = (v: unknown) => (typeof v === "string" ? v : "");
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Repair a saved Scorecard. Bad readings are dropped; unknown measure IDs are dropped. */
export function normalizeScorecard(raw: unknown): Scorecard {
  if (!raw || typeof raw !== "object") return emptyScorecard();
  const r = raw as Partial<Scorecard>;
  const phaseIds = PHASES.map((p) => p.id as string);
  const seen = new Set<string>(SCORECARD.map((s) => s.id));
  const custom: CustomMetric[] = [];
  for (const c of Array.isArray(r.custom) ? r.custom : []) {
    if (!c || typeof c !== "object" || !str(c.id) || seen.has(c.id) || !phaseIds.includes(c.phase) || !str(c.metric).trim()) continue;
    seen.add(c.id);
    custom.push({ id: c.id, phase: c.phase, metric: str(c.metric), measure: str(c.measure) });
  }
  const metrics: Record<string, MetricRecord> = {};
  for (const [id, rec] of Object.entries(r.metrics && typeof r.metrics === "object" ? r.metrics : {})) {
    if (!seen.has(id) || !rec || typeof rec !== "object") continue;
    const ids = new Set<string>();
    const readings = (Array.isArray(rec.readings) ? rec.readings : [])
      .filter((x): x is Reading => !!x && isDay(x.date) && !!str(x.value).trim() && VERDICTS.includes(x.verdict as Verdict))
      .map((x, i) => {
        let rid = str(x.id) || `rd-${i}`;
        while (ids.has(rid)) rid = `${rid}-x`;
        ids.add(rid);
        return { id: rid, date: x.date, value: str(x.value), verdict: x.verdict, note: str(x.note) };
      });
    metrics[id] = { target: str(rec.target), readings: byDate(readings) };
  }
  return { metrics, custom };
}


