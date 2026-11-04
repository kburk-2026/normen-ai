"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDownload, IconLayoutKanban, IconLayoutList, IconPrinter, IconRefresh } from "@tabler/icons-react";
import { ACTIVITIES } from "@/content/lifecycle";
import type { PhaseId } from "@/content/phases";
import { useProject } from "@/state/ProjectProvider";
import { projectToMarkdown, slugify } from "@/lib/exportProject";
import { today } from "@/lib/format";
import BoardView from "./BoardView";
import ListView from "./ListView";
import ProjectPrint from "./ProjectPrint";

type View = "list" | "board";

/** A project's All phases view (list or board), with export. The view comes from the URL. */
export default function Workbench({ view }: { view: View }) {
  const { project, statusOf, reset } = useProject();
  const [justPassed, setJustPassed] = useState<PhaseId | null>(null);
  const done = ACTIVITIES.filter((a) => statusOf(a.id) === "done").length;

  const downloadMarkdown = () => {
    const blob = new Blob([projectToMarkdown(project, today())], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(project.name)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-faint">{project.isDemo ? "Demo project" : "Project"}</p>
            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-xl text-muted">{project.blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton onClick={downloadMarkdown} label="Download the project as Markdown">
              <IconDownload size={16} aria-hidden /> Markdown
            </ExportButton>
            <ExportButton onClick={() => window.print()} label="Print the project or save it as a PDF">
              <IconPrinter size={16} aria-hidden /> PDF
            </ExportButton>
            {project.isDemo && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setJustPassed(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <IconRefresh size={16} aria-hidden /> Reset demo
              </button>
            )}
            <div className="inline-flex rounded-full bg-surface p-1 text-sm" role="group" aria-label="View">
              <ViewLink active={view === "list"} href={`/workbench/${project.id}`}>
                <IconLayoutList size={16} aria-hidden /> List
              </ViewLink>
              <ViewLink active={view === "board"} href={`/workbench/${project.id}/board`}>
                <IconLayoutKanban size={16} aria-hidden /> Board
              </ViewLink>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-label="Activities done"
            aria-valuemin={0}
            aria-valuemax={ACTIVITIES.length}
            aria-valuenow={done}
          >
            <div
              className="h-full rounded-full bg-orange transition-[width]"
              style={{ width: `${(done / ACTIVITIES.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs">
            {done}/{ACTIVITIES.length} activities
          </span>
        </div>

        <div className="mt-8">
          {view === "list" ? <ListView justPassed={justPassed} onPassed={setJustPassed} /> : <BoardView />}
        </div>
      </div>
      <ProjectPrint />
    </>
  );
}

function ExportButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:bg-surface"
    >
      {children}
    </button>
  );
}

function ViewLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
        active ? "bg-canvas text-ink" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
