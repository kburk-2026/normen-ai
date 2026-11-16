/**
 * Blocks: the pieces of content inside a section. Milestone 8 shipped the
 * basics, milestone 9 the governance blocks, milestone 10 the AI blocks and
 * milestone 11 the media blocks.
 */

import { isWebUrl, videoSource } from "@/lib/media";
import { isReady, normalizeRoi } from "@/lib/roi";
import { emptyRoi, type RoiModel } from "./roi";

export const CALLOUT_TONES = ["note", "warning", "decision"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export type TextBlock = { id: string; type: "text"; text: string };
export type CalloutBlock = { id: string; type: "callout"; tone: CalloutTone; text: string };
export type DividerBlock = { id: string; type: "divider" };
/** Row 0 is the header row. Every row has the same number of cells. */
export type TableBlock = { id: string; type: "table"; rows: string[][] };

// ---- Governance blocks (milestone 9) ----

export const DECISION_STATUSES = ["Open", "Made", "On hold", "Superseded"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];
export const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected", "On hold"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** Dates are "YYYY-MM-DD" or "" when not set. */
export type DecisionRow = { id: string; decision: string; date: string; by: string; why: string; status: DecisionStatus };
export type DecisionBlock = { id: string; type: "decision"; rows: DecisionRow[] };
export type ApprovalRow = { id: string; item: string; who: string; date: string; status: ApprovalStatus };
export type ApprovalBlock = { id: string; type: "approval"; rows: ApprovalRow[] };
export type Milestone = { id: string; text: string; date: string; done: boolean };
/** Items are kept in date order, undated last. */
export type TimelineBlock = { id: string; type: "timeline"; items: Milestone[] };
export const SWOT_KEYS = ["s", "w", "o", "t"] as const;
export type SwotKey = (typeof SWOT_KEYS)[number];
export type SwotBlock = { id: string; type: "swot" } & Record<SwotKey, string[]>;
export const SWOT_LABEL: Record<SwotKey, { name: string; axis: string }> = {
  s: { name: "Strengths", axis: "Internal, helps" },
  w: { name: "Weaknesses", axis: "Internal, hurts" },
  o: { name: "Opportunities", axis: "External, helps" },
  t: { name: "Threats", axis: "External, hurts" },
};

// ---- AI blocks (milestone 10). Claude's additions, not from the course material. ----

export const RISK_LEVELS = ["Low", "Medium", "High"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_CATEGORIES = ["Privacy", "Bias", "Accuracy", "Security", "Misuse", "Operations"] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export const RISK_STATUSES = ["Open", "Mitigating", "Accepted", "Closed"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];
export type RiskRow = {
  id: string;
  risk: string;
  /** How the risk will be reduced or handled. */
  plan: string;
  category: RiskCategory;
  likelihood: RiskLevel;
  impact: RiskLevel;
  owner: string;
  status: RiskStatus;
};
export type RiskBlock = { id: string; type: "risk"; rows: RiskRow[] };

/** Likelihood times impact on a 3 by 3 grid: 1-2 low, 3-4 medium, 6-9 high. Never stored, always worked out. */
export function riskLevel(r: Pick<RiskRow, "likelihood" | "impact">): RiskLevel {
  const score = (RISK_LEVELS.indexOf(r.likelihood) + 1) * (RISK_LEVELS.indexOf(r.impact) + 1);
  return score >= 6 ? "High" : score >= 3 ? "Medium" : "Low";
}

/** The Model Card's fixed questions, in display order. "wide" fields take the full width. */
export const MODEL_FIELDS = [
  { key: "name", label: "Model", wide: false },
  { key: "version", label: "Version", wide: false },
  { key: "kind", label: "Type and source", wide: false },
  { key: "owner", label: "Owner", wide: false },
  { key: "use", label: "Intended use", wide: true },
  { key: "notFor", label: "Not for", wide: true },
  { key: "data", label: "Training data", wide: true },
  { key: "limits", label: "Known limits", wide: true },
  { key: "oversight", label: "Human oversight", wide: true },
] as const;
export type ModelField = (typeof MODEL_FIELDS)[number]["key"];
export type MetricRow = { id: string; name: string; result: string; target: string };
export type ModelCardBlock = {
  id: string;
  type: "modelcard";
  fields: Record<ModelField, string>;
  /** Date last reviewed, or "". */
  reviewed: string;
  metrics: MetricRow[];
};

export const PERSONAL_DATA = ["Yes", "No", "Not sure"] as const;
export type PersonalData = (typeof PERSONAL_DATA)[number];
export const ACCESS_STATUSES = ["Not requested", "Requested", "Approved"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];
export type SourceRow = {
  id: string;
  name: string;
  what: string;
  owner: string;
  /** How often the data updates, in the user's words. */
  refresh: string;
  personal: PersonalData;
  access: AccessStatus;
};
export type SourcesBlock = { id: string; type: "sources"; rows: SourceRow[] };

// ---- Media blocks (milestone 11). Web addresses only: no uploads until phase 3 storage. ----

export type ImageBlock = {
  id: string;
  type: "image";
  url: string;
  /** What the image shows, for people who cannot see it. Empty for decoration. */
  alt: string;
  caption: string;
};
export type VideoBlock = { id: string; type: "video"; url: string; title: string };
export type LinkRow = { id: string; title: string; url: string; note: string };
export type LinksBlock = { id: string; type: "links"; rows: LinkRow[] };

// ---- ROI calculator block (milestone 16): a scenario of its own, separate from the project's ROI page. ----
export type RoiBlock = { id: string; type: "roi"; title: string; model: RoiModel };

export type Block =
  | RoiBlock
  | ImageBlock
  | VideoBlock
  | LinksBlock
  | RiskBlock
  | ModelCardBlock
  | SourcesBlock
  | TextBlock
  | CalloutBlock
  | DividerBlock
  | TableBlock
  | DecisionBlock
  | ApprovalBlock
  | TimelineBlock
  | SwotBlock;
export type BlockType = Block["type"];

export const CALLOUT_LABEL: Record<CalloutTone, string> = { note: "Note", warning: "Warning", decision: "Decision" };

/** A new, empty block of the given type. */
export function newBlock(type: BlockType, id: string): Block {
  switch (type) {
    case "text":
      return { id, type, text: "" };
    case "callout":
      return { id, type, tone: "note", text: "" };
    case "divider":
      return { id, type };
    case "table":
      return { id, type, rows: [["Column 1", "Column 2"], ["", ""]] };
    case "decision":
      return { id, type, rows: [newDecision()] };
    case "approval":
      return { id, type, rows: [newApproval()] };
    case "timeline":
      return { id, type, items: [newMilestone()] };
    case "swot":
      return { id, type, s: [""], w: [""], o: [""], t: [""] };
    case "risk":
      return { id, type, rows: [newRisk()] };
    case "modelcard":
      return { id, type, fields: emptyModelFields(), reviewed: "", metrics: [newMetric()] };
    case "sources":
      return { id, type, rows: [newSource()] };
    case "image":
      return { id, type, url: "", alt: "", caption: "" };
    case "video":
      return { id, type, url: "", title: "" };
    case "links":
      return { id, type, rows: [newLink()] };
    case "roi":
      return { id, type, title: "ROI estimate", model: emptyRoi() };
  }
}

export const newLink = (): LinkRow => ({ id: rowId(), title: "", url: "", note: "" });

export const emptyModelFields = () => Object.fromEntries(MODEL_FIELDS.map((f) => [f.key, ""])) as Record<ModelField, string>;

/** An ID for a row inside a block; unique enough within one block. */
export function rowId() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
export const newDecision = (): DecisionRow => ({ id: rowId(), decision: "", date: "", by: "", why: "", status: "Open" });
export const newApproval = (): ApprovalRow => ({ id: rowId(), item: "", who: "", date: "", status: "Pending" });
export const newMilestone = (): Milestone => ({ id: rowId(), text: "", date: "", done: false });
export const newRisk = (): RiskRow => ({
  id: rowId(),
  risk: "",
  plan: "",
  category: "Accuracy",
  likelihood: "Medium",
  impact: "Medium",
  owner: "",
  status: "Open",
});
export const newMetric = (): MetricRow => ({ id: rowId(), name: "", result: "", target: "" });
/** New sources start uncleared: nothing looks approved or free of personal data by default. */
export const newSource = (): SourceRow => ({
  id: rowId(),
  name: "",
  what: "",
  owner: "",
  refresh: "",
  personal: "Not sure",
  access: "Not requested",
});

/** Milestones in date order; undated ones keep their order at the end. */
export function sortMilestones(items: Milestone[]): Milestone[] {
  return items
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (a.m.date || "9999").localeCompare(b.m.date || "9999") || a.i - b.i)
    .map((x) => x.m);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T = list[0]): T =>
  list.includes(v as T) ? (v as T) : fallback;
/** The object rows of a saved list, each with a usable ID. */
function rows(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return (raw as Record<string, unknown>[])
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      let id = str(r.id) || rowId();
      while (seen.has(id)) id = rowId();
      seen.add(id);
      return { ...r, id };
    });
}

