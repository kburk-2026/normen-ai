/**
 * Blocks: the pieces of content inside a section. Milestone 8 ships the
 * basics; governance, AI and media blocks arrive in milestones 9 to 11.
 */

export const CALLOUT_TONES = ["note", "warning", "decision"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export type TextBlock = { id: string; type: "text"; text: string };
export type CalloutBlock = { id: string; type: "callout"; tone: CalloutTone; text: string };
export type DividerBlock = { id: string; type: "divider" };
/** Row 0 is the header row. Every row has the same number of cells. */
export type TableBlock = { id: string; type: "table"; rows: string[][] };

export type Block = TextBlock | CalloutBlock | DividerBlock | TableBlock;
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
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

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
    }
  }
  return out;
}

/** True when a block holds nothing worth exporting. */
export function isEmptyBlock(b: Block) {
  if (b.type === "divider") return false;
  if (b.type === "table") return b.rows.every((r) => r.every((c) => !c.trim()));
  return !b.text.trim();
}
