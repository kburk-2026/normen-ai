import { PHASES, type PhaseId } from "@/content/phases";
import { ACTIVITIES, CHECKPOINTS, GUARDRAILS } from "@/content/lifecycle";
import type { ActivityStatus, FitResult, Project } from "@/content/demo";
import { FIT_BANDS } from "@/content/fitCheck";
import { logByDay } from "@/state/log";
import { STATUS_ORDER, allMetrics, recordOf, statusCounts, statusOf } from "@/state/scorecard";
import { accuracyFloor, pastAlert } from "@/state/pulse";
import { coverage, requiredFor, stateOf, tierExplanation } from "@/state/guardrails";
import { daysBetween, phaseSpans, timelineEvents } from "@/state/timeline";
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
import { openCriteria, overrideFor, phaseState } from "@/state/project";
import { formatDate } from "./format";
import { hostOf } from "./media";
import { cautiousInputs, hoursText, isReady, money, paybackText, roiResult, workingLines } from "./roi";
import type { RoiModel } from "@/content/roi";

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
  out.push(...scorecardToMarkdown(project));
  out.push(...timelineToMarkdown(project, exportedOn));
  out.push(...guardrailsToMarkdown(project));
  out.push(...roiToMarkdown("## ROI", project.roi));
  out.push(...pulseToMarkdown(project));
  if (project.log.length) {
    out.push("", "## Changelog", "");
    for (const d of logByDay(project.log)) for (const e of d.entries) out.push(`- ${formatDate(d.day)}: ${e.text}`);
  }
  return out.join("\n") + "\n";
}

/** The saved Fit Check result in one sentence, shared by the Markdown and print exports. */
export function fitCheckLine(f: FitResult) {
  return `Fit Check: ${f.score} out of 100 (${FIT_BANDS[f.band].title}), saved ${formatDate(f.at)}.`;
}

/** The Scorecard: each phase's measures with target, latest reading and status, then every reading. */
function scorecardToMarkdown(project: Project): string[] {
  const card = project.scorecard;
  const metrics = allMetrics(card);
  const counts = statusCounts(card);
  const out = ["", "## Scorecard", "", STATUS_ORDER.map((s) => `${counts[s]} ${s.toLowerCase()}`).join(", ") + "."];
  for (const phase of PHASES) {
    const rows = metrics.filter((m) => m.phase === phase.id);
    if (!rows.length) continue;
    out.push("", `### 0${phase.number} ${phase.name}`, "");
    out.push(
      ...table([
        ["Measure", "Target", "Latest", "Status"],
        ...rows.map((m) => {
          const rec = recordOf(card, m.id);
          const last = rec.readings.at(-1);
          return [m.metric, rec.target, last ? `${last.value} (${formatDate(last.date)})` : "", statusOf(card, m.id)];
        }),
      ]),
    );
    const readings = rows.flatMap((m) => recordOf(card, m.id).readings.map((r) => ({ m, r })));
    if (readings.length) {
      readings.sort((a, b) => a.r.date.localeCompare(b.r.date));
      out.push("", "Readings:", "", ...table([["Date", "Measure", "Value", "Verdict", "Note"], ...readings.map(({ m, r }) => [formatDate(r.date), m.metric, r.value, r.verdict, r.note])]));
    }
  }
  return out;
}

/** Timeline: each phase's dates, then every dated milestone and decision. */
function timelineToMarkdown(project: Project, today: string): string[] {
  const spans = phaseSpans(project, today);
  const events = timelineEvents(project, today);
  const out = ["", "## Timeline", ""];
  out.push(
    ...table([
      ["Phase", "Started", "Passed, or target", "Days"],
      ...spans.map((s) => [
        phaseLabelOf(s.phase),
        s.start ? formatDate(s.start) : "",
        s.state === "passed"
          ? `${s.end ? `Passed ${formatDate(s.end)}` : "Passed (date not recorded)"}${s.override ? " (override)" : ""}`
          : s.target
            ? `Target ${formatDate(s.target)}`
            : "",
        s.start && s.end ? `${daysBetween(s.start, s.end)}${s.state === "current" ? " so far" : ""}` : "",
      ]),
    ]),
  );
  if (events.length)
    out.push("", ...table([["Date", "Milestone or decision", "From"], ...events.map((e) => [formatDate(e.date), e.text, `${e.from}${e.overdue ? " (overdue)" : ""}`])]));
  return out;
}

