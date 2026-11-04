"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconChevronDown,
  IconChevronRight,
  IconLayoutKanban,
  IconLayoutList,
  IconListCheck,
  IconLock,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Mascot from "@/components/Mascot";
import Dialog, { primaryButton, quietButton } from "@/components/ui/Dialog";
import Workbench from "@/components/workbench/Workbench";
import { PHASES, type PhaseId } from "@/content/phases";
import { PROJECT_STATUSES, type Section } from "@/content/demo";
import { ProjectScope, useProject, useWorkspace } from "@/state/ProjectProvider";
import { phaseState } from "@/state/project";
import SectionView from "./SectionView";

type Route =
  { kind: "list" } | { kind: "board" } | { kind: "section"; phase: PhaseId; sectionId: string } | { kind: "bad" };

function parseRoute(path: string[]): Route {
  if (path.length === 0) return { kind: "list" };
  if (path.length === 1 && path[0] === "board") return { kind: "board" };
  if (path.length === 2 && PHASES.some((p) => p.id === path[0])) {
    return { kind: "section", phase: path[0] as PhaseId, sectionId: path[1] };
  }
  return { kind: "bad" };
}

export default function ProjectShell({ id, path }: { id: string; path: string[] }) {
  const { loaded, getProject } = useWorkspace();
  const project = getProject(id);

  useEffect(() => {
    if (project) document.title = `${project.name} · Normen AI`;
  }, [project]);

  if (!loaded) return <p className="mx-auto max-w-6xl px-5 py-12 text-sm text-faint">Loading your project…</p>;
  if (!project) return <NotFound what="project" />;

  return (
    <ProjectScope project={project}>
      <Shell route={parseRoute(path)} />
    </ProjectScope>
  );
}

function NotFound({ what }: { what: "project" | "page" }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex max-w-xl items-start gap-4 rounded-2xl border border-dashed border-line p-5">
        <Mascot mood="think" size={48} />
        <div className="text-sm">
          <p>
            {what === "project"
              ? "There is no project here. It may have been deleted, or saved in a different browser."
              : "This page does not exist in this project."}
          </p>
          <Link href="/workbench" className="mt-3 inline-block text-orange hover:text-orange-soft">
            All projects
          </Link>
        </div>
      </div>
    </section>
  );
}

function Shell({ route }: { route: Route }) {
  const { project } = useProject();
  const section =
    route.kind === "section" ? project.sections[route.phase].find((s) => s.id === route.sectionId) : undefined;

  return (
    <div className="mx-auto grid max-w-7xl gap-0 px-5 py-8 md:grid-cols-[260px_1fr] md:gap-8">
      <Sidebar route={route} />
      <div className="min-w-0 pt-6 md:pt-0">
        {route.kind === "list" && <Workbench view="list" />}
        {route.kind === "board" && <Workbench view="board" />}
        {route.kind === "section" &&
          (section ? <SectionView phase={route.phase} section={section} /> : <NotFound what="page" />)}
        {route.kind === "bad" && <NotFound what="page" />}
      </div>
    </div>
  );
}

