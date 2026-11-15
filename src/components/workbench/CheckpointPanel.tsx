"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconLock,
  IconLockOpen,
  IconSquare,
  IconSquareCheckFilled,
  IconX,
} from "@tabler/icons-react";
import Mascot from "@/components/Mascot";
import { FIT_BANDS } from "@/content/fitCheck";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import { PHASES, type PhaseId } from "@/content/phases";
import { useProject } from "@/state/ProjectProvider";
import { formatDate } from "@/lib/format";
import { MIN_REASON, canPass, openCriteria, overrideFor, phaseState } from "@/state/project";

export default function CheckpointPanel({
  phase,
  justPassed,
  onPassed,
}: {
  phase: PhaseId;
  justPassed: boolean;
  onPassed: (phase: PhaseId) => void;
}) {
  const { project, toggleCheck, pass, passWithOverride } = useProject();
  const dialog = useRef<HTMLDialogElement>(null);
  const reasonBox = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");

  const index = PHASES.findIndex((p) => p.id === phase);
  const name = PHASES[index].name;
  const next = PHASES[index + 1];
  const state = phaseState(project, phase);
  const criteria = CHECKPOINTS.filter((c) => c.phase === phase);
  const open = openCriteria(project, phase);
  const met = criteria.length - open.length;
  const override = overrideFor(project, phase);
  const ready = canPass(project, phase);
  const nextFirst = next && ACTIVITIES.find((a) => a.phase === next.id);

  const confirmOverride = () => {
    if (reason.trim().length < MIN_REASON) return;
    passWithOverride(phase, reason);
    setReason("");
    dialog.current?.close();
    onPassed(phase);
  };

  return (
    <div className="rounded-xl bg-canvas p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-tan">
        {state === "passed" ? <IconLockOpen size={14} aria-hidden /> : <IconLock size={14} aria-hidden />}
        Checkpoint · {met} of {criteria.length}
      </h3>

      <ul className="mt-2 space-y-1.5">
        {criteria.map((c) => {
          const checked = !!project.checks[c.id];
          return (
            <li key={c.id}>
              <label
                className={`flex gap-2 text-sm ${state === "locked" ? "cursor-not-allowed text-muted" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  disabled={state === "locked"}
                  onChange={() => toggleCheck(c.id)}
                />
                <span className="mt-0.5 shrink-0 rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-orange">
                  {checked ? (
                    <IconSquareCheckFilled size={18} className="text-orange" aria-hidden />
                  ) : (
                    <IconSquare size={18} className="text-faint" aria-hidden />
                  )}
                </span>
                {c.text}
              </label>
              {c.id === FIT_CRITERION && <FitEvidence />}
            </li>
          );
        })}
      </ul>

      {state === "current" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              pass(phase);
              onPassed(phase);
            }}
            className="rounded-full bg-orange px-4 py-1.5 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft disabled:cursor-not-allowed disabled:bg-surface disabled:font-normal disabled:text-faint"
          >
            Pass checkpoint
          </button>
          {!ready && next && (
            <button
              type="button"
              onClick={() => {
                dialog.current?.showModal();
                reasonBox.current?.focus();
              }}
              className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
            >
              Unlock without passing
            </button>
          )}
        </div>
      )}

      {justPassed && state === "passed" && (
        <div className="mt-4 flex items-start gap-3" role="status">
          <Mascot mood={override ? "alert" : "cheer"} size={48} />
          <div className="text-sm">
            <p className="font-medium">
              {override ? `${name} passed with an override.` : `${name} checkpoint passed.`}
            </p>
            {next ? (
              <p className="mt-0.5 text-muted">
                {next.name} is unlocked.{nextFirst && ` Next up: ${nextFirst.title.toLowerCase()}.`}
              </p>
            ) : (
              <p className="mt-0.5 text-muted">That was the last phase. The project is retired.</p>
            )}
          </div>
        </div>
      )}

      {override && state === "passed" && (
        <div className="mt-4 rounded-xl border border-dashed border-tan/50 p-3 text-sm">
          <p className="font-medium text-tan-soft">Override logged · {formatDate(override.at)}</p>
          <p className="mt-1 text-muted">{override.reason}</p>
          <p className="mt-2 text-xs text-faint">
            {open.length > 0
              ? `${open.length} ${open.length === 1 ? "criterion is" : "criteria are"} still open. Tick them above when they are done.`
              : "Every criterion is now met."}
          </p>
        </div>
      )}

      <dialog
        ref={dialog}
        aria-labelledby={`override-${phase}`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`override-${phase}`} className="flex items-center gap-2 font-display text-lg font-medium">
            <IconAlertTriangle size={20} className="text-orange" aria-hidden /> Unlock {next?.name} early?
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Cancel" className="text-faint hover:text-ink">
            <IconX size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {open.length} {name} {open.length === 1 ? "criterion is" : "criteria are"} not met:
        </p>
        <ul className="mt-1 list-disc pl-5 text-sm text-muted">
          {criteria
            .filter((c) => open.includes(c.id))
            .map((c) => (
              <li key={c.id}>{c.text}</li>
            ))}
        </ul>
        <label htmlFor={`reason-${phase}`} className="mt-4 block text-sm font-medium">
          Why are you going ahead?
        </label>
        <textarea
          ref={reasonBox}
          id={`reason-${phase}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1.5 w-full resize-y rounded-xl border border-line bg-canvas p-3 text-sm focus:border-orange focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-faint">
          At least {MIN_REASON} characters ({reason.trim().length} so far). Saved with today&apos;s date and shown on the phase.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full px-4 py-1.5 text-sm text-muted hover:text-ink">
            Cancel
          </button>
          <button
            type="button"
            disabled={reason.trim().length < MIN_REASON}
            onClick={confirmOverride}
            className="rounded-full bg-orange px-4 py-1.5 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft disabled:cursor-not-allowed disabled:bg-canvas disabled:font-normal disabled:text-faint"
          >
            Unlock with override
          </button>
        </div>
      </dialog>
    </div>
  );
}

/** The checkpoint criterion the Fit Check is evidence for: "AI is the right answer". */
const FIT_CRITERION = "C-102";

/**
 * The project's saved Fit Check result, under the criterion it supports.
 * Evidence only: it never ticks or blocks the criterion.
 */
function FitEvidence() {
  const { project } = useProject();
  const f = project.fitCheck;
  const href = `/fit-check?project=${encodeURIComponent(project.id)}`;
  const link = "ml-auto inline-flex items-center gap-1 text-orange hover:text-orange-soft";
  return (
    <div className="ml-[26px] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-canvas px-3 py-2 text-xs">
      {f ? (
        <>
          <span className={`rounded-full px-2 py-0.5 ${f.band === "good" ? "bg-steel-bg text-steel-soft" : "bg-orange-bg text-orange-soft"}`}>
            Fit Check {f.score} · {FIT_BANDS[f.band].title}
          </span>
          <span className="text-faint">saved {formatDate(f.at)}</span>
          <Link href={href} className={link}>
            Run it again <IconArrowRight size={12} aria-hidden />
          </Link>
          {f.band !== "good" && (
            <span className="basis-full text-muted">
              {f.capped ? "The cost of a mistake rules AI out" : "Below 70"}: write your reason to go ahead before ticking this.
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-faint">No Fit Check saved for this project.</span>
          <Link href={href} className={link}>
            Run the Fit Check <IconArrowRight size={12} aria-hidden />
          </Link>
        </>
      )}
    </div>
  );
}
