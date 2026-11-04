"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEMO_PROJECT, type ActivityStatus, type Project } from "@/content/demo";

const STORAGE_KEY = "normen:project:v1";

type ProjectContextValue = {
  project: Project;
  statusOf: (activityId: string) => ActivityStatus;
  setStatus: (activityId: string, status: ActivityStatus) => void;
  reset: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

/**
 * Holds the one project the app works on. Starts from the seeded demo so the
 * server and client render the same thing, then loads saved progress from
 * localStorage after mount.
 */
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(DEMO_PROJECT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProject(JSON.parse(saved) as Project);
    } catch {
      // Unreadable or blocked storage: keep the demo.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Storage full or blocked: progress lasts for this visit only.
    }
  }, [project, loaded]);

  const statusOf = useCallback(
    (activityId: string) => project.activities[activityId] ?? "todo",
    [project],
  );

  const setStatus = useCallback((activityId: string, status: ActivityStatus) => {
    setProject((p) => ({ ...p, activities: { ...p.activities, [activityId]: status } }));
  }, []);

  const reset = useCallback(() => setProject(DEMO_PROJECT), []);

  return (
    <ProjectContext.Provider value={{ project, statusOf, setStatus, reset }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectProvider");
  return ctx;
}
