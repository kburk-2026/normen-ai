import { PHASES, type PhaseId } from "@/content/phases";
import { CHECKPOINTS } from "@/content/lifecycle";
import { DEMO_PROJECT, type Project } from "@/content/demo";

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

export function pass(project: Project, phase: PhaseId): Project {
  if (!canPass(project, phase)) return project;
  return { ...project, passed: [...project.passed, phase] };
}

export const MIN_REASON = 20;

export function passWithOverride(project: Project, phase: PhaseId, reason: string, today: string): Project {
  const trimmed = reason.trim();
  if (phaseState(project, phase) !== "current" || trimmed.length < MIN_REASON) return project;
  return {
    ...project,
    passed: [...project.passed, phase],
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

/** Fill in fields added after a project was saved, so older saves keep working. */
export function withDefaults(saved: Partial<Project>): Project {
  return {
    ...DEMO_PROJECT,
    ...saved,
    activities: saved.activities ?? DEMO_PROJECT.activities,
    checks: saved.checks ?? DEMO_PROJECT.checks,
    passed: saved.passed ?? DEMO_PROJECT.passed,
    overrides: saved.overrides ?? [],
  };
}
