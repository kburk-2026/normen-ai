"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import PhaseChecklist from "@/components/workbench/PhaseChecklist";
import { PHASES, type PhaseId } from "@/content/phases";
import { ACTIVITIES } from "@/content/lifecycle";
import type { Section } from "@/content/demo";
import { formatDate } from "@/lib/format";
import { useProject } from "@/state/ProjectProvider";
import { phaseState } from "@/state/project";

/** One section page inside a phase: Overview, Checklist, or one of the user's own. */
export default function SectionView({ phase: phaseId, section }: { phase: PhaseId; section: Section }) {
  const { project, statusOf } = useProject();
  const [justPassed, setJustPassed] = useState<PhaseId | null>(null);
  const phase = PHASES.find((p) => p.id === phaseId)!;
  const acts = ACTIVITIES.filter((a) => a.phase === phaseId);
  const done = acts.filter((a) => statusOf(a.id) === "done").length;
  const state = phaseState(project, phaseId);
  const passedOn = project.passedAt[phaseId];

  return (
    <article>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        {phase.name} <IconChevronRight size={14} aria-hidden />{" "}
        <span className="text-ink">{section.title || "Untitled section"}</span>
      </p>
      {section.kind === "custom" ? (
        <EditableTitle phase={phaseId} section={section} />
      ) : (
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">{section.title}</h1>
      )}
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-faint">
        <span>Updated {formatDate(section.updatedAt.slice(0, 10))}</span>
        <span>
          Phase 0{phase.number} · {phase.name}
        </span>
        <span>
          {done} of {acts.length} activities done
        </span>
        <span>
          {state === "passed"
            ? `Checkpoint passed${passedOn ? ` ${formatDate(passedOn)}` : ""}`
            : state === "current"
              ? "In progress"
              : "Locked"}
        </span>
      </p>

      {section.kind === "checklist" ? (
        <div className="mt-6 rounded-2xl bg-surface px-5 pb-5">
          <h2 className="sr-only">Activities, guardrails and checkpoint</h2>
          <PhaseChecklist phase={phaseId} justPassed={justPassed === phaseId} onPassed={setJustPassed} />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-4 py-2 text-sm text-faint">
            <IconPlus size={16} aria-hidden /> Add a block
          </span>
          <p className="mt-2 text-xs text-faint">Text, callouts, tables and more arrive in the next release.</p>
        </div>
      )}
    </article>
  );
}

/** Custom sections are renamed by editing their title in place. */
function EditableTitle({ phase, section }: { phase: PhaseId; section: Section }) {
  const { renameSection } = useProject();
  const [value, setValue] = useState(section.title);
  const input = useRef<HTMLInputElement>(null);
  const isNew = useSearchParams().get("new") === "1";

  useEffect(() => setValue(section.title), [section.id, section.title]);
  useEffect(() => {
    if (!isNew) return;
    input.current?.select();
    // Drop ?new=1 so a reload does not select the title again.
    window.history.replaceState(null, "", window.location.pathname);
  }, [isNew, section.id]);

  const save = () => {
    const t = value.trim() || "Untitled section";
    setValue(t);
    if (t !== section.title) renameSection(phase, section.id, t);
  };

  return (
    <label className="mt-3 block">
      <span className="sr-only">Section title</span>
      <input
        ref={input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(section.title);
            e.currentTarget.blur();
          }
        }}
        maxLength={80}
        className="w-full rounded-lg bg-transparent font-display text-3xl font-medium tracking-tight text-ink hover:bg-surface focus:bg-surface focus:outline-none"
      />
    </label>
  );
}
