import { DEMO_PROJECT, allDefaultSections, type Project, type Section } from "@/content/demo";
import type { PhaseId } from "@/content/phases";
import { newBlock, type Block, type BlockType } from "@/content/blocks";
import { normalizeProject } from "./project";

/** Everything Normen stores in the browser. */
export type Workspace = { version: 2; projects: Project[] };

export const WORKSPACE_KEY = "normen:workspace:v2";
/** The single-project save from phase 1. Read once to migrate; never written or deleted. */
export const LEGACY_KEY = "normen:project:v1";

export const DEFAULT_WORKSPACE: Workspace = { version: 2, projects: [DEMO_PROJECT] };

export function newId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

/**
 * Build the workspace from whatever is in storage: a v2 workspace if there is
 * one, else the phase 1 single-project save as the demo, else the seed.
 */
export function loadWorkspace(v2: string | null, v1: string | null): Workspace {
  if (v2) {
    const parsed = parseWorkspace(v2);
    if (parsed) return parsed;
  }
  if (v1) {
    try {
      const legacy = normalizeProject(JSON.parse(v1) as Partial<Project>);
      return { version: 2, projects: [{ ...legacy, id: DEMO_PROJECT.id, isDemo: true }] };
    } catch {
      // Unreadable legacy save: fall through to the seed.
    }
  }
  return DEFAULT_WORKSPACE;
}

/** Parse and repair a workspace from storage or a backup file. Returns null if it is not one. */
export function parseWorkspace(text: string): Workspace | null {
  try {
    const data = JSON.parse(text) as Partial<Workspace>;
    if (!data || !Array.isArray(data.projects)) return null;
    const projects = data.projects.filter((p) => p && typeof p === "object").map((p) => normalizeProject(p));
    // Duplicate IDs would make two projects edit each other; give repeats a new ID.
    const seen = new Set<string>();
    for (const p of projects) {
      if (seen.has(p.id)) p.id = newId("p");
      seen.add(p.id);
    }
    return { version: 2, projects };
  } catch {
    return null;
  }
}

export function createProject(name: string, blurb: string, fromDemo: boolean): Project {
  const now = new Date().toISOString();
  const base: Project = fromDemo
    ? structuredClone(DEMO_PROJECT)
    : {
        ...DEMO_PROJECT,
        activities: {},
        checks: {},
        passed: [],
        passedAt: {},
        overrides: [],
        sections: allDefaultSections(now),
      };
  return {
    ...base,
    id: newId("p"),
    name: name.trim() || "Untitled project",
    blurb: blurb.trim(),
    status: fromDemo ? base.status : "Draft",
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateProject(project: Project): Project {
  const now = new Date().toISOString();
  return {
    ...structuredClone(project),
    id: newId("p"),
    name: `Copy of ${project.name}`,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ---- Sections. Overview and Checklist are fixed at the top; custom sections follow and can move. ----

export function addSection(project: Project, phase: PhaseId, title = "Untitled section"): [Project, Section] {
  const section: Section = { id: newId("s"), kind: "custom", title, blocks: [], updatedAt: new Date().toISOString() };
  return [{ ...project, sections: { ...project.sections, [phase]: [...project.sections[phase], section] } }, section];
}

export function renameSection(project: Project, phase: PhaseId, sectionId: string, title: string): Project {
  return mapSections(project, phase, (list) =>
    list.map((s) => (s.id === sectionId && s.kind === "custom" ? { ...s, title, updatedAt: new Date().toISOString() } : s)),
  );
}

export function moveSection(project: Project, phase: PhaseId, sectionId: string, delta: -1 | 1): Project {
  return mapSections(project, phase, (list) => {
    const i = list.findIndex((s) => s.id === sectionId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length || list[i].kind !== "custom" || list[j].kind !== "custom") return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

export function deleteSection(project: Project, phase: PhaseId, sectionId: string): Project {
  return mapSections(project, phase, (list) => list.filter((s) => !(s.id === sectionId && s.kind === "custom")));
}

// ---- Blocks. Every section except the Checklist holds blocks; each change stamps the section. ----

export function addBlock(project: Project, phase: PhaseId, sectionId: string, type: BlockType): [Project, Block] {
  const block = newBlock(type, newId("b"));
  return [mapBlocks(project, phase, sectionId, (list) => [...list, block]), block];
}

/** Put a block back at a position, e.g. to undo a delete. */
export function insertBlock(project: Project, phase: PhaseId, sectionId: string, block: Block, index: number): Project {
  return mapBlocks(project, phase, sectionId, (list) => {
    if (list.some((b) => b.id === block.id)) return list;
    const next = [...list];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, block);
    return next;
  });
}

export function updateBlock(
  project: Project,
  phase: PhaseId,
  sectionId: string,
  blockId: string,
  fn: (b: Block) => Block,
): Project {
  return mapBlocks(project, phase, sectionId, (list) => list.map((b) => (b.id === blockId ? fn(b) : b)));
}

/** Move a block to a new index (its index after the move). */
export function moveBlock(project: Project, phase: PhaseId, sectionId: string, blockId: string, to: number): Project {
  return mapBlocks(project, phase, sectionId, (list) => {
    const i = list.findIndex((b) => b.id === blockId);
    const j = Math.max(0, Math.min(to, list.length - 1));
    if (i < 0 || i === j) return list;
    const next = [...list];
    const [b] = next.splice(i, 1);
    next.splice(j, 0, b);
    return next;
  });
}

export function deleteBlock(project: Project, phase: PhaseId, sectionId: string, blockId: string): Project {
  return mapBlocks(project, phase, sectionId, (list) => list.filter((b) => b.id !== blockId));
}

function mapBlocks(project: Project, phase: PhaseId, sectionId: string, fn: (list: Block[]) => Block[]): Project {
  const list = project.sections[phase];
  const s = list.find((x) => x.id === sectionId);
  if (!s || s.kind === "checklist") return project;
  const blocks = fn(s.blocks);
  if (blocks === s.blocks) return project;
  return mapSections(project, phase, (l) =>
    l.map((x) => (x.id === sectionId ? { ...x, blocks, updatedAt: new Date().toISOString() } : x)),
  );
}

function mapSections(project: Project, phase: PhaseId, fn: (list: Section[]) => Section[]): Project {
  return { ...project, sections: { ...project.sections, [phase]: fn(project.sections[phase]) } };
}

/** The first phase not yet passed, or the last phase when everything is passed. */
export function currentPhaseIndex(project: Project, phaseIds: PhaseId[]) {
  const i = phaseIds.findIndex((id) => !project.passed.includes(id));
  return i === -1 ? phaseIds.length - 1 : i;
}
