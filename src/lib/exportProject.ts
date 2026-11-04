import { PHASES } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS } from "@/content/lifecycle";
import type { ActivityStatus, Project } from "@/content/demo";
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
    out.push("", `## 0${phase.number} ${phase.name}: ${phaseLabel(project, phase.id).toLowerCase()}`, "", phase.summary, "");
    for (const a of ACTIVITIES.filter((x) => x.phase === phase.id)) out.push(`- ${BOX[status(a.id)]} ${a.id} ${a.title}`);

    out.push("", "**Checkpoint**", "");
    for (const c of CHECKPOINTS.filter((x) => x.phase === phase.id))
      out.push(`- ${project.checks[c.id] ? "[x]" : "[ ]"} ${c.text}`);

    const o = overrideFor(project, phase.id);
    if (o) {
      out.push("", `> Override logged ${formatDate(o.at)}: ${o.reason}`);
      const open = openCriteria(project, phase.id);
      const texts = CHECKPOINTS.filter((c) => open.includes(c.id)).map((c) => c.text);
      out.push(`> ${texts.length ? `Still open: ${texts.join(" ")}` : "Every criterion is now met."}`);
    }
  }
  return out.join("\n") + "\n";
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}