function Sidebar({ route }: { route: Route }) {
  const { project, addSection } = useProject();
  const { setProjectStatus } = useWorkspace();
  const router = useRouter();
  const activePhase = route.kind === "section" ? route.phase : undefined;
  const [open, setOpen] = useState<Set<PhaseId>>(() => new Set(activePhase ? [activePhase] : []));
  const [deleting, setDeleting] = useState<{ phase: PhaseId; section: Section }>();
  // On small screens the sidebar folds away behind a button, so pages are not pushed below it.
  const [menuOpen, setMenuOpen] = useState(false);
  const routeKey = route.kind === "section" ? route.sectionId : route.kind;
  useEffect(() => setMenuOpen(false), [routeKey]);

  // Opening a section from elsewhere (a link, Add section) expands its phase.
  useEffect(() => {
    if (activePhase) setOpen((s) => (s.has(activePhase) ? s : new Set(s).add(activePhase)));
  }, [activePhase]);

  const toggle = (id: PhaseId) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const base = `/workbench/${project.id}`;
  const navLink = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-canvas text-ink" : "text-muted hover:text-ink"}`;

  return (
    <aside className="text-sm print:hidden md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="project-sidebar"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3 md:hidden"
      >
        <span className="truncate font-medium">{project.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-muted">
          Project menu {menuOpen ? <IconChevronDown size={14} aria-hidden /> : <IconChevronRight size={14} aria-hidden />}
        </span>
      </button>
      <div id="project-sidebar" className={`${menuOpen ? "mt-2 block" : "hidden"} rounded-2xl bg-surface p-4 md:mt-0 md:block`}>
        <Link href="/workbench" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <IconArrowLeft size={16} aria-hidden /> All projects
        </Link>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-faint">
          {project.isDemo ? "Demo project" : "Project"}
        </p>
        <p className="font-display text-lg font-medium leading-tight">{project.name}</p>
        <label className="mt-2 block">
          <span className="sr-only">Project status</span>
          <select
            value={project.status}
            onChange={(e) => setProjectStatus(project.id, e.target.value as (typeof PROJECT_STATUSES)[number])}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-ink focus:border-orange focus:outline-none"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <nav aria-label="Project" className="mt-4">
          <ul className="space-y-0.5">
            <li>
              <Link
                href={base}
                aria-current={route.kind === "list" ? "page" : undefined}
                className={navLink(route.kind === "list")}
              >
                <IconLayoutList size={16} aria-hidden /> All phases
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/board`}
                aria-current={route.kind === "board" ? "page" : undefined}
                className={navLink(route.kind === "board")}
              >
                <IconLayoutKanban size={16} aria-hidden /> Board
              </Link>
            </li>
          </ul>

          <p className="mt-4 px-2 font-mono text-[11px] uppercase tracking-wide text-faint">Phases</p>
          <ul className="mt-1 space-y-0.5">
            {PHASES.map((p) => {
              const state = phaseState(project, p.id);
              const expanded = open.has(p.id);
              const listId = `sections-${p.id}`;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={listId}
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:text-ink ${
                      activePhase === p.id ? "text-ink" : state === "locked" ? "text-faint" : "text-muted"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        state === "passed" ? "bg-orange" : state === "current" ? "bg-steel-soft" : "bg-line"
                      }`}
                    />
                    <span className="flex-1 font-medium">
                      {p.name}
                      <span className="sr-only">
                        , {state === "passed" ? "checkpoint passed" : state === "current" ? "in progress" : "locked"}
                      </span>
                    </span>
                    {state === "locked" && <IconLock size={13} aria-hidden />}
                    {expanded ? <IconChevronDown size={14} aria-hidden /> : <IconChevronRight size={14} aria-hidden />}
                  </button>
                  {expanded && (
                    <ul id={listId} className="mb-1 ml-4 space-y-0.5 border-l border-line pl-2">
                      {project.sections[p.id].map((s, i, list) => (
                        <SectionLink
                          key={s.id}
                          section={s}
                          href={`${base}/${p.id}/${s.id}`}
                          active={route.kind === "section" && route.sectionId === s.id}
                          canUp={s.kind === "custom" && list[i - 1]?.kind === "custom"}
                          canDown={s.kind === "custom" && i < list.length - 1}
                          phase={p.id}
                          onDelete={() => setDeleting({ phase: p.id, section: s })}
                        />
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            const s = addSection(p.id);
                            router.push(`${base}/${p.id}/${s.id}?new=1`);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-faint transition-colors hover:text-ink"
                        >
                          <IconPlus size={14} aria-hidden /> Add section
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <DeleteSectionDialog
        target={deleting}
        onClose={() => setDeleting(undefined)}
        onDeleted={(phase) => {
          if (route.kind === "section" && route.sectionId === deleting?.section.id)
            router.push(`${base}/${phase}/${phase}-overview`);
        }}
      />
    </aside>
  );
}

function SectionLink({
  section: s,
  href,
  active,
  canUp,
  canDown,
  phase,
  onDelete,
}: {
  section: Section;
  href: string;
  active: boolean;
  canUp: boolean;
  canDown: boolean;
  phase: PhaseId;
  onDelete: () => void;
}) {
  const { moveSection } = useProject();
  const tool = "rounded p-0.5 text-faint hover:bg-surface hover:text-ink";
  return (
    <li className="group flex items-center gap-1 rounded-lg">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${
          active ? "bg-canvas text-ink" : "text-muted hover:text-ink"
        }`}
      >
        {s.kind === "checklist" && <IconListCheck size={14} className="shrink-0" aria-hidden />}
        <span className="truncate">{s.title || "Untitled section"}</span>
      </Link>
      {s.kind === "custom" && (
        <span className="flex shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {canUp && (
            <button
              type="button"
              onClick={() => moveSection(phase, s.id, -1)}
              className={tool}
              aria-label={`Move ${s.title} up`}
            >
              <IconArrowUp size={14} aria-hidden />
            </button>
          )}
          {canDown && (
            <button
              type="button"
              onClick={() => moveSection(phase, s.id, 1)}
              className={tool}
              aria-label={`Move ${s.title} down`}
            >
              <IconArrowDown size={14} aria-hidden />
            </button>
          )}
          <button type="button" onClick={onDelete} className={tool} aria-label={`Delete ${s.title}`}>
            <IconTrash size={14} aria-hidden />
          </button>
        </span>
      )}
    </li>
  );
}

function DeleteSectionDialog({
  target,
  onClose,
  onDeleted,
}: {
  target?: { phase: PhaseId; section: Section };
  onClose: () => void;
  onDeleted: (phase: PhaseId) => void;
}) {
  const { deleteSection } = useProject();
  return (
    <Dialog open={!!target} onClose={onClose} title={target ? `Delete ${target.section.title || "this section"}?` : ""}>
      <p className="mt-2 text-sm text-muted">
        Everything written in this section is deleted with it. This cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButton}>
          Cancel
        </button>
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            if (!target) return;
            deleteSection(target.phase, target.section.id);
            onDeleted(target.phase);
            onClose();
          }}
        >
          Delete section
        </button>
      </div>
    </Dialog>
  );
}
