"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconChevronDown,
  IconClipboardCheck,
  IconDownload,
  IconHistory,
  IconKeyboard,
  IconPrinter,
  IconRestore,
  IconTag,
  IconTool,
} from "@tabler/icons-react";
import Dialog, { quietButton } from "@/components/ui/Dialog";
import ProjectPrint from "@/components/workbench/ProjectPrint";
import { PROJECT_STATUSES, type ProjectStatus } from "@/content/demo";
import { PHASES, type PhaseId } from "@/content/phases";
import { projectToMarkdown, slugify } from "@/lib/exportProject";
import { formatDate, today } from "@/lib/format";
import { keysPref, modePref } from "@/state/editMode";
import { logByDay } from "@/state/log";
import { useProject, useWorkspace } from "@/state/ProjectProvider";
import { parseWorkspace, type Workspace } from "@/state/workspace";
import { RestoreDialog, STATUS_STYLE, downloadBackup } from "./ProjectDialogs";

type Panel = "status" | "changelog" | "shortcuts";

type Tools = {
  downloadMarkdown: () => void;
  /** Load the print view's images, then open the print dialog. */
  print: () => void;
  open: (panel: Panel) => void;
  backUp: () => void;
  chooseBackupFile: () => void;
};

const ToolsContext = createContext<Tools | null>(null);

export function useProjectTools() {
  const ctx = useContext(ToolsContext);
  if (!ctx) throw new Error("useProjectTools must be used inside ProjectToolsProvider");
  return ctx;
}

/**
 * Everything the Tools menu can do for the open project, plus the pieces those
 * actions need on the page: the print view, the dialogs and the keyboard shortcuts.
 * `current` is the section being shown, if any.
 */
