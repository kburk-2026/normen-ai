"use client";

import { PHASES } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import { useProject } from "@/state/ProjectProvider";
import { openCriteria, overrideFor } from "@/state/project";
import { phaseLabel } from "@/lib/exportProject";
import { formatDate, today } from "@/lib/format";
import { CALLOUT_LABEL, isEmptyBlock, type Block } from "@/content/blocks";

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
          <section key={phase.id} className="mt-5">
            <h2 className="break-after-avoid border-b border-neutral-300 pb-1 font-display text-base font-medium">
              0{phase.number} {phase.name} · {phaseLabel(project, phase.id)}
            </h2>
            {project.sections[phase.id].map((section) => {
              if (section.kind !== "checklist") {
                const blocks = section.blocks.filter((x) => !isEmptyBlock(x));
                return blocks.length ? (
                  <div key={section.id} className="mt-2">
                    <h3 className="text-[9pt] font-medium uppercase tracking-wide text-neutral-500">
                      {section.title || "Untitled section"}
                    </h3>
                    <PrintBlocks blocks={blocks} />
                  </div>
                ) : null;
              }
              return (
                <div key={section.id} className="mt-2">
                  <h3 className="text-[9pt] font-medium uppercase tracking-wide text-neutral-500">{section.title}</h3>
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
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/** A section's blocks in print: black on white, callouts as a ruled box, tables with borders. */
function PrintBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="mt-1 space-y-2">
      {blocks.map((b) => {
        if (b.type === "text") return <p key={b.id} className="whitespace-pre-line">{b.text}</p>;
        if (b.type === "divider") return <hr key={b.id} className="border-neutral-300" />;
        if (b.type === "callout")
          return (
            <p key={b.id} className="whitespace-pre-line border-l-2 border-neutral-500 pl-2">
              <span className="font-medium">{CALLOUT_LABEL[b.tone]}:</span> {b.text}
            </p>
          );
        const [head, ...body] = b.rows;
        return (
          <table key={b.id} className="w-full break-inside-avoid border-collapse text-[10pt]">
            <thead>
              <tr>
                {head.map((c, i) => (
                  <th key={i} scope="col" className="border border-neutral-400 px-1.5 py-0.5 text-left font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="whitespace-pre-line border border-neutral-400 px-1.5 py-0.5 align-top">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}
