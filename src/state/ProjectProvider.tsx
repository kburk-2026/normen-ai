"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_ID, DEMO_PROJECT, type ActivityStatus, type Project, type ProjectStatus, type Section } from "@/content/demo";
import type { PhaseId } from "@/content/phases";
import { today } from "@/lib/format";
import * as P from "./project";
import * as W from "./workspace";

// ---------- Workspace: every project, saved to localStorage ----------

type WorkspaceValue = {
  /** False until saved projects have been read from this browser. */
  loaded: boolean;
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

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(W.WORKSPACE_KEY, JSON.stringify(ws));
    } catch {
      // Storage full or blocked: changes last for this visit only.
    }
  }, [ws, loaded]);

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
    [loaded, ws, updateProject, setProjects],
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
