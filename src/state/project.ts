import { PHASES, type PhaseId } from "@/content/phases";
import { CHECKPOINTS } from "@/content/lifecycle";
import { DEMO_PROJECT, allDefaultSections, PROJECT_STATUSES, type Project } from "@/content/demo";

export type PhaseState = "passed" | "current" | "locked";

/** Passed if its checkpoint is passed; current if every earlier phase is passed; otherwise locked. */
export function phaseState(project: Project, phase: PhaseId): PhaseState {
  if (project.passed.includes(phase)) return "passed";
  const index = PHASES.findIndex((p) => p.id === phase);
  return PHASES.slice(0, index).every((p) => project.passed.includes(p.id)) ? "current" : "locked";
}

export function openCriteria(project: Project, phase: PhaseId): string[] {
  return CHECKPOINTS.filter((c) => c.phase === phase && !project.checks[c.id]).map((c) => c.id);
}

export function overrideFor(project: Project, phase: PhaseId) {
  return project.overrides.find((o) => o.phase === phase);
}

/** Passing normally needs every criterion met; only the current phase can be passed. */
export function canPass(project: Project, phase: PhaseId): boolean {
  return phaseState(project, phase) === "current" && openCriteria(project, phase).length === 0;
}

export function pass(project: Project, phase: PhaseId, today: string): Project {
  if (!canPass(project, phase)) return project;
  return { ...project, passed: [...project.passed, phase], passedAt: { ...project.passedAt, [phase]: today } };
}

export const MIN_REASON = 20;

export function passWithOverride(project: Project, phase: PhaseId, reason: string, today: string): Project {
  const trimmed = reason.trim();
  if (phaseState(project, phase) !== "current" || trimmed.length < MIN_REASON) return project;
  return {
    ...project,
    passed: [...project.passed, phase],
    passedAt: { ...project.passedAt, [phase]: today },
    overrides: [
      ...project.overrides.filter((o) => o.phase !== phase),
      { phase, reason: trimmed, at: today, openCriteria: openCriteria(project, phase) },
    ],
  };
}

/** Criteria can be ticked in the current phase and in passed phases (to close out an override), never in locked ones. */
export function toggleCheck(project: Project, criterionId: string): Project {
  const c = CHECKPOINTS.find((x) => x.id === criterionId);
  if (!c || phaseState(project, c.phase) === "locked") return project;
  return { ...project, checks: { ...project.checks, [criterionId]: !project.checks[criterionId] } };
}

/**
 * Fill in fields added after a project was saved, so older saves and backups
 * keep working. Anything missing falls back to an empty project, except that a
 * save with no ID is the original single demo project.
 */
export function normalizeProject(saved: Partial<Project>): Project {
  const sections = { ...allDefaultSections(), ...(saved.sections ?? {}) };
  for (const phase of PHASES) {
    // Every phase keeps its Overview and Checklist, whatever a backup says.
    const list = sections[phase.id] ?? [];
    const hasOverview = list.some((x) => x.kind === "overview");
    const hasChecklist = list.some((x) => x.kind === "checklist");
    const defaults = allDefaultSections()[phase.id];
    sections[phase.id] = [
      ...(hasOverview ? [] : [defaults[0]]),
      ...(hasChecklist ? [] : [defaults[1]]),
      ...list,
    ];
  }
  const base = saved.id ? undefined : DEMO_PROJECT;
  return {
    id: saved.id ?? DEMO_PROJECT.id,
    name: saved.name ?? base?.name ?? "Untitled project",
    blurb: saved.blurb ?? base?.blurb ?? "",
    status: PROJECT_STATUSES.includes(saved.status as never)
      ? (saved.status as Project["status"])
      : (base?.status ?? "Draft"),
    isDemo: saved.isDemo ?? !saved.id,
    createdAt: saved.createdAt ?? base?.createdAt ?? new Date().toISOString(),
    updatedAt: saved.updatedAt ?? base?.updatedAt ?? new Date().toISOString(),
    activities: saved.activities ?? {},
    checks: saved.checks ?? {},
    passed: saved.passed ?? [],
    // The original demo save had no pass dates: keep the seeded ones for phases it had passed.
    passedAt:
      saved.passedAt ??
      Object.fromEntries(
        Object.entries(base?.passedAt ?? {}).filter(([phase]) => (saved.passed ?? []).includes(phase as PhaseId)),
      ),
    overrides: saved.overrides ?? [],
    sections,
  };
}
