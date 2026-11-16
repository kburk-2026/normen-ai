import { PHASES, type PhaseId } from "@/content/phases";
import { CHECKPOINTS } from "@/content/lifecycle";
import { DEMO_ADDED_PAGES, DEMO_PROJECT, DEMO_VERSION, OLD_SEED_TIME, SEED_TIME, allDefaultSections, PROJECT_STATUSES, type Project } from "@/content/demo";
import { normalizeBlocks } from "@/content/blocks";
import { FIT_BANDS } from "@/content/fitCheck";
import type { FitResult } from "@/content/demo";
import { LOG_LIMIT, backfillLog } from "./log";
import { normalizeScorecard } from "./scorecard";
import { normalizePulse } from "./pulse";
import { normalizeGuardrailPlan } from "./guardrails";
import { normalizeRoi } from "@/lib/roi";

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
/** Saves from before milestone 8 stamp seeded data at midnight UTC, which reads as 3 Nov in the Americas. */
function fromOldSeed(at: string | undefined) {
  return at === OLD_SEED_TIME ? SEED_TIME : at;
}

/** A saved changelog, cleaned up; or, for a save from before changelogs, one built from what it records. */
function normalizeLog(saved: Partial<Project>, base: Project | undefined): Project["log"] {
  if (Array.isArray(saved.log)) {
    return saved.log
      .filter((e) => e && typeof e.at === "string" && typeof e.text === "string")
      .map((e) => ({ at: e.at, text: e.text, ...(typeof e.key === "string" ? { key: e.key } : {}) }))
      .slice(0, LOG_LIMIT);
  }
  if (base) return base.log;
  return backfillLog({
    createdAt: saved.createdAt ?? new Date().toISOString(),
    passed: saved.passed ?? [],
    passedAt: saved.passedAt ?? {},
    overrides: saved.overrides ?? [],
  });
}

/** The saved Fit Check result if it is well formed. A demo from before version 4 gets the seeded one. */
function fitCheckOf(saved: Partial<Project>, isDemo: boolean): { fitCheck?: FitResult } {
  const f = saved.fitCheck;
  if (f && typeof f.score === "number" && f.band in FIT_BANDS && /^\d{4}-\d{2}-\d{2}$/.test(f.at)) {
    return { fitCheck: { score: Math.max(0, Math.min(100, Math.round(f.score))), band: f.band, capped: f.capped === true, at: f.at } };
  }
  return isDemo && (saved.demoVersion ?? 0) < 4 && DEMO_PROJECT.fitCheck ? { fitCheck: DEMO_PROJECT.fitCheck } : {};
}

export function normalizeProject(saved: Partial<Project>): Project {
  const base = saved.id ? undefined : DEMO_PROJECT;
  // A save with no ID is the phase 1 demo: it gets the demo's written pages.
  const sections = { ...(base?.sections ?? allDefaultSections()), ...(saved.sections ?? {}) };
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
    ].map((x) => {
      // Demo pages saved before blocks existed, and never edited, get the demo's written content.
      const seeded = DEMO_PROJECT.sections[phase.id].find((d) => d.id === x.id);
      const untouched = (saved.isDemo || !saved.id) && seeded && !x.blocks?.length && [seeded.updatedAt, OLD_SEED_TIME].includes(x.updatedAt);
      return {
        ...x,
        blocks: normalizeBlocks(untouched ? seeded.blocks : x.blocks),
        updatedAt: fromOldSeed(x.updatedAt) ?? new Date().toISOString(),
      };
    });
  }
  // A saved demo from before a demo page existed gets that page now. Once it is at the
  // current version, a page the user deletes is not brought back.
  const isDemo = saved.isDemo ?? !saved.id;
  if (isDemo) {
    for (const page of DEMO_ADDED_PAGES) {
      if (page.since <= (saved.demoVersion ?? 0) || sections[page.phase].some((x) => x.id === page.sectionId)) continue;
      const seeded = DEMO_PROJECT.sections[page.phase].find((x) => x.id === page.sectionId);
      if (seeded) sections[page.phase] = [...sections[page.phase], seeded];
    }
  }
  return {
    id: saved.id ?? DEMO_PROJECT.id,
    name: saved.name ?? base?.name ?? "Untitled project",
    blurb: saved.blurb ?? base?.blurb ?? "",
    status: PROJECT_STATUSES.includes(saved.status as never)
      ? (saved.status as Project["status"])
      : (base?.status ?? "Draft"),
    isDemo,
    ...(isDemo ? { demoVersion: DEMO_VERSION } : {}),
    createdAt: saved.createdAt ?? base?.createdAt ?? new Date().toISOString(),
    updatedAt: fromOldSeed(saved.updatedAt) ?? base?.updatedAt ?? new Date().toISOString(),
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
    log: normalizeLog(saved, base),
    ...fitCheckOf(saved, isDemo),
    // A demo from before version 5 has no Scorecard yet: give it the seeded one.
    scorecard:
      saved.scorecard === undefined && isDemo && (saved.demoVersion ?? 0) < 5
        ? DEMO_PROJECT.scorecard
        : normalizeScorecard(saved.scorecard),
    pulse: normalizePulse(saved.pulse),
    // A demo from before version 6 has no guardrail plan yet: give it the seeded one.
    guardrails:
      saved.guardrails === undefined && isDemo && (saved.demoVersion ?? 0) < 6
        ? DEMO_PROJECT.guardrails
        : normalizeGuardrailPlan(saved.guardrails),
    // A demo from before version 7 has no ROI model yet: give it the seeded one.
    roi: saved.roi === undefined && isDemo && (saved.demoVersion ?? 0) < 7 ? DEMO_PROJECT.roi : normalizeRoi(saved.roi),
  };
}