/**
 * Repair blocks from storage or a backup. Anything that is not a known block
 * is dropped; known blocks get missing fields filled in.
 */
export function normalizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  const seen = new Set<string>();
  for (const b of raw as Record<string, unknown>[]) {
    if (!b || typeof b !== "object") continue;
    let id = str(b.id) || `b-${out.length}`;
    while (seen.has(id)) id = `${id}-x`;
    seen.add(id);
    switch (b.type) {
      case "text":
        out.push({ id, type: "text", text: str(b.text) });
        break;
      case "callout":
        out.push({
          id,
          type: "callout",
          tone: CALLOUT_TONES.includes(b.tone as CalloutTone) ? (b.tone as CalloutTone) : "note",
          text: str(b.text),
        });
        break;
      case "divider":
        out.push({ id, type: "divider" });
        break;
      case "table": {
        const rows = Array.isArray(b.rows)
          ? (b.rows as unknown[]).filter(Array.isArray).map((r) => (r as unknown[]).map(str))
          : [];
        const width = Math.max(1, ...rows.map((r) => r.length));
        const fixed = rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
        out.push({ id, type: "table", rows: fixed.length ? fixed : [Array(width).fill("")] });
        break;
      }
      case "decision":
        out.push({
          id,
          type: "decision",
          rows: rows(b.rows).map((r) => ({
            id: r.id as string,
            decision: str(r.decision),
            date: day(r.date),
            by: str(r.by),
            why: str(r.why),
            status: oneOf(DECISION_STATUSES, r.status),
          })),
        });
        break;
      case "approval":
        out.push({
          id,
          type: "approval",
          rows: rows(b.rows).map((r) => ({
            id: r.id as string,
            item: str(r.item),
            who: str(r.who),
            date: day(r.date),
            status: oneOf(APPROVAL_STATUSES, r.status),
          })),
        });
        break;
      case "timeline":
        out.push({
          id,
          type: "timeline",
          items: sortMilestones(
            rows(b.items).map((r) => ({ id: r.id as string, text: str(r.text), date: day(r.date), done: r.done === true })),
          ),
        });
        break;
      case "swot": {
        const list = (v: unknown) => (Array.isArray(v) ? v.map(str) : []);
        out.push({ id, type: "swot", s: list(b.s), w: list(b.w), o: list(b.o), t: list(b.t) });
        break;
      }
      case "risk":
        out.push({
          id,
          type: "risk",
          rows: rows(b.rows).map((r) => ({
            id: r.id as string,
            risk: str(r.risk),
            plan: str(r.plan),
            category: oneOf(RISK_CATEGORIES, r.category, "Accuracy"),
            likelihood: oneOf(RISK_LEVELS, r.likelihood, "Medium"),
            impact: oneOf(RISK_LEVELS, r.impact, "Medium"),
            owner: str(r.owner),
            status: oneOf(RISK_STATUSES, r.status),
          })),
        });
        break;
      case "modelcard": {
        const saved = (b.fields && typeof b.fields === "object" ? b.fields : {}) as Record<string, unknown>;
        out.push({
          id,
          type: "modelcard",
          fields: Object.fromEntries(MODEL_FIELDS.map((f) => [f.key, str(saved[f.key])])) as Record<ModelField, string>,
          reviewed: day(b.reviewed),
          metrics: rows(b.metrics).map((r) => ({ id: r.id as string, name: str(r.name), result: str(r.result), target: str(r.target) })),
        });
        break;
      }
      case "roi":
        out.push({ id, type: "roi", title: str(b.title) || "ROI estimate", model: normalizeRoi(b.model) });
        break;
      case "image":
        out.push({ id, type: "image", url: str(b.url), alt: str(b.alt), caption: str(b.caption) });
        break;
      case "video":
        out.push({ id, type: "video", url: str(b.url), title: str(b.title) });
        break;
      case "links":
        out.push({
          id,
          type: "links",
          rows: rows(b.rows).map((r) => ({ id: r.id as string, title: str(r.title), url: str(r.url), note: str(r.note) })),
        });
        break;
      case "sources":
        out.push({
          id,
          type: "sources",
          rows: rows(b.rows).map((r) => ({
            id: r.id as string,
            name: str(r.name),
            what: str(r.what),
            owner: str(r.owner),
            refresh: str(r.refresh),
            personal: oneOf(PERSONAL_DATA, r.personal, "Not sure"),
            access: oneOf(ACCESS_STATUSES, r.access),
          })),
        });
        break;
    }
  }
  return out;
}

