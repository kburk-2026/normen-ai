"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Block, BlockType } from "@/content/blocks";
import type { Reading } from "@/content/scorecard";
import type { AlertLines, CheckIn, Incident } from "@/content/pulse";
import type { GuardrailStatus } from "@/content/riskTier";
import type { RoiModel } from "@/content/roi";
import { CASE_STUDY_ID, CASE_STUDY_PROJECT } from "@/content/caseStudy";
import { DEMO_ID, DEMO_PROJECT, type ActivityStatus, type FitResult, type Project, type ProjectStatus, type Section } from "@/content/demo";
import { FIT_BANDS } from "@/content/fitCheck";
import type { PhaseId } from "@/content/phases";
import { today } from "@/lib/format";
import * as P from "./project";
import * as W from "./workspace";
import * as S from "./scorecard";
import * as PL from "./pulse";
import * as G from "./guardrails";
import * as T from "./timeline";
import { addLog, logEdit, phaseName } from "./log";

// ---------- Workspace: every project, saved to localStorage ----------

export type SaveState = "saved" | "saving" | "error";
/** How long to wait after the last change before writing to storage. */
const SAVE_DELAY_MS = 500;

type WorkspaceValue = {
  /** False until saved projects have been read from this browser. */
  loaded: boolean;
  /** "saving" while a change waits to be written; "error" when the browser refused to store it. */
  saveState: SaveState;
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, fn: (p: Project) => Project) => void;
  createProject: (name: string, blurb: string, fromDemo: boolean) => Project;
  duplicateProject: (id: string) => Project | undefined;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string, blurb: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  /** Save a Fit Check result to a project, replacing any earlier one. */
  saveFitCheck: (id: string, result: FitResult) => void;
  /** Replace every project, from a backup file. */
  replaceWorkspace: (ws: W.Workspace) => void;
  /** Put a sample project (the demo by default, or the case study) back to its seeded state, adding it back if it was deleted. */
  resetDemo: (id?: string) => void;
  workspace: W.Workspace;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/**
 * Holds all projects. Starts from the seed so the server and client render the
 * same thing, then loads this browser's saved workspace after mount (migrating
 * the phase 1 single-project save the first time).
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<W.Workspace>(W.DEFAULT_WORKSPACE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setWs(W.loadWorkspace(localStorage.getItem(W.WORKSPACE_KEY), localStorage.getItem(W.LEGACY_KEY)));
    } catch {
      // Blocked storage: keep the seed.
    }
    setLoaded(true);
  }, []);

  // Save shortly after changes stop, so typing does not write on every key.
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const pending = useRef<W.Workspace | null>(null);
  const flush = useCallback(() => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    try {
      localStorage.setItem(W.WORKSPACE_KEY, JSON.stringify(next));
      setSaveState("saved");
    } catch {
      // Storage full or blocked: changes last for this visit only, and the page says so.
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    pending.current = ws;
    setSaveState((s) => (s === "error" ? s : "saving"));
    const t = window.setTimeout(flush, SAVE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [ws, loaded, flush]);

  // Write anything still waiting when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const setProjects = useCallback((fn: (list: Project[]) => Project[]) => {
    setWs((w) => ({ ...w, projects: fn(w.projects) }));
  }, []);

  const updateProject = useCallback(
    (id: string, fn: (p: Project) => Project) =>
      setProjects((list) =>
        list.map((p) => {
          if (p.id !== id) return p;
          const next = fn(p);
          return next === p ? p : { ...next, updatedAt: new Date().toISOString() };
        }),
      ),
    [setProjects],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      loaded,
      saveState,
      projects: ws.projects,
      workspace: ws,
      getProject: (id) => ws.projects.find((p) => p.id === id),
      updateProject,
      createProject: (name, blurb, fromDemo) => {
        const p = W.createProject(name, blurb, fromDemo);
        setProjects((list) => [...list, p]);
        return p;
      },
      duplicateProject: (id) => {
        const src = ws.projects.find((p) => p.id === id);
        if (!src) return undefined;
        const copy = W.duplicateProject(src);
        setProjects((list) => [...list, copy]);
        return copy;
      },
      deleteProject: (id) => setProjects((list) => list.filter((p) => p.id !== id)),
      renameProject: (id, name, blurb) =>
        updateProject(id, (p) => {
          const next = { ...p, name: name.trim() || p.name, blurb: blurb.trim() };
          return next.name === p.name ? next : addLog(next, `Project renamed: ${p.name} to ${next.name}`);
        }),
      setProjectStatus: (id, status) =>
        updateProject(id, (p) => (p.status === status ? p : addLog({ ...p, status }, `Status changed: ${p.status} to ${status}`))),
      saveFitCheck: (id, result) =>
        updateProject(id, (p) =>
          addLog({ ...p, fitCheck: result }, `Fit Check saved: ${result.score} out of 100 (${FIT_BANDS[result.band].title})`),
        ),
      replaceWorkspace: (next) => setWs(next),
      resetDemo: (id = DEMO_ID) => {
        const seed = id === CASE_STUDY_ID ? CASE_STUDY_PROJECT : DEMO_PROJECT;
        setProjects((list) =>
          list.some((p) => p.id === seed.id) ? list.map((p) => (p.id === seed.id ? seed : p)) : [seed, ...list],
        );
      },
    }),
    [loaded, saveState, ws, updateProject, setProjects],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

// ---------- One project: what the Workbench components work with ----------

type ProjectValue = {
  project: Project;
  statusOf: (activityId: string) => ActivityStatus;
  setStatus: (activityId: string, status: ActivityStatus) => void;
  toggleCheck: (criterionId: string) => void;
  pass: (phase: PhaseId) => void;
  passWithOverride: (phase: PhaseId, reason: string) => void;
  /** Only meaningful for the demo project. */
  reset: () => void;
  addSection: (phase: PhaseId) => Section;
  renameSection: (phase: PhaseId, sectionId: string, title: string) => void;
  moveSection: (phase: PhaseId, sectionId: string, delta: -1 | 1) => void;
  deleteSection: (phase: PhaseId, sectionId: string) => void;
  addBlock: (phase: PhaseId, sectionId: string, type: BlockType) => Block;
  insertBlock: (phase: PhaseId, sectionId: string, block: Block, index: number) => void;
  updateBlock: (phase: PhaseId, sectionId: string, blockId: string, fn: (b: Block) => Block) => void;
  moveBlock: (phase: PhaseId, sectionId: string, blockId: string, to: number) => void;
  deleteBlock: (phase: PhaseId, sectionId: string, blockId: string) => void;
  setTarget: (metricId: string, target: string) => void;
  addReading: (metricId: string, reading: Omit<Reading, "id">) => void;
  /** Returns the removed reading, for Undo. */
  deleteReading: (metricId: string, readingId: string) => Reading | undefined;
  restoreReading: (metricId: string, reading: Reading) => void;
  addCustomMetric: (phase: PhaseId, metric: string, measure: string) => void;
  /** Returns what Undo needs. */
  removeCustomMetric: (metricId: string) => S.RemovedMetric | null;
  restoreCustomMetric: (saved: S.RemovedMetric) => void;
  saveCheckIn: (c: Omit<CheckIn, "id">) => void;
  deleteCheckIn: (id: string) => CheckIn | undefined;
  restoreCheckIn: (c: CheckIn) => void;
  setAlerts: (alerts: AlertLines) => void;
  reportIncident: (i: Omit<Incident, "id" | "number">) => void;
  updateIncident: (id: string, patch: Partial<Omit<Incident, "id" | "number">>) => void;
  deleteIncident: (id: string) => { incident: Incident; index: number } | undefined;
  restoreIncident: (saved: { incident: Incident; index: number }) => void;
  setTierAnswer: (questionId: string, answer: number) => void;
  setGuardrailStatus: (id: string, status: GuardrailStatus) => void;
  setGuardrailReason: (id: string, reason: string) => void;
  /** Replace the project's ROI model. Edits write one changelog line a day. */
  setRoi: (roi: RoiModel) => void;
  /** Set or clear ("") a target end date for a phase not yet passed. */
  setPhaseTarget: (phase: PhaseId, date: string) => void;
};

