"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Block, BlockType } from "@/content/blocks";
import { DEMO_ID, DEMO_PROJECT, type ActivityStatus, type Project, type ProjectStatus, type Section } from "@/content/demo";
import type { PhaseId } from "@/content/phases";
import { today } from "@/lib/format";
import * as P from "./project";
import * as W from "./workspace";

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
  /** Replace every project, from a backup file. */
  replaceWorkspace: (ws: W.Workspace) => void;
  /** Put the demo project back to its seeded state (adding it back if it was deleted). */
  resetDemo: () => void;
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
        updateProject(id, (p) => ({ ...p, name: name.trim() || p.name, blurb: blurb.trim() })),
      setProjectStatus: (id, status) => updateProject(id, (p) => ({ ...p, status })),
      replaceWorkspace: (next) => setWs(next),
      resetDemo: () =>
        setProjects((list) =>
          list.some((p) => p.id === DEMO_ID)
            ? list.map((p) => (p.id === DEMO_ID ? DEMO_PROJECT : p))
            : [DEMO_PROJECT, ...list],
        ),
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
};

const ProjectContext = createContext<ProjectValue | null>(null);

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
      pass: (phase) => update((p) => P.pass(p, phase, today())),
      passWithOverride: (phase, reason) => update((p) => P.passWithOverride(p, phase, reason, today())),
      reset: () => {
        if (project.isDemo) resetDemo();
      },
      addSection: (phase) => {
        const [, section] = W.addSection(project, phase);
        update((p) => ({ ...p, sections: { ...p.sections, [phase]: [...p.sections[phase], section] } }));
        return section;
      },
      renameSection: (phase, sectionId, title) => update((p) => W.renameSection(p, phase, sectionId, title)),
      moveSection: (phase, sectionId, delta) => update((p) => W.moveSection(p, phase, sectionId, delta)),
      deleteSection: (phase, sectionId) => update((p) => W.deleteSection(p, phase, sectionId)),
      addBlock: (phase, sectionId, type) => {
        const [, block] = W.addBlock(project, phase, sectionId, type);
        update((p) => W.insertBlock(p, phase, sectionId, block, Infinity));
        return block;
      },
      insertBlock: (phase, sectionId, block, index) => update((p) => W.insertBlock(p, phase, sectionId, block, index)),
      updateBlock: (phase, sectionId, blockId, fn) => update((p) => W.updateBlock(p, phase, sectionId, blockId, fn)),
      moveBlock: (phase, sectionId, blockId, to) => update((p) => W.moveBlock(p, phase, sectionId, blockId, to)),
      deleteBlock: (phase, sectionId, blockId) => update((p) => W.deleteBlock(p, phase, sectionId, blockId)),
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
