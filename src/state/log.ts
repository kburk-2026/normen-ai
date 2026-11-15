import { PHASES, type PhaseId } from "@/content/phases";
import type { LogEntry, Project } from "@/content/demo";
import { localDay } from "@/lib/format";

/** The changelog keeps the latest entries only. */
export const LOG_LIMIT = 300;

export const phaseName = (id: PhaseId) => PHASES.find((p) => p.id === id)?.name ?? id;

/**
 * Record something that happened to a project, newest first. With a `key`,
 * the entry is written once: a second call with the same key changes nothing.
 */
export function addLog(project: Project, text: string, key?: string, at = new Date().toISOString()): Project {
  if (key && project.log.some((e) => e.key === key)) return project;
  return { ...project, log: [{ at, text, ...(key ? { key } : {}) }, ...project.log].slice(0, LOG_LIMIT) };
}

/** One "Edited" line per section per day, however much is typed. */
export function logEdit(project: Project, phase: PhaseId, sectionId: string, day: string): Project {
  const section = project.sections[phase].find((s) => s.id === sectionId);
  if (!section) return project;
  return addLog(project, `Edited: ${phaseName(phase)}, ${section.title || "Untitled section"}`, `edit:${sectionId}:${day}`);
}

/** Seeded dates are stamped at midnight UTC, which is the day before in the Americas. Read them as noon. */
const atNoon = (iso: string) => iso.replace("T00:00:00.000Z", "T12:00:00.000Z");

/**
 * The changelog for a project saved before changelogs existed: only what the
 * save already records (when it was created, and each checkpoint pass).
 */
export function backfillLog(p: Pick<Project, "createdAt" | "passed" | "passedAt" | "overrides">): LogEntry[] {
  const entries: LogEntry[] = [{ at: atNoon(p.createdAt), text: "Project created" }];
  for (const phase of p.passed) {
    const day = p.passedAt[phase];
    if (!day) continue;
    const override = p.overrides.some((o) => o.phase === phase);
    entries.push({ at: `${day}T12:00:00.000Z`, text: `${phaseName(phase)} checkpoint passed${override ? " with an override" : ""}` });
  }
  return entries.sort((a, b) => b.at.localeCompare(a.at));
}

/** Entries grouped by the day they happened, in the reader's time zone, newest first. */
export function logByDay(log: LogEntry[]): { day: string; entries: LogEntry[] }[] {
  const days: { day: string; entries: LogEntry[] }[] = [];
  for (const e of log) {
    const day = localDay(e.at);
    const last = days[days.length - 1];
    if (last?.day === day) last.entries.push(e);
    else days.push({ day, entries: [e] });
  }
  return days;
}
