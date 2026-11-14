/**
 * Blocks: the pieces of content inside a section. Milestone 8 shipped the
 * basics and milestone 9 the governance blocks; AI and media blocks arrive in
 * milestones 10 and 11.
 */

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

export type Block =
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
  }
}

/** An ID for a row inside a block; unique enough within one block. */
export function rowId() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
export const newDecision = (): DecisionRow => ({ id: rowId(), decision: "", date: "", by: "", why: "", status: "Open" });
export const newApproval = (): ApprovalRow => ({ id: rowId(), item: "", who: "", date: "", status: "Pending" });
export const newMilestone = (): Milestone => ({ id: rowId(), text: "", date: "", done: false });

/** Milestones in date order; undated ones keep their order at the end. */
export function sortMilestones(items: Milestone[]): Milestone[] {
  return items
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (a.m.date || "9999").localeCompare(b.m.date || "9999") || a.i - b.i)
    .map((x) => x.m);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const oneOf = <T extends string>(list: readonly T[], v: unknown): T => (list.includes(v as T) ? (v as T) : list[0]);
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
  return !b.text.trim();
}

// What a reader sees: rows someone has actually written in. Blank rows show only while editing.
export const filledDecisions = (b: DecisionBlock) => b.rows.filter((r) => (r.decision + r.by + r.why).trim());
export const filledApprovals = (b: ApprovalBlock) => b.rows.filter((r) => (r.item + r.who).trim());
export const filledMilestones = (b: TimelineBlock) => sortMilestones(b.items.filter((m) => m.text.trim()));
export const filledItems = (items: string[]) => items.filter((x) => x.trim());
