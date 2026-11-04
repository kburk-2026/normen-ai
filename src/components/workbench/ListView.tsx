"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { PHASES, STAGES, type PhaseId } from "@/content/phases";
import { ACTIVITIES } from "@/content/lifecycle";
import { useProject } from "@/state/ProjectProvider";
import { openCriteria, overrideFor, phaseState } from "@/state/project";
import PhaseChecklist, { PhaseBadge } from "./PhaseChecklist";

export default function ListView({
  justPassed,
  onPassed,
}: {
  justPassed: PhaseId | null;
  onPassed: (p: PhaseId) => void;
}) {
  return (
    <ol className="space-y-3">
      {PHASES.map((phase) => (
        <PhaseCard key={phase.id} phase={phase.id} justPassed={justPassed === phase.id} onPassed={onPassed} />
      ))}
    </ol>
  );
}

function PhaseCard({
  phase: id,
  justPassed,
  onPassed,
}: {
  phase: PhaseId;
  justPassed: boolean;
  onPassed: (p: PhaseId) => void;
}) {
  const { project, statusOf } = useProject();
  const phase = PHASES.find((p) => p.id === id)!;
  const Icon = phase.icon;
  const state = phaseState(project, id);
  const acts = ACTIVITIES.filter((a) => a.phase === id);
  const doneHere = acts.filter((a) => statusOf(a.id) === "done").length;
  const flagged = state === "passed" && !!overrideFor(project, id) && openCriteria(project, id).length > 0;

  return (
    <li>
      <details
        open={state === "current" || justPassed}
        className={`group rounded-2xl border-l-[3px] bg-surface ${STAGES[phase.stages[0]].strip}`}
      >
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 rounded-2xl px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="font-mono text-xs text-faint" aria-hidden>
            0{phase.number}
          </span>
          <Icon size={20} stroke={1.75} aria-hidden />
          <h2 className="font-display text-lg font-medium">
            <span className="sr-only">Phase {phase.number}, </span>
            {phase.name}
          </h2>
          <span className="flex gap-1.5">
            {phase.stages.map((s) => (
              <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${STAGES[s].tag}`}>
                {STAGES[s].label}
              </span>
            ))}
          </span>
          <span className="ml-auto flex items-center gap-3 text-sm text-muted">
            <span className="font-mono text-xs" aria-hidden>
              {doneHere}/{acts.length}
            </span>
            <span className="sr-only">
              , {doneHere} of {acts.length} activities done,
            </span>
            <PhaseBadge state={state} flagged={flagged} />
            <IconChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>

        <div className="border-t border-line px-5 pb-5">
          <PhaseChecklist phase={id} justPassed={justPassed} onPassed={onPassed} />
        </div>
      </details>
    </li>
  );
}
