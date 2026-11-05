"use client";

import { useState } from "react";
import { IconDownload } from "@tabler/icons-react";
import { today } from "@/lib/format";
import Dialog, { inputClass, primaryButton, quietButton } from "@/components/ui/Dialog";
import type { Project, ProjectStatus } from "@/content/demo";
import type { Workspace } from "@/state/workspace";

export const STATUS_STYLE: Record<ProjectStatus, string> = {
  Draft: "bg-line text-ink",
  "In Progress": "bg-steel-bg text-steel-soft",
  "In Review": "bg-tan-bg text-tan-soft",
  Complete: "bg-orange-bg text-orange-soft",
};

/** Download every project as one JSON file. */
export function downloadBackup(ws: Workspace) {
  const stamp = today();
  const blob = new Blob([JSON.stringify(ws, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `normen-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** New project, or edit an existing one's name and description. */
export function ProjectFormDialog({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this project instead of creating one. */
  editing?: Project;
  onSubmit: (name: string, blurb: string, fromDemo: boolean) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={editing ? "Rename and describe" : "New project"}>
      {open && <ProjectForm key={editing?.id ?? "new"} editing={editing} onClose={onClose} onSubmit={onSubmit} />}
    </Dialog>
  );
}

function ProjectForm({
  editing,
  onClose,
  onSubmit,
}: {
  editing?: Project;
  onClose: () => void;
  onSubmit: (name: string, blurb: string, fromDemo: boolean) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [blurb, setBlurb] = useState(editing?.blurb ?? "");
  const [fromDemo, setFromDemo] = useState(false);
  const ok = name.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onSubmit(name, blurb, fromDemo);
        onClose();
      }}
    >
      <label className="mt-4 block text-sm font-medium" htmlFor="project-name">
        Name
      </label>
      <input
        id="project-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        className={inputClass}
      />
      <label className="mt-3 block text-sm font-medium" htmlFor="project-blurb">
        One-line description
      </label>
      <input
        id="project-blurb"
        value={blurb}
        onChange={(e) => setBlurb(e.target.value)}
        maxLength={160}
        placeholder="What should it do, and for whom?"
        className={inputClass}
      />
      {!editing && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium">Start from</legend>
          <div className="mt-1.5 space-y-2 text-sm">
            {[
              [false, "A blank project"],
              [true, "A copy of the Expense triage demo"],
            ].map(([value, label]) => (
              <label
                key={String(value)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-orange ${
                  fromDemo === value ? "border-orange bg-orange-bg" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="start-from"
                  className="sr-only"
                  checked={fromDemo === value}
                  onChange={() => setFromDemo(value as boolean)}
                />
                <span
                  aria-hidden
                  className={`h-4 w-4 rounded-full border-2 ${fromDemo === value ? "border-orange bg-orange" : "border-faint"}`}
                />
                {label as string}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButton}>
          Cancel
        </button>
        <button type="submit" disabled={!ok} className={primaryButton}>
          {editing ? "Save" : "Create project"}
        </button>
      </div>
    </form>
  );
}

/** Deleting needs the project's name typed in, with a backup one click away. */
export function DeleteProjectDialog({
  project,
  onClose,
  onDelete,
  onBackup,
}: {
  project?: Project;
  onClose: () => void;
  onDelete: () => void;
  onBackup: () => void;
}) {
  return (
    <Dialog open={!!project} onClose={onClose} title={project ? `Delete ${project.name}?` : ""}>
      {project && (
        <DeleteForm key={project.id} project={project} onClose={onClose} onDelete={onDelete} onBackup={onBackup} />
      )}
    </Dialog>
  );
}

function DeleteForm({
  project,
  onClose,
  onDelete,
  onBackup,
}: {
  project: Project;
  onClose: () => void;
  onDelete: () => void;
  onBackup: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = typed.trim() === project.name.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onDelete();
        onClose();
      }}
    >
      <p className="mt-2 text-sm text-muted">
        This removes the project and everything written in it from this browser. It cannot be undone.
      </p>
      <button
        type="button"
        onClick={onBackup}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange hover:text-orange-soft"
      >
        <IconDownload size={16} aria-hidden /> Back up first
      </button>
      <label htmlFor="delete-confirm" className="mt-3 block text-sm font-medium">
        Type <span className="font-mono">{project.name}</span> to confirm
      </label>
      <input
        id="delete-confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className={inputClass}
      />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButton}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={!ok}
          className="rounded-full bg-tan px-4 py-1.5 text-sm font-medium text-canvas transition-colors hover:bg-tan-soft disabled:cursor-not-allowed disabled:bg-canvas disabled:font-normal disabled:text-faint"
        >
          Delete project
        </button>
      </div>
    </form>
  );
}

/** Confirm replacing every project with the contents of a backup file. */
export function RestoreDialog({
  incoming,
  currentCount,
  onClose,
  onRestore,
  onBackup,
}: {
  incoming?: Workspace;
  currentCount: number;
  onClose: () => void;
  onRestore: () => void;
  onBackup: () => void;
}) {
  const n = incoming?.projects.length ?? 0;
  return (
    <Dialog open={!!incoming} onClose={onClose} title="Restore from backup?">
      <p className="mt-2 text-sm text-muted">
        The file holds {n} {n === 1 ? "project" : "projects"}. Restoring replaces the {currentCount}{" "}
        {currentCount === 1 ? "project" : "projects"} in this browser with {n === 1 ? "it" : "them"}.
      </p>
      <button
        type="button"
        onClick={onBackup}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange hover:text-orange-soft"
      >
        <IconDownload size={16} aria-hidden /> Back up what is here first
      </button>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButton}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onRestore();
            onClose();
          }}
          className={primaryButton}
        >
          Replace with backup
        </button>
      </div>
    </Dialog>
  );
}
