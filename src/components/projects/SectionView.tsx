"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconChevronRight, IconEye, IconPencil } from "@tabler/icons-react";
import BlockEditor from "@/components/blocks/BlockEditor";
import PhaseChecklist from "@/components/workbench/PhaseChecklist";
import { PHASES, type PhaseId } from "@/content/phases";
import { ACTIVITIES } from "@/content/lifecycle";
import type { Section } from "@/content/demo";
import { formatDate, localDay } from "@/lib/format";
import { useProject, useWorkspace } from "@/state/ProjectProvider";
import { useEditMode, type Mode } from "@/state/editMode";
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
  const [mode, setMode] = useEditMode();
  const writable = section.kind !== "checklist";
  const edit = writable && mode === "edit";
  // A section just added from the sidebar opens in Edit, so its title can be typed straight away.
  const isNew = useSearchParams().get("new") === "1";
  useEffect(() => {
    if (isNew && mode === "view") setMode("edit");
  }, [isNew, mode, setMode]);

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {phase.name} <IconChevronRight size={14} aria-hidden />{" "}
          <span className="text-ink">{section.title || "Untitled section"}</span>
        </p>
        {writable && (
          <div className="flex items-center gap-3 print:hidden">
            {edit && <SaveStatus />}
            <ModeSwitch mode={mode} onChange={setMode} />
          </div>
        )}
      </div>
      {section.kind === "custom" && edit ? (
        <EditableTitle phase={phaseId} section={section} />
      ) : (
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">{section.title || "Untitled section"}</h1>
      )}
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-faint">
        <span>Updated {formatDate(localDay(section.updatedAt))}</span>
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
        <BlockEditor key={section.id} phase={phaseId} section={section} mode={edit ? "edit" : "view"} />
      )}
    </article>
  );
}

/** Edit shows the block controls; View shows the page as a reader sees it. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options = [
    { value: "edit", label: "Edit", icon: IconPencil },
    { value: "view", label: "View", icon: IconEye },
  ] as const;
  return (
    <div role="group" aria-label="Page mode" className="flex rounded-full bg-surface p-1 text-sm">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
            mode === value ? "bg-canvas text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <Icon size={15} aria-hidden /> {label}
        </button>
      ))}
    </div>
  );
}

/** Whether the latest change is stored in this browser. */
function SaveStatus() {
  const { saveState } = useWorkspace();
  if (saveState === "error")
    return (
      <span role="alert" className="text-xs text-tan-soft">
        Not saved: this browser&apos;s storage is full or blocked
      </span>
    );
  return <span className="font-mono text-xs text-faint">{saveState === "saving" ? "Saving…" : "Saved"}</span>;
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
