"use client";

import { useState } from "react";
import { IconLock } from "@tabler/icons-react";
import { PHASES, STAGES, type PhaseId } from "@/content/phases";
import { ACTIVITIES } from "@/content/lifecycle";
import type { ActivityStatus } from "@/content/demo";
import { useProject } from "@/state/ProjectProvider";
import { phaseState } from "@/state/project";
import StatusButton, { STATUS } from "./StatusButton";

type Filter = PhaseId | "open";
const COLUMNS: ActivityStatus[] = ["todo", "doing", "done"];

/** Same data as the list: columns are status, chips pick the phase. */
export default function BoardView() {
  const { project, statusOf } = useProject();
  const current = PHASES.find((p) => phaseState(project, p.id) === "current");
  const [filter, setFilter] = useState<Filter>(current?.id ?? "open");

  const shown = ACTIVITIES.filter((a) =>
    filter === "open" ? phaseState(project, a.phase) !== "locked" : a.phase === filter,
  );

  return (
    <>
      <div className="flex flex-wrap gap-1.5 text-sm" role="group" aria-label="Filter by phase">
        <Chip active={filter === "open"} onClick={() => setFilter("open")}>
          All open
        </Chip>
        {PHASES.map((p) => {
          const locked = phaseState(project, p.id) === "locked";
          return (
            <Chip key={p.id} active={filter === p.id} disabled={locked} onClick={() => setFilter(p.id)}>
              {locked && <IconLock size={12} aria-label="Locked:" />}
              {p.name}
            </Chip>
          );
        })}
      </div>

      <div className="mt-4 grid items-start gap-3 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const cards = shown.filter((a) => statusOf(a.id) === col);
          return (
            <section key={col} aria-label={STATUS[col].label} className="rounded-2xl bg-surface p-3">
              <h2 className="flex items-center justify-between px-1 pb-3 text-sm font-medium">
                {STATUS[col].label} <span className="font-mono text-xs text-faint">{cards.length}</span>
              </h2>
              <ul className="space-y-2">
                {cards.map((a) => {
                  const phase = PHASES.find((p) => p.id === a.phase)!;
                  return (
                    <li key={a.id} className="flex items-start gap-2 rounded-xl bg-canvas p-3">
                      <StatusButton activity={a} locked={phaseState(project, a.phase) === "locked"} size={18} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] text-faint">{a.id}</span>
                          <span className="text-[11px] text-faint">· {phase.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${STAGES[a.stage].tag}`}>
                            {STAGES[a.stage].label}
                          </span>
                        </p>
                      </div>
                    </li>
                  );
                })}
                {cards.length === 0 && <li className="px-1 pb-1 text-sm text-faint">Nothing here.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:text-faint ${
        active ? "bg-ink text-canvas" : "text-muted enabled:hover:bg-surface enabled:hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
