import { PHASES, type PhaseId } from "@/content/phases";
import type { Project } from "@/content/demo";
import { formatDate, localDay } from "@/lib/format";
import { addLog } from "./log";

export type SpanState = "passed" | "current" | "locked";

export type PhaseSpan = {
  phase: PhaseId;
  state: SpanState;
  /** When the phase began: the day the phase before it passed (Conceive: the day the project was created). */
  start?: string;
  /** Its pass date, or today for the current phase. */
  end?: string;
  /** Where its planned bar begins: today for the current phase, else the previous phase's pass or target date. */
  plannedFrom?: string;
  target?: string;
  override: boolean;
  /** Passed, but before pass dates were recorded (milestone 7), so there is nothing to draw. */
  undated: boolean;
};

/** Each phase's place in time, from what the project records. */
export function phaseSpans(p: Project, today: string): PhaseSpan[] {
  let prevEnd: string | undefined = localDay(p.createdAt);
  let prevPlanned: string | undefined = prevEnd;
  let reached = true; // every earlier phase has passed
  return PHASES.map((ph) => {
    const passed = p.passed.includes(ph.id);
    const state: SpanState = passed ? "passed" : reached ? "current" : "locked";
    const passedAt = p.passedAt[ph.id];
    const target = state === "passed" ? undefined : p.targets[ph.id];
    const span: PhaseSpan = {
      phase: ph.id,
      state,
      start: state === "locked" ? undefined : prevEnd,
      end: state === "passed" ? passedAt : state === "current" ? today : undefined,
      plannedFrom: state === "current" ? today : state === "locked" ? prevPlanned : undefined,
      target,
      override: passed && p.overrides.some((o) => o.phase === ph.id),
      undated: passed && !passedAt,
    };
    if (!passed) reached = false;
    prevEnd = passed ? passedAt : undefined;
    prevPlanned = passed ? passedAt : target;
    return span;
  });
}

export type TimelineEvent = {
  date: string;
  text: string;
  /** Which block type it came from. */
  from: "Timeline" | "Decision Log" | "Approval Tracker";
  /** Where it lives, for a link. */
  phase: PhaseId;
  sectionId: string;
  sectionTitle: string;
  /** Timeline milestones only: undone and past their date. */
  overdue: boolean;
  /** Timeline milestones only. */
  done?: boolean;
};

/** Every dated milestone, decision and approval in the project's blocks, oldest first. */
export function timelineEvents(p: Project, today: string): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  for (const ph of PHASES) {
    for (const s of p.sections[ph.id]) {
      const where = { phase: ph.id, sectionId: s.id, sectionTitle: s.title || "Untitled section" };
      for (const b of s.blocks) {
        if (b.type === "timeline") {
          for (const m of b.items)
            if (m.date && m.text.trim())
              out.push({ ...where, date: m.date, text: m.text.trim(), from: "Timeline", done: m.done, overdue: !m.done && m.date < today });
        } else if (b.type === "decision") {
          for (const r of b.rows)
            if (r.date && r.decision.trim())
              out.push({ ...where, date: r.date, from: "Decision Log", overdue: false, text: r.status === "Made" ? `Decided: ${r.decision.trim()}` : `Decision (${r.status.toLowerCase()}): ${r.decision.trim()}` });
        } else if (b.type === "approval") {
          for (const r of b.rows)
            if (r.date && r.item.trim())
              out.push({ ...where, date: r.date, from: "Approval Tracker", overdue: false, text: r.status === "Approved" ? `Approved: ${r.item.trim()}` : `Approval (${r.status.toLowerCase()}): ${r.item.trim()}` });
        }
      }
    }
  }
  return out.map((e, i) => ({ e, i })).sort((a, b) => a.e.date.localeCompare(b.e.date) || a.i - b.i).map((x) => x.e);
}

/** Days between two YYYY-MM-DD dates. */
export function daysBetween(a: string, b: string) {
  const d = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((d(b) - d(a)) / 86400000);
}

const name = (id: PhaseId) => PHASES.find((p) => p.id === id)?.name ?? id;

export function setPhaseTarget(p: Project, phase: PhaseId, date: string): Project {
  const before = p.targets[phase] ?? "";
  if (before === date || p.passed.includes(phase)) return p;
  const targets = { ...p.targets };
  if (date) targets[phase] = date;
  else delete targets[phase];
  return addLog({ ...p, targets }, date ? `Target for ${name(phase)} set to ${formatDate(date)}` : `Target for ${name(phase)} cleared`);
}

/** Repair saved targets: real dates for known phases only. */
export function normalizeTargets(raw: unknown): Partial<Record<PhaseId, string>> {
  const out: Partial<Record<PhaseId, string>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const ph of PHASES) {
    const v = (raw as Record<string, unknown>)[ph.id];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) out[ph.id] = v;
  }
  return out;
}