/** An ROI model: inputs, expected and cautious results, and the working. Left out until the main numbers are in. */
function roiToMarkdown(heading: string, model: RoiModel): string[] {
  const { inputs, currency } = model;
  if (!isReady(inputs)) return [];
  const e = roiResult(inputs);
  const c = roiResult(cautiousInputs(inputs));
  const m = (v: number) => money(v, currency);
  const v = (x: number | null, unit = "") => (x === null ? "" : unit === "money" ? m(x) : `${x.toLocaleString("en-US")}${unit}`);
  return [
    "",
    heading,
    "",
    ...table([
      ["Input", "Value"],
      ["Tasks per month", v(inputs.tasks)],
      ["Minutes saved per task", v(inputs.minutes)],
      ["Cost of an hour of that work", v(inputs.hourly, "money")],
      ["Share of tasks it handles", v(inputs.adoption, "%")],
      ["Other yearly benefit", v(inputs.other, "money")],
      ["To build, once", v(inputs.build, "money")],
      ["To run, per year", v(inputs.running, "money")],
      ["People to look after it, per year", v(inputs.people, "money")],
    ]),
    "",
    ...table([
      ["Result", "Expected", "Cautious (half the share, half the minutes)"],
      ["Hours saved a year", hoursText(e.hours), hoursText(c.hours)],
      ["Saved a year", m(e.benefit), m(c.benefit)],
      ["Net a year", m(e.net), m(c.net)],
      ["Pays back the build in", paybackText(e.payback), paybackText(c.payback)],
      ["After three years", m(e.threeYear), m(c.threeYear)],
    ]),
    "",
    "Working (expected case):",
    "",
    ...workingLines(inputs, currency).map((l) => `- ${l}`),
  ];
}

/** Guardrails: the risk tier, what set it, and every guardrail's status. */
function guardrailsToMarkdown(project: Project): string[] {
  const plan = project.guardrails;
  const c = coverage(plan);
  const required = new Set(c.tier ? requiredFor(c.tier) : []);
  const out = ["", "## Guardrails", ""];
  out.push(
    c.tier
      ? `Risk tier: ${c.tier}, ${lowerFirst(tierExplanation(plan))}. ${c.inPlace} of ${c.required} required guardrails in place.`
      : `Risk tier not set (${c.answered} of 5 questions answered).`,
    "",
    ...table([
      ["Phase", "Guardrail", "Required", "Status", "Why not needed"],
      ...GUARDRAILS.map((g) => {
        const st = stateOf(plan, g.id);
        return [phaseLabelOf(g.phase), g.title, required.has(g.id) ? "Yes" : "", st.status, st.status === "Not needed" ? st.reason : ""];
      }),
    ]),
  );
  return out;
}

const phaseLabelOf = (id: PhaseId) => PHASES.find((p) => p.id === id)?.name ?? id;

/** Pulse: the alert lines, every weekly check-in, and the incident log. Left out when nothing is logged. */
function pulseToMarkdown(project: Project): string[] {
  const { checkIns, incidents, alerts } = project.pulse;
  if (!checkIns.length && !incidents.length) return [];
  const out = ["", "## Pulse"];
  const floor = accuracyFloor(alerts);
  const lines = [
    alerts.flaggedAbove !== null ? `flagged outputs above ${alerts.flaggedAbove}%` : null,
    floor !== null ? `accuracy at or below ${floor}%` : null,
  ].filter(Boolean);
  if (lines.length) out.push("", `Alert lines: ${lines.join(", ")}.`);
  if (checkIns.length) {
    const n = (v: number | null, unit = "") => (v === null ? "" : `${v}${unit}`);
    out.push(
      "",
      "### Check-ins",
      "",
      ...table([
        ["Week of", "Uses", "Flagged", "Accuracy", "Past an alert line", "Note"],
        ...checkIns.map((c) => [formatDate(c.week), n(c.uses), n(c.flagged, "%"), n(c.accuracy, "%"), pastAlert(c, alerts) ? "Yes" : "", c.note]),
      ]),
    );
  }
  if (incidents.length) {
    out.push(
      "",
      "### Incidents",
      "",
      ...table([
        ["#", "Date", "What happened", "Severity", "Status", "What was done", "Resolved"],
        ...[...incidents].reverse().map((i) => [String(i.number), formatDate(i.date), i.what, i.severity, i.status, i.action, i.resolved ? formatDate(i.resolved) : ""]),
      ]),
    );
  }
  return out;
}

