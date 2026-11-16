"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDownload, IconLayoutKanban, IconLayoutList, IconPrinter, IconRefresh, IconTimeline } from "@tabler/icons-react";
import { ACTIVITIES } from "@/content/lifecycle";
import type { PhaseId } from "@/content/phases";
import { ToolsMenu, useProjectTools } from "@/components/projects/ProjectTools";
import { useProject } from "@/state/ProjectProvider";
import BoardView from "./BoardView";
import ListView from "./ListView";
import TimelineView from "./TimelineView";

type View = "list" | "board" | "timeline";

/** A project's All phases view (list, board or timeline), with export. The view comes from the URL. */
export default function Workbench({ view }: { view: View }) {
  const { project, statusOf, reset } = useProject();
  const [justPassed, setJustPassed] = useState<PhaseId | null>(null);
  const done = ACTIVITIES.filter((a) => statusOf(a.id) === "done").length;

  const tools = useProjectTools();

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
            <ExportButton onClick={tools.downloadMarkdown} label="Download the project as Markdown">
              <IconDownload size={16} aria-hidden /> Markdown
            </ExportButton>
            <ExportButton onClick={tools.print} label="Print the project or save it as a PDF">
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
              <ViewLink active={view === "timeline"} href={`/workbench/${project.id}/timeline`}>
                <IconTimeline size={16} aria-hidden /> Timeline
              </ViewLink>
            </div>
            <ToolsMenu />
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
          {view === "list" ? (
            <ListView justPassed={justPassed} onPassed={setJustPassed} />
          ) : view === "board" ? (
            <BoardView />
          ) : (
            <TimelineView />
          )}
        </div>
      </div>
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
