"use client";

import { IconAlertTriangle, IconLock, IconLockOpen, IconShieldCheck } from "@tabler/icons-react";
import { PHASES, STAGES, type PhaseId } from "@/content/phases";
import { ACTIVITIES, GUARDRAILS, GUARDRAIL_LABELS } from "@/content/lifecycle";
import { useProject } from "@/state/ProjectProvider";
import { phaseState, type PhaseState } from "@/state/project";
import CheckpointPanel from "./CheckpointPanel";
import StatusButton from "./StatusButton";

/** A phase's activities, guardrails and checkpoint. Used in the All phases list and each phase's Checklist section. */
export default function PhaseChecklist({
  phase: id,
  justPassed,
  onPassed,
}: {
  phase: PhaseId;
  justPassed: boolean;
  onPassed: (p: PhaseId) => void;
}) {
  const { project } = useProject();
  const phase = PHASES.find((p) => p.id === id)!;
  const state = phaseState(project, id);
  const acts = ACTIVITIES.filter((a) => a.phase === id);
  const guards = GUARDRAILS.filter((g) => g.phase === id);

  return (
    <>
      <p className="pt-4 text-sm text-muted">{phase.summary}</p>

      <ul className="mt-3 divide-y divide-line">
        {acts.map((a) => (
          <li key={a.id} className="grid grid-cols-[28px_72px_1fr_auto] items-start gap-3 py-3">
            <StatusButton activity={a} locked={state === "locked"} />
            <span className="pt-0.5 font-mono text-xs text-faint">{a.id}</span>
            <span>
              <span className="block text-sm font-medium">{a.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{a.detail}</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${STAGES[a.stage].tag}`}>{STAGES[a.stage].label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-steel-soft">
            <IconShieldCheck size={14} aria-hidden /> Guardrails
          </h3>
          <ul className="mt-2 space-y-2">
            {guards.map((g) => (
              <li key={g.id} className="text-sm">
                <span className="mr-2 rounded-full bg-steel-bg px-2 py-0.5 text-xs text-steel-soft">
                  {GUARDRAIL_LABELS[g.category]}
                </span>
                {g.title}
              </li>
            ))}
          </ul>
        </div>
        <CheckpointPanel phase={id} justPassed={justPassed} onPassed={onPassed} />
      </div>
    </>
  );
}

export function PhaseBadge({ state, flagged }: { state: PhaseState; flagged: boolean }) {
  if (flagged)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-tan-bg px-2.5 py-0.5 text-xs text-tan-soft">
        <IconAlertTriangle size={13} aria-hidden /> Passed with override
      </span>
    );
  if (state === "passed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-bg px-2.5 py-0.5 text-xs text-orange-soft">
        <IconLockOpen size={13} aria-hidden /> Checkpoint passed
      </span>
    );
  if (state === "current")
    return <span className="rounded-full bg-steel-bg px-2.5 py-0.5 text-xs text-steel-soft">In progress</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-0.5 text-xs text-faint">
      <IconLock size={13} aria-hidden /> Locked
    </span>
  );
}