/** A phase's Checklist: activities, checkpoint criteria and any override. */
function checklistToMarkdown(project: Project, phaseId: PhaseId): string[] {
  const out: string[] = [];
  for (const a of ACTIVITIES.filter((x) => x.phase === phaseId))
    out.push(`- ${BOX[project.activities[a.id] ?? "todo"]} ${a.id} ${a.title}`);

  out.push("", "**Checkpoint**", "");
  for (const c of CHECKPOINTS.filter((x) => x.phase === phaseId)) out.push(`- ${project.checks[c.id] ? "[x]" : "[ ]"} ${c.text}`);
  if (phaseId === "conceive" && project.fitCheck) out.push("", fitCheckLine(project.fitCheck));

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

/** Text safe to put inside a Markdown link's square brackets. */
const mdText = (t: string) => t.trim().replace(/[\[\]]/g, "");

const dateOr = (d: string, none = "") => (d ? formatDate(d) : none);

/** A Markdown table; row 0 is the header. */
function table(rows: string[][]): string[] {
  const [head, ...body] = rows;
  return [`| ${head.map(cell).join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.map(cell).join(" | ")} |`)];
}

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
    else if (b.type === "table") out.push(...table(b.rows));
    else if (b.type === "decision") {
      const rows = filledDecisions(b).map((r) => [r.decision, dateOr(r.date), r.by, r.why, r.status]);
      out.push("**Decision Log**", "", ...table([["Decision", "Date", "Made by", "Why", "Status"], ...rows]));
    } else if (b.type === "approval") {
      const rows = filledApprovals(b);
      const approved = rows.filter((r) => r.status === "Approved").length;
      out.push(
        `**Approval Tracker** (${approved} of ${rows.length} approved)`,
        "",
        ...table([["Approval", "Approver", "Date", "Status"], ...rows.map((r) => [r.item, r.who, dateOr(r.date), r.status])]),
      );
    } else if (b.type === "timeline") {
      out.push("**Timeline**", "");
      for (const m of filledMilestones(b)) out.push(`- ${m.done ? "[x]" : "[ ]"} ${dateOr(m.date, "No date")}: ${m.text.trim()}`);
    } else if (b.type === "roi") {
      out.push(...roiToMarkdown(`**${mdText(b.title) || "ROI estimate"}**`, b.model));
    } else if (b.type === "image") {
      out.push(`![${b.alt.trim().replace(/[\[\]\n]/g, " ")}](${b.url.trim()})`);
      if (b.caption.trim()) out.push("", `*${b.caption.trim().replace(/\n+/g, " ")}*`);
    } else if (b.type === "video") {
      out.push(`Video: [${mdText(b.title) || hostOf(b.url)}](${b.url.trim()})`);
    } else if (b.type === "links") {
      out.push("**Files and links**", "");
      for (const r of filledLinks(b)) out.push(`- [${mdText(r.title) || hostOf(r.url)}](${r.url.trim()})${r.note.trim() ? `: ${r.note.trim()}` : ""}`);
    } else if (b.type === "risk") {
      const { high, open } = riskCounts(b);
      out.push(
        `**Risk Register** (${high} high, ${open} open)`,
        "",
        ...table([
          ["Risk", "Level", "Type", "Likelihood", "Impact", "Plan", "Owner", "Status"],
          ...filledRisks(b).map((r) => [r.risk, riskLevel(r), r.category, r.likelihood, r.impact, r.plan, r.owner, r.status]),
        ]),
      );
    } else if (b.type === "modelcard") {
      out.push(`**Model Card**${b.reviewed ? ` (reviewed ${formatDate(b.reviewed)})` : ""}`, "");
      for (const f of filledModelFields(b)) out.push(`- **${f.label}:** ${b.fields[f.key].trim().replace(/\n+/g, " ")}`);
      const metrics = filledMetrics(b);
      if (metrics.length) out.push("", ...table([["Measure", "Result", "Target"], ...metrics.map((m) => [m.name, m.result, m.target])]));
    } else if (b.type === "sources") {
      const rows = filledSources(b);
      out.push(
        `**Data Sources** (${rows.filter((r) => r.personal === "Yes").length} with personal data)`,
        "",
        ...table([
          ["Source", "What it holds", "Owner", "Updated", "Personal data", "Access"],
          ...rows.map((r) => [r.name, r.what, r.owner, r.refresh, r.personal, r.access]),
        ]),
      );
    } else {
      out.push("**SWOT**");
      for (const k of SWOT_KEYS) {
        const items = filledItems(b[k]);
        out.push("", `*${SWOT_LABEL[k].name}*`, "", ...(items.length ? items.map((x) => `- ${x.trim().replace(/\n/g, " ")}`) : ["- Nothing listed."]));
      }
    }
  }
  return out;
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

/** Lowercase only the first letter, so names inside the sentence keep their capitals. */
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
