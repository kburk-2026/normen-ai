import { PHASES, type PhaseId } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import type { ActivityStatus, Project } from "@/content/demo";
import { CALLOUT_LABEL, isEmptyBlock, type Block } from "@/content/blocks";
import { openCriteria, overrideFor, phaseState } from "@/state/project";
import { formatDate } from "./format";

const BOX: Record<ActivityStatus, string> = { done: "[x]", doing: "[~]", todo: "[ ]" };

/** A phase's status in words, shared by the Markdown and print exports. */
export function phaseLabel(project: Project, phaseId: (typeof PHASES)[number]["id"]) {
  const state = phaseState(project, phaseId);
  if (state === "passed")
    return overrideFor(project, phaseId) && openCriteria(project, phaseId).length > 0
      ? "Passed with override"
      : "Checkpoint passed";
  return state === "current" ? "In progress" : "Locked";
}

/** The whole project as Markdown: every phase, activity, checkpoint criterion and override. */
export function projectToMarkdown(project: Project, exportedOn: string): string {
  const status = (id: string) => project.activities[id] ?? "todo";
  const done = ACTIVITIES.filter((a) => status(a.id) === "done").length;
  const out: string[] = [
    `# ${project.name}`,
    "",
    project.blurb,
    "",
    `Exported from Normen AI on ${formatDate(exportedOn)}. ${done} of ${ACTIVITIES.length} activities done.`,
    "",
    "Key: [x] done, [~] in progress, [ ] to do.",
  ];

  for (const phase of PHASES) {
    out.push("", `## 0${phase.number} ${phase.name}: ${phaseLabel(project, phase.id).toLowerCase()}`, "", phase.summary);
    // Sections in their page order: written sections as headed blocks, the Checklist as activities and checkpoint.
    for (const section of project.sections[phase.id]) {
      if (section.kind !== "checklist") {
        const md = blocksToMarkdown(section.blocks);
        if (md.length) out.push("", `### ${section.title || "Untitled section"}`, "", ...md);
        continue;
      }
      out.push("", `### ${section.title}`, "", ...checklistToMarkdown(project, phase.id));
    }
  }
  return out.join("\n") + "\n";
}

/** A phase's Checklist: activities, checkpoint criteria and any override. */
function checklistToMarkdown(project: Project, phaseId: PhaseId): string[] {
  const out: string[] = [];
  for (const a of ACTIVITIES.filter((x) => x.phase === phaseId))
    out.push(`- ${BOX[project.activities[a.id] ?? "todo"]} ${a.id} ${a.title}`);

  out.push("", "**Checkpoint**", "");
  for (const c of CHECKPOINTS.filter((x) => x.phase === phaseId)) out.push(`- ${project.checks[c.id] ? "[x]" : "[ ]"} ${c.text}`);

  const o = overrideFor(project, phaseId);
  if (o) {
    out.push("", `> Override logged ${formatDate(o.at)}: ${o.reason}`);
    const open = openCriteria(project, phaseId);
    const texts = CHECKPOINTS.filter((c) => open.includes(c.id)).map((c) => c.text);
    out.push(`> ${texts.length ? `Still open: ${texts.join(" ")}` : "Every criterion is now met."}`);
  }
  return out;
}

/** Plain text keeps its line breaks: lines inside a paragraph end with a Markdown hard break. */
function lines(text: string) {
  const ls = text.trim().split("\n");
  return ls.map((l, i) => (l.trim() && ls[i + 1]?.trim() ? `${l}  ` : l));
}

const cell = (c: string) => c.trim().replace(/\|/g, "\\|").replace(/\n/g, "<br>") || " ";

/** A section's blocks as Markdown lines, with a blank line between blocks. Empty blocks are skipped. */
export function blocksToMarkdown(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const b of blocks.filter((x) => !isEmptyBlock(x))) {
    if (out.length) out.push("");
    if (b.type === "text") out.push(...lines(b.text));
    else if (b.type === "callout") {
      const [first, ...rest] = lines(b.text);
      out.push(`> **${CALLOUT_LABEL[b.tone]}:** ${first}`, ...rest.map((l) => (l ? `> ${l}` : ">")));
    } else if (b.type === "divider") out.push("---");
    else {
      const [head, ...body] = b.rows;
      out.push(`| ${head.map(cell).join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`);
      for (const r of body) out.push(`| ${r.map(cell).join(" | ")} |`);
    }
  }
  return out;
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}