/** True when a block holds nothing worth exporting. */
export function isEmptyBlock(b: Block) {
  if (b.type === "divider") return false;
  if (b.type === "table") return b.rows.every((r) => r.every((c) => !c.trim()));
  if (b.type === "decision") return filledDecisions(b).length === 0;
  if (b.type === "approval") return filledApprovals(b).length === 0;
  if (b.type === "timeline") return filledMilestones(b).length === 0;
  if (b.type === "swot") return SWOT_KEYS.every((k) => filledItems(b[k]).length === 0);
  // A media block with no usable address shows nothing to a reader.
  if (b.type === "roi") return !isReady(b.model.inputs);
  if (b.type === "image") return !isWebUrl(b.url);
  if (b.type === "video") return !videoSource(b.url);
  if (b.type === "links") return filledLinks(b).length === 0;
  if (b.type === "risk") return filledRisks(b).length === 0;
  if (b.type === "sources") return filledSources(b).length === 0;
  if (b.type === "modelcard") return filledModelFields(b).length === 0 && filledMetrics(b).length === 0;
  return !b.text.trim();
}

// What a reader sees: rows someone has actually written in. Blank rows show only while editing.
export const filledDecisions = (b: DecisionBlock) => b.rows.filter((r) => (r.decision + r.by + r.why).trim());
export const filledApprovals = (b: ApprovalBlock) => b.rows.filter((r) => (r.item + r.who).trim());
export const filledMilestones = (b: TimelineBlock) => sortMilestones(b.items.filter((m) => m.text.trim()));
export const filledItems = (items: string[]) => items.filter((x) => x.trim());
export const filledRisks = (b: RiskBlock) => b.rows.filter((r) => (r.risk + r.plan).trim());
export const filledSources = (b: SourcesBlock) => b.rows.filter((r) => (r.name + r.what).trim());
export const filledMetrics = (b: ModelCardBlock) => b.metrics.filter((m) => (m.name + m.result + m.target).trim());
export const filledModelFields = (b: ModelCardBlock) => MODEL_FIELDS.filter((f) => b.fields[f.key].trim());
/** Open high risks and all open risks, for the block's header and exports. */
export function riskCounts(b: RiskBlock) {
  const open = filledRisks(b).filter((r) => r.status !== "Closed");
  return { high: open.filter((r) => riskLevel(r) === "High").length, open: open.length };
}
/** Links a reader can follow: only rows with a full https address. */
export const filledLinks = (b: LinksBlock) => b.rows.filter((r) => isWebUrl(r.url));
