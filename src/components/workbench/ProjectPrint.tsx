"use client";

import { PHASES } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import { useProject } from "@/state/ProjectProvider";
import { openCriteria, overrideFor } from "@/state/project";
import { phaseLabel } from "@/lib/exportProject";
import { formatDate, today } from "@/lib/format";

const MARK = { done: "☑", doing: "◐", todo: "☐" } as const;

/** Print-only view of the project: all phases expanded, black on white. The PDF export prints this. */
export default function ProjectPrint() {
  const { project, statusOf } = useProject();
  const done = ACTIVITIES.filter((a) => statusOf(a.id) === "done").length;

  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block">
      <h1 className="font-display text-2xl font-medium">{project.name}</h1>
      <p className="mt-1 text-neutral-600">{project.blurb}</p>
      <p className="mt-1 text-[9pt] text-neutral-500" suppressHydrationWarning>
        Normen AI project export · {formatDate(today())} · {done} of {ACTIVITIES.length} activities done · ☑ done, ◐ in
        progress, ☐ to do
      </p>

      {PHASES.map((phase) => {
        const o = overrideFor(project, phase.id);
        const open = openCriteria(project, phase.id);
        return (
          <section key={phase.id} className="mt-5 break-inside-avoid">
            <h2 className="border-b border-neutral-300 pb-1 font-display text-base font-medium">
              0{phase.number} {phase.name} · {phaseLabel(project, phase.id)}
            </h2>
            <ul className="mt-1.5">
              {ACTIVITIES.filter((a) => a.phase === phase.id).map((a) => (
                <li key={a.id}>
                  {MARK[statusOf(a.id)]} <span className="font-mono text-[9pt] text-neutral-500">{a.id}</span> {a.title}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[9pt] font-medium uppercase tracking-wide text-neutral-500">Checkpoint</p>
            <ul>
              {CHECKPOINTS.filter((c) => c.phase === phase.id).map((c) => (
                <li key={c.id}>
                  {project.checks[c.id] ? "☑" : "☐"} {c.text}
                </li>
              ))}
            </ul>
            {o && (
              <p className="mt-2 border-l-2 border-neutral-400 pl-2 text-neutral-700">
                Override logged {formatDate(o.at)}: {o.reason}{" "}
                {open.length === 0
                  ? "Every criterion is now met."
                  : `${open.length} ${open.length === 1 ? "criterion is" : "criteria are"} still open.`}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
