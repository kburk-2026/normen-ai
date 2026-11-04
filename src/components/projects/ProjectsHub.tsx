"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconFolderOpen,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import Mascot from "@/components/Mascot";
import Menu from "@/components/ui/Menu";
import { PHASES, STAGES } from "@/content/phases";
import { ACTIVITIES } from "@/content/lifecycle";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "@/content/demo";
import { formatDate } from "@/lib/format";
import { useWorkspace } from "@/state/ProjectProvider";
import { currentPhaseIndex, parseWorkspace, type Workspace } from "@/state/workspace";
import { DeleteProjectDialog, ProjectFormDialog, RestoreDialog, STATUS_STYLE, downloadBackup } from "./ProjectDialogs";

type Filter = ProjectStatus | "All";

export default function ProjectsHub() {
  const ws = useWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project>();
  const [deleting, setDeleting] = useState<Project>();
  const [incoming, setIncoming] = useState<Workspace>();
  const [restoreError, setRestoreError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const shown = ws.projects.filter(
    (p) =>
      (filter === "All" || p.status === filter) &&
      (!q || p.name.toLowerCase().includes(q) || p.blurb.toLowerCase().includes(q)),
  );

  const readBackup = async (file: File) => {
    setRestoreError("");
    const parsed = parseWorkspace(await file.text());
    if (!parsed) setRestoreError(`${file.name} is not a Normen backup file.`);
    else setIncoming(parsed);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Projects</h1>
          <p className="mt-1 text-muted">Every AI project you are taking through the lifecycle.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => downloadBackup(ws.workspace)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 transition-colors hover:bg-surface"
          >
            <IconDownload size={16} aria-hidden /> Back up
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 transition-colors hover:bg-surface"
          >
            <IconUpload size={16} aria-hidden /> Restore
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readBackup(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-1.5 font-medium text-orange-ink transition-colors hover:bg-orange-soft"
          >
            <IconPlus size={16} aria-hidden /> New project
          </button>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-xs text-faint">
        Projects are saved in this browser only. Back up now and then, and before clearing your browser data.
      </p>
      {restoreError && (
        <p role="alert" className="mt-3 rounded-xl bg-tan-bg px-3 py-2 text-sm text-tan-soft">
          {restoreError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <label className="inline-flex flex-1 items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-muted focus-within:outline focus-within:outline-2 focus-within:outline-orange sm:max-w-xs">
          <IconSearch size={16} aria-hidden />
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            className="w-full bg-transparent text-ink placeholder:text-faint focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {(["All", ...PROJECT_STATUSES] as Filter[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 transition-colors ${filter === s ? "bg-ink text-canvas" : "text-muted hover:bg-surface hover:text-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!ws.loaded ? (
        <p className="mt-8 text-sm text-faint">Loading your projects…</p>
      ) : ws.projects.length === 0 ? (
        <div className="mt-8 flex max-w-xl items-start gap-4 rounded-2xl border border-dashed border-line p-5">
          <Mascot mood="wave" size={48} />
          <div className="text-sm">
            <p>No projects yet. Start one, or bring back the demo to see how it works.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => setCreating(true)} className="text-orange hover:text-orange-soft">
                New project
              </button>
              <button type="button" onClick={ws.resetDemo} className="text-orange hover:text-orange-soft">
                Restore the demo
              </button>
            </div>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No projects match.</p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => setEditing(p)}
              onDuplicate={() => {
                const copy = ws.duplicateProject(p.id);
                if (copy) router.push(`/workbench/${copy.id}`);
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </ul>
      )}

      <ProjectFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(name, blurb, fromDemo) => {
          const p = ws.createProject(name, blurb, fromDemo);
          router.push(`/workbench/${p.id}`);
        }}
      />
      <ProjectFormDialog
        open={!!editing}
        editing={editing}
        onClose={() => setEditing(undefined)}
        onSubmit={(name, blurb) => editing && ws.renameProject(editing.id, name, blurb)}
      />
      <DeleteProjectDialog
        project={deleting}
        onClose={() => setDeleting(undefined)}
        onDelete={() => deleting && ws.deleteProject(deleting.id)}
        onBackup={() => downloadBackup(ws.workspace)}
      />
      <RestoreDialog
        incoming={incoming}
        currentCount={ws.projects.length}
        onClose={() => setIncoming(undefined)}
        onRestore={() => incoming && ws.replaceWorkspace(incoming)}
        onBackup={() => downloadBackup(ws.workspace)}
      />
    </>
  );
}

function ProjectCard({
  project: p,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const phase =
    PHASES[
      currentPhaseIndex(
        p,
        PHASES.map((x) => x.id),
      )
    ];
  const done = ACTIVITIES.filter((a) => p.activities[a.id] === "done").length;

  return (
    <li className={`relative rounded-2xl border-t-[3px] bg-surface p-5 ${STAGES[phase.stages[0]].strip}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[p.status]}`}>{p.status}</span>
        <Menu
          label={`Actions for ${p.name}`}
          trigger={<IconDotsVertical size={18} aria-hidden />}
          items={[
            { label: "Open", icon: IconFolderOpen, onSelect: () => router.push(`/workbench/${p.id}`) },
            { label: "Rename and describe", icon: IconPencil, onSelect: onEdit },
            { label: "Duplicate", icon: IconCopy, onSelect: onDuplicate },
            { label: "Delete", icon: IconTrash, onSelect: onDelete, danger: true },
          ]}
        />
      </div>
      <h2 className="mt-3 font-display text-lg font-medium">
        <Link href={`/workbench/${p.id}`} className="hover:text-orange-soft focus-visible:text-orange-soft">
          {p.name}
        </Link>
        {p.isDemo && (
          <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 align-middle font-sans text-[11px] font-normal text-muted">
            Demo
          </span>
        )}
      </h2>
      {p.blurb && <p className="mt-1 text-sm text-muted">{p.blurb}</p>}
      <p className="mt-4 text-xs text-muted">
        Phase 0{phase.number} · {phase.name}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden>
        <div className="h-full rounded-full bg-orange" style={{ width: `${(done / ACTIVITIES.length) * 100}%` }} />
      </div>
      <p className="mt-2 flex justify-between gap-2 font-mono text-[11px] text-faint">
        <span>
          {done}/{ACTIVITIES.length} activities
        </span>
        <span>Updated {formatDate(p.updatedAt.slice(0, 10))}</span>
      </p>
    </li>
  );
}