const ProjectContext = createContext<ProjectValue | null>(null);

/** Add a changelog line, but only if the rule actually changed the project. */
const logged = (before: Project, after: Project, text: string) => (after === before ? after : addLog(after, text));
/** A block change: one "Edited" line for that section today. */
const edited = (before: Project, after: Project, phase: PhaseId, sectionId: string) =>
  after === before ? after : logEdit(after, phase, sectionId, today());

/** Binds the Workbench components to one project from the workspace. */
export function ProjectScope({ project, children }: { project: Project; children: React.ReactNode }) {
  const { updateProject, resetDemo } = useWorkspace();
  const id = project.id;
  const update = useCallback((fn: (p: Project) => Project) => updateProject(id, fn), [updateProject, id]);

  const value = useMemo<ProjectValue>(
    () => ({
      project,
      statusOf: (activityId) => project.activities[activityId] ?? "todo",
      setStatus: (activityId, status) =>
        update((p) => ({ ...p, activities: { ...p.activities, [activityId]: status } })),
      toggleCheck: (criterionId) => update((p) => P.toggleCheck(p, criterionId)),
      pass: (phase) => update((p) => logged(p, P.pass(p, phase, today()), `${phaseName(phase)} checkpoint passed`)),
      passWithOverride: (phase, reason) =>
        update((p) =>
          logged(p, P.passWithOverride(p, phase, reason, today()), `${phaseName(phase)} checkpoint passed with an override`),
        ),
      reset: () => {
        if (project.isDemo || project.caseStudy) resetDemo(project.id);
      },
      addSection: (phase) => {
        const [, section] = W.addSection(project, phase);
        update((p) =>
          addLog(
            { ...p, sections: { ...p.sections, [phase]: [...p.sections[phase], section] } },
            `Section added in ${phaseName(phase)}: ${section.title}`,
          ),
        );
        return section;
      },
      renameSection: (phase, sectionId, title) =>
        update((p) => {
          const before = p.sections[phase].find((x) => x.id === sectionId)?.title;
          return logged(p, W.renameSection(p, phase, sectionId, title), `Section renamed in ${phaseName(phase)}: ${before} to ${title}`);
        }),
      moveSection: (phase, sectionId, delta) => update((p) => W.moveSection(p, phase, sectionId, delta)),
      deleteSection: (phase, sectionId) =>
        update((p) => {
          const before = p.sections[phase].find((x) => x.id === sectionId)?.title || "Untitled section";
          return logged(p, W.deleteSection(p, phase, sectionId), `Section deleted in ${phaseName(phase)}: ${before}`);
        }),
      addBlock: (phase, sectionId, type) => {
        const [, block] = W.addBlock(project, phase, sectionId, type);
        update((p) => edited(p, W.insertBlock(p, phase, sectionId, block, Infinity), phase, sectionId));
        return block;
      },
      insertBlock: (phase, sectionId, block, index) =>
        update((p) => edited(p, W.insertBlock(p, phase, sectionId, block, index), phase, sectionId)),
      updateBlock: (phase, sectionId, blockId, fn) =>
        update((p) => edited(p, W.updateBlock(p, phase, sectionId, blockId, fn), phase, sectionId)),
      moveBlock: (phase, sectionId, blockId, to) =>
        update((p) => edited(p, W.moveBlock(p, phase, sectionId, blockId, to), phase, sectionId)),
      deleteBlock: (phase, sectionId, blockId) =>
        update((p) => edited(p, W.deleteBlock(p, phase, sectionId, blockId), phase, sectionId)),
      setTarget: (metricId, target) => update((p) => S.setTarget(p, metricId, target, today())),
      addReading: (metricId, reading) => update((p) => S.addReading(p, metricId, { ...reading, id: W.newId("rd") })),
      deleteReading: (metricId, readingId) => {
        const gone = S.recordOf(project.scorecard, metricId).readings.find((r) => r.id === readingId);
        update((p) => S.deleteReading(p, metricId, readingId));
        return gone;
      },
      restoreReading: (metricId, reading) => update((p) => S.restoreReading(p, metricId, reading)),
      addCustomMetric: (phase, metric, measure) =>
        update((p) => S.addCustomMetric(p, { id: W.newId("m"), phase, metric: metric.trim(), measure: measure.trim() })),
      removeCustomMetric: (metricId) => {
        const [, saved] = S.removeCustomMetric(project, metricId);
        update((p) => S.removeCustomMetric(p, metricId)[0]);
        return saved;
      },
      restoreCustomMetric: (saved) => update((p) => S.restoreCustomMetric(p, saved)),
      saveCheckIn: (c) => update((p) => PL.saveCheckIn(p, { ...c, id: W.newId("ci") })),
      deleteCheckIn: (id) => {
        const [, gone] = PL.deleteCheckIn(project, id);
        update((p) => PL.deleteCheckIn(p, id)[0]);
        return gone;
      },
      restoreCheckIn: (c) => update((p) => PL.restoreCheckIn(p, c)),
      setAlerts: (alerts) => update((p) => PL.setAlerts(p, alerts, today())),
      reportIncident: (i) => update((p) => PL.reportIncident(p, { ...i, id: W.newId("inc") })),
      updateIncident: (id, patch) => update((p) => PL.updateIncident(p, id, patch, today())),
      deleteIncident: (id) => {
        const [, saved] = PL.deleteIncident(project, id);
        update((p) => PL.deleteIncident(p, id)[0]);
        return saved;
      },
      restoreIncident: (saved) => update((p) => PL.restoreIncident(p, saved)),
      setTierAnswer: (questionId, answer) => update((p) => G.setAnswer(p, questionId, answer, today())),
      setGuardrailStatus: (id, status) => update((p) => G.setGuardrailStatus(p, id, status)),
      setGuardrailReason: (id, reason) => update((p) => G.setGuardrailReason(p, id, reason, today())),
      setRoi: (roi) => update((p) => addLog({ ...p, roi }, "ROI model edited", `roi:${today()}`)),
      setPhaseTarget: (phase, date) => update((p) => T.setPhaseTarget(p, phase, date)),
    }),
    [project, update, resetDemo],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectScope");
  return ctx;
}
