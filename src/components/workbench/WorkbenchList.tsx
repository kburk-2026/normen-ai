"use client";

import {
  IconChevronDown,
  IconCircle,
  IconCircleCheckFilled,
  IconCircleHalf2,
  IconLayoutKanban,
  IconLayoutList,
  IconLock,
  IconLockOpen,
  IconRefresh,
  IconShieldCheck,
} from "@tabler/icons-react";
import { PHASES, STAGES, type PhaseId } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS, GUARDRAILS, GUARDRAIL_LABELS, type Activity } from "@/content/lifecycle";
import type { ActivityStatus, Project } from "@/content/demo";
import { useProject } from "@/state/ProjectProvider";

const STATUS: Record<ActivityStatus, { label: string; icon: typeof IconCircle; tone: string }> = {
  todo: { label: "To do", icon: IconCircle, tone: "text-faint" },
  doing: { label: "In progress", icon: IconCircleHalf2, tone: "text-steel-soft" },
  done: { label: "Done", icon: IconCircleCheckFilled, tone: "text-orange" },
};

const NEXT: Record<ActivityStatus, ActivityStatus> = { todo: "doing", doing: "done", done: "todo" };

type PhaseState = "passed" | "current" | "locked";

/** A phase is open once every earlier checkpoint is passed. Passing checkpoints arrives in milestone 3. */
function phaseState(project: Project, id: PhaseId, index: number): PhaseState {
  if (project.passed.includes(id)) return "passed";
  if (PHASES.slice(0, index).every((p) => project.passed.includes(p.id))) return "current";
  return "locked";
}

export default function WorkbenchList() {
  const { project, statusOf, reset } = useProject();
  const done = ACTIVITIES.filter((a) => statusOf(a.id) === "done").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-faint">Demo project</p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">{project.name}</h1>
          <p className="mt-2 max-w-xl text-muted">{project.blurb}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <IconRefresh size={16} aria-hidden /> Reset demo
          </button>
          <div className="inline-flex rounded-full bg-surface p-1 text-sm" role="group" aria-label="View">
            <span aria-current="true" className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5">
              <IconLayoutList size={16} aria-hidden /> List
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-faint" title="Board view arrives in milestone 3">
              <IconLayoutKanban size={16} aria-hidden /> Board
            </span>
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
          <div className="h-full rounded-full bg-orange transition-[width]" style={{ width: `${(done / ACTIVITIES.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs">
          {done}/{ACTIVITIES.length} activities
        </span>
      </div>

      <ol className="mt-8 space-y-3">
        {PHASES.map((phase, i) => (
          <PhaseCard key={phase.id} index={i} state={phaseState(project, phase.id, i)} />
        ))}
      </ol>
    </>
  );
}

function PhaseCard({ index, state }: { index: number; state: PhaseState }) {
  const { statusOf } = useProject();
  const phase = PHASES[index];
  const Icon = phase.icon;
  const acts = ACTIVITIES.filter((a) => a.phase === phase.id);
  const guards = GUARDRAILS.filter((g) => g.phase === phase.id);
  const checks = CHECKPOINTS.filter((c) => c.phase === phase.id);
  const doneHere = acts.filter((a) => statusOf(a.id) === "done").length;

  return (
    <li>
      <details
        open={state === "current"}
        className={`group rounded-2xl border-l-[3px] bg-surface ${STAGES[phase.stages[0]].strip}`}
      >
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 rounded-2xl px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="font-mono text-xs text-faint">0{phase.number}</span>
          <Icon size={20} stroke={1.75} aria-hidden />
          <span className="font-display text-lg font-medium">{phase.name}</span>
          <span className="flex gap-1.5">
            {phase.stages.map((s) => (
              <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${STAGES[s].tag}`}>
                {STAGES[s].label}
              </span>
            ))}
          </span>
          <span className="ml-auto flex items-center gap-3 text-sm text-muted">
            <span className="font-mono text-xs" aria-label={`${doneHere} of ${acts.length} activities done`}>
              {doneHere}/{acts.length}
            </span>
            <PhaseBadge state={state} />
            <IconChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>

        <div className="border-t border-line px-5 pb-5">
          <p className="pt-4 text-sm text-muted">{phase.summary}</p>

          <ul className="mt-3 divide-y divide-line">
            {acts.map((a) => (
              <ActivityRow key={a.id} activity={a} locked={state === "locked"} />
            ))}
          </ul>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            <div className="rounded-xl bg-canvas p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-tan">
                {state === "passed" ? <IconLockOpen size={14} aria-hidden /> : <IconLock size={14} aria-hidden />}
                Checkpoint
              </h3>
              <ul className="mt-2 space-y-1.5">
                {checks.map((c) => (
                  <li key={c.id} className="flex gap-2 text-sm">
                    {state === "passed" ? (
                      <IconCircleCheckFilled size={16} className="mt-0.5 shrink-0 text-orange" aria-label="Met:" />
                    ) : (
                      <IconCircle size={16} className="mt-0.5 shrink-0 text-faint" aria-label="Not yet met:" />
                    )}
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}

function PhaseBadge({ state }: { state: PhaseState }) {
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

function ActivityRow({ activity: a, locked }: { activity: Activity; locked: boolean }) {
  const { statusOf, setStatus } = useProject();
  const current = statusOf(a.id);
  const st = STATUS[current];
  const StIcon = st.icon;

  return (
    <li className="grid grid-cols-[28px_72px_1fr_auto] items-start gap-3 py-3">
      <button
        type="button"
        disabled={locked}
        onClick={() => setStatus(a.id, NEXT[current])}
        aria-label={`${a.id} ${a.title}: ${st.label}. ${locked ? "Locked until the previous checkpoint is passed." : `Mark as ${STATUS[NEXT[current]].label}.`}`}
        title={locked ? "Locked until the previous checkpoint is passed" : `${st.label}. Click to mark ${STATUS[NEXT[current]].label.toLowerCase()}.`}
        className={`-m-1 rounded-full p-1 transition-colors enabled:hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60 ${st.tone}`}
      >
        <StIcon size={20} aria-hidden />
      </button>
      <span className="pt-0.5 font-mono text-xs text-faint">{a.id}</span>
      <span>
        <span className="block text-sm font-medium">{a.title}</span>
        <span className="mt-0.5 block text-sm text-muted">{a.detail}</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${STAGES[a.stage].tag}`}>{STAGES[a.stage].label}</span>
    </li>
  );
}