export function ProjectToolsProvider({
  current,
  children,
}: {
  current?: { phase: PhaseId; sectionId: string };
  children: React.ReactNode;
}) {
  const { project } = useProject();
  const ws = useWorkspace();
  const router = useRouter();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [incoming, setIncoming] = useState<Workspace>();
  const [restoreError, setRestoreError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // The print view's images load only on request: wait for them (4 seconds at most), then print.
  const [printImages, setPrintImages] = useState(false);
  const printView = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!printImages) return;
    let cancelled = false;
    const pending = [...(printView.current?.querySelectorAll("img") ?? [])]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          }),
      );
    const timeout = new Promise<void>((done) => window.setTimeout(done, 4000));
    Promise.race([Promise.all(pending), timeout]).then(() => {
      if (cancelled) return;
      window.print();
      setPrintImages(false);
    });
    return () => {
      cancelled = true;
    };
  }, [printImages]);

  const tools = useMemo<Tools>(
    () => ({
      downloadMarkdown: () => {
        const blob = new Blob([projectToMarkdown(project, today())], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slugify(project.name)}.md`;
        a.click();
        URL.revokeObjectURL(url);
      },
      print: () => setPrintImages(true),
      open: setPanel,
      backUp: () => downloadBackup(ws.workspace),
      chooseBackupFile: () => fileInput.current?.click(),
    }),
    [project, ws.workspace],
  );

  // ---- Keyboard shortcuts. Single keys can be switched off, and never fire while typing or in a dialog. ----
  const order = useMemo(
    () => PHASES.flatMap((ph) => project.sections[ph.id].map((s) => ({ phase: ph.id, sectionId: s.id, kind: s.kind }))),
    [project.sections],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || keysPref.read() === "off") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;

      if (e.key === "?") {
        e.preventDefault();
        setPanel("shortcuts");
        return;
      }
      const i = current ? order.findIndex((s) => s.sectionId === current.sectionId && s.phase === current.phase) : -1;
      if (e.key === "e" || e.key === "E") {
        if (i >= 0 && order[i].kind !== "checklist") modePref.set(modePref.read() === "edit" ? "view" : "edit");
        return;
      }
      if (e.key === "[" || e.key === "]") {
        const next = order[e.key === "]" ? i + 1 : i - 1];
        // From All phases or the board, ] opens the first section; [ has nowhere to go.
        if (next && (i >= 0 || e.key === "]")) router.push(`/workbench/${project.id}/${next.phase}/${next.sectionId}`);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, order, project.id, router]);

  const readBackup = async (file: File) => {
    const parsed = parseWorkspace(await file.text());
    if (parsed) setIncoming(parsed);
    else setRestoreError(`${file.name} is not a Normen backup file.`);
  };

  return (
    <ToolsContext.Provider value={tools}>
      <div className="print:hidden">{children}</div>
      <div ref={printView}>
        <ProjectPrint withImages={printImages} />
      </div>

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
      <RestoreDialog
        incoming={incoming}
        currentCount={ws.projects.length}
        onClose={() => setIncoming(undefined)}
        onBackup={tools.backUp}
        onRestore={() => {
          if (!incoming) return;
          ws.replaceWorkspace(incoming);
          // The open project may not exist in the backup, so go back to the list.
          router.push("/workbench");
        }}
      />
      <Dialog open={!!restoreError} onClose={() => setRestoreError("")} title="That file could not be used">
        <p className="mt-2 text-sm text-muted">{restoreError}</p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setRestoreError("")} className={quietButton}>
            Close
          </button>
        </div>
      </Dialog>

      <StatusDialog open={panel === "status"} onClose={() => setPanel(null)} />
      <ChangelogDialog open={panel === "changelog"} onClose={() => setPanel(null)} />
      <ShortcutsDialog open={panel === "shortcuts"} onClose={() => setPanel(null)} />
    </ToolsContext.Provider>
  );
}

// ---------- The menu ----------

type Item = { label: string; hint?: string; icon: typeof IconTool; run: () => void };

/** The Tools button on every project page. */
export function ToolsMenu() {
  const tools = useProjectTools();
  const { project } = useProject();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const groups: { name: string; items: Item[] }[] = [
    {
      name: "This project",
      items: [
        { label: "Project status", hint: project.status, icon: IconTag, run: () => tools.open("status") },
        { label: "Changelog", hint: "What changed, and when", icon: IconHistory, run: () => tools.open("changelog") },
        {
          label: "Run the Fit Check",
          hint: "Save the result to this project",
          icon: IconClipboardCheck,
          run: () => router.push(`/fit-check?project=${encodeURIComponent(project.id)}`),
        },
      ],
    },
    {
      name: "Export",
      items: [
        { label: "Download as Markdown", icon: IconDownload, run: tools.downloadMarkdown },
        { label: "Print or save as PDF", icon: IconPrinter, run: tools.print },
      ],
    },
    {
      name: "All projects",
      items: [
        { label: "Back up all projects", hint: "One file, saved to your computer", icon: IconArchive, run: tools.backUp },
        { label: "Restore from a backup", hint: "Replaces every project", icon: IconRestore, run: tools.chooseBackupFile },
      ],
    },
    { name: "Help", items: [{ label: "Keyboard shortcuts", hint: "Press ? any time", icon: IconKeyboard, run: () => tools.open("shortcuts") }] },
  ];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    wrap.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const els = [...(wrap.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    const to = e.key === "Home" ? 0 : e.key === "End" ? els.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length;
    els[to]?.focus();
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-ink ring-1 ring-line transition-shadow hover:ring-orange"
      >
        <IconTool size={15} aria-hidden /> Tools <IconChevronDown size={14} aria-hidden />
      </button>
      {open && (
        // On phones the button can sit anywhere in a wrapped row, so the menu spans the screen width.
        <div
          id={menuId}
          role="menu"
          aria-label="Tools"
          onKeyDown={onMenuKey}
          className="z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-canvas p-2 shadow-2xl max-md:fixed max-md:inset-x-5 md:absolute md:right-0 md:top-full md:w-72"
        >
          {groups.map((g, gi) => (
            <div key={g.name} role="group" aria-label={g.name} className={gi ? "mt-1 border-t border-line pt-1" : ""}>
              <p aria-hidden className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-widest text-faint">
                {g.name}
              </p>
              {g.items.map(({ label, hint, icon: Icon, run }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    // Focus the button first, so a dialog opened by this choice returns focus here when it closes.
                    button.current?.focus();
                    run();
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface focus:bg-surface focus:outline-none"
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-steel-soft" aria-hidden />
                  <span className="flex-1">
                    {label}
                    {hint && <span className="block text-xs text-faint">{hint}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Dialogs ----------

function StatusDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project } = useProject();
  const { setProjectStatus } = useWorkspace();
  return (
    <Dialog open={open} onClose={onClose} title="Project status">
      <fieldset className="mt-3 space-y-1.5">
        <legend className="sr-only">Status of {project.name}</legend>
        {PROJECT_STATUSES.map((s: ProjectStatus) => (
          <label key={s} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-canvas">
            <input
              type="radio"
              name="project-status"
              className="accent-orange"
              checked={project.status === s}
              onChange={() => setProjectStatus(project.id, s)}
            />
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[s]}`}>{s}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={quietButton}>
          Done
        </button>
      </div>
    </Dialog>
  );
}

function ChangelogDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project } = useProject();
  const days = logByDay(project.log);
  return (
    <Dialog open={open} onClose={onClose} title={`Changelog: ${project.name}`}>
      {/* Focusable, so keyboard users can scroll a long list. */}
      <div tabIndex={0} role="region" aria-label="Changelog entries" className="mt-3 max-h-[55vh] overflow-y-auto pr-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange">
        {days.length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ol className="space-y-4">
            {days.map((d) => (
              <li key={d.day}>
                <p className="font-mono text-xs text-faint">{formatDate(d.day)}</p>
                <ul className="mt-1 space-y-1 border-l border-muted/40 pl-3 text-sm">
                  {d.entries.map((e, i) => (
                    <li key={`${e.at}-${i}`}>{e.text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="mt-4 text-xs text-faint">
        Normen writes this as you work. It is kept in this browser with the project, and included in backups and the Markdown
        export.
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className={quietButton}>
          Close
        </button>
      </div>
    </Dialog>
  );
}

const SINGLE_KEYS: [string, string][] = [
  ["?", "Show this list"],
  ["E", "Switch between Edit and View"],
  ["[  and  ]", "Go to the previous or next section"],
];
const ALWAYS_KEYS: [string, string][] = [
  ["Alt + ↑ / ↓", "Move the block you are in up or down"],
  ["Esc", "Close a menu or dialog"],
];

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const single = keysPref.use() === "on";
  const row = (k: string, what: string, off: boolean) => (
    <div key={k} className="flex items-center justify-between gap-4 py-2">
      <dt className={off ? "text-faint line-through" : ""}>{what}</dt>
      <dd className="shrink-0 rounded-md bg-canvas px-2 py-0.5 font-mono text-xs text-steel-soft ring-1 ring-line">{k}</dd>
    </div>
  );
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <dl className="mt-3 divide-y divide-line text-sm">
        {SINGLE_KEYS.map(([k, what]) => row(k, what, !single))}
        {ALWAYS_KEYS.map(([k, what]) => row(k, what, false))}
      </dl>
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" checked={single} onChange={(e) => keysPref.set(e.target.checked ? "on" : "off")} className="mt-1 shrink-0 accent-steel" />
        <span>
          Single-key shortcuts (?, E, [ and ])
          <span className="block text-xs text-faint">
            Turn these off if you use voice control or keys get pressed by accident. They never fire while you are typing in a
            field.
          </span>
        </span>
      </label>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className={quietButton}>
          Close
        </button>
      </div>
    </Dialog>
  );
}
