"use client";

import { PHASES } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import { useProject } from "@/state/ProjectProvider";
import { openCriteria, overrideFor } from "@/state/project";
import { fitCheckLine, phaseLabel } from "@/lib/exportProject";
import { formatDate, today } from "@/lib/format";
import {
  CALLOUT_LABEL,
  SWOT_KEYS,
  SWOT_LABEL,
  filledApprovals,
  filledDecisions,
  filledItems,
  filledLinks,
  filledMetrics,
  filledMilestones,
  filledModelFields,
  filledRisks,
  filledSources,
  isEmptyBlock,
  riskCounts,
  riskLevel,
  type Block,
} from "@/content/blocks";

const MARK = { done: "☑", doing: "◐", todo: "☐" } as const;

/** Print-only view of the project: all phases expanded, black on white. The PDF export prints this. */
/**
 * `withImages` loads image blocks' pictures. It is off until the PDF button asks, so
 * this hidden view never fetches from other sites in the background; printing with
 * the browser's own shortcut prints each image's description and address instead.
 */
export default function ProjectPrint({ withImages }: { withImages: boolean }) {
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
                    <PrintBlocks blocks={blocks} withImages={withImages} />
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
                  {phase.id === "conceive" && project.fitCheck && <p className="mt-1">{fitCheckLine(project.fitCheck)}</p>}
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
function PrintBlocks({ blocks, withImages }: { blocks: Block[]; withImages: boolean }) {
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
        if (b.type === "table") return <PrintTable key={b.id} rows={b.rows} />;
        if (b.type === "decision")
          return (
            <PrintTitled key={b.id} title="Decision Log">
              <PrintTable
                rows={[
                  ["Decision", "Date", "Made by", "Why", "Status"],
                  ...filledDecisions(b).map((r) => [r.decision, r.date ? formatDate(r.date) : "", r.by, r.why, r.status]),
                ]}
              />
            </PrintTitled>
          );
        if (b.type === "approval") {
          const rows = filledApprovals(b);
          return (
            <PrintTitled key={b.id} title={`Approval Tracker · ${rows.filter((r) => r.status === "Approved").length} of ${rows.length} approved`}>
              <PrintTable
                rows={[["Approval", "Approver", "Date", "Status"], ...rows.map((r) => [r.item, r.who, r.date ? formatDate(r.date) : "", r.status])]}
              />
            </PrintTitled>
          );
        }
        if (b.type === "timeline")
          return (
            <PrintTitled key={b.id} title="Timeline">
              <ul>
                {filledMilestones(b).map((m) => (
                  <li key={m.id}>
                    {m.done ? "☑" : "☐"} <span className="text-neutral-600">{m.date ? formatDate(m.date) : "No date"}:</span> {m.text}
                  </li>
                ))}
              </ul>
            </PrintTitled>
          );
        if (b.type === "image")
          return (
            <figure key={b.id} className="break-inside-avoid">
              {withImages ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.url.trim()} alt={b.alt} referrerPolicy="no-referrer" className="max-h-[80mm] max-w-full" />
              ) : (
                <p>
                  <span className="font-medium">Image:</span> {b.alt.trim() || "No description"}{" "}
                  <span className="break-all font-mono text-[9pt] text-neutral-600">{b.url.trim()}</span>
                </p>
              )}
              {b.caption.trim() && <figcaption className="mt-0.5 text-[9pt] text-neutral-600">{b.caption}</figcaption>}
            </figure>
          );
        if (b.type === "video")
          return (
            <p key={b.id}>
              <span className="font-medium">Video:</span> {b.title.trim() || "Untitled video"}{" "}
              <span className="break-all font-mono text-[9pt] text-neutral-600">{b.url.trim()}</span>
            </p>
          );
        if (b.type === "links")
          return (
            <PrintTitled key={b.id} title="Files and links">
              <ul className="list-disc pl-4">
                {filledLinks(b).map((r) => (
                  <li key={r.id}>
                    {r.title.trim() || r.url.trim()}
                    {r.note.trim() && `: ${r.note.trim()}`}{" "}
                    <span className="break-all font-mono text-[9pt] text-neutral-600">{r.url.trim()}</span>
                  </li>
                ))}
              </ul>
            </PrintTitled>
          );
        if (b.type === "risk") {
          const { high, open } = riskCounts(b);
          return (
            <PrintTitled key={b.id} title={`Risk Register · ${high} high, ${open} open`}>
              <PrintTable
                rows={[
                  ["Risk", "Level", "Type", "Plan", "Owner", "Status"],
                  ...filledRisks(b).map((r) => [
                    r.risk,
                    `${riskLevel(r)} (likelihood ${r.likelihood.toLowerCase()}, impact ${r.impact.toLowerCase()})`,
                    r.category,
                    r.plan,
                    r.owner,
                    r.status,
                  ]),
                ]}
              />
            </PrintTitled>
          );
        }
        if (b.type === "modelcard") {
          const metrics = filledMetrics(b);
          return (
            <PrintTitled key={b.id} title={`Model Card${b.reviewed ? ` · reviewed ${formatDate(b.reviewed)}` : ""}`}>
              {filledModelFields(b).map((f) => (
                <p key={f.key} className="whitespace-pre-line">
                  <span className="font-medium">{f.label}:</span> {b.fields[f.key]}
                </p>
              ))}
              {metrics.length > 0 && (
                <div className="mt-1">
                  <PrintTable rows={[["Measure", "Result", "Target"], ...metrics.map((m) => [m.name, m.result, m.target])]} />
                </div>
              )}
            </PrintTitled>
          );
        }
        if (b.type === "sources") {
          const rows = filledSources(b);
          return (
            <PrintTitled key={b.id} title={`Data Sources · ${rows.filter((r) => r.personal === "Yes").length} with personal data`}>
              <PrintTable
                rows={[
                  ["Source", "What it holds", "Owner", "Updated", "Personal data", "Access"],
                  ...rows.map((r) => [r.name, r.what, r.owner, r.refresh, r.personal, r.access]),
                ]}
              />
            </PrintTitled>
          );
        }
        return (
          <PrintTitled key={b.id} title="SWOT">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {SWOT_KEYS.map((k) => (
                <div key={k} className="break-inside-avoid">
                  <p className="font-medium">{SWOT_LABEL[k].name}</p>
                  <ul className="list-disc pl-4">
                    {filledItems(b[k]).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </PrintTitled>
        );
      })}
    </div>
  );
}

function PrintTitled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <p className="font-medium">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

/** A bordered table; row 0 is the header. */
function PrintTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <table className="w-full break-inside-avoid border-collapse text-[10pt]">
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
}
