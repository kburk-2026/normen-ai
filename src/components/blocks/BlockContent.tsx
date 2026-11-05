"use client";

import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconMinus, IconPlus } from "@tabler/icons-react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import { CALLOUT_LABEL, CALLOUT_TONES, type Block, type CalloutTone, type TableBlock } from "@/content/blocks";
import type { Mode } from "@/state/editMode";

export const TONE_STYLE: Record<CalloutTone, { icon: typeof IconInfoCircle; cls: string }> = {
  note: { icon: IconInfoCircle, cls: "border-steel bg-steel-bg text-steel-soft" },
  warning: { icon: IconAlertTriangle, cls: "border-orange bg-orange-bg text-orange-soft" },
  decision: { icon: IconCircleCheck, cls: "border-tan bg-tan-bg text-tan-soft" },
};

const field = "block w-full bg-transparent leading-relaxed text-ink placeholder:text-faint focus:outline-none";

/** One block's content, as an editor or as the finished page. */
export default function BlockContent({
  block: b,
  mode,
  onChange,
}: {
  block: Block;
  mode: Mode;
  onChange: (next: Block) => void;
}) {
  const edit = mode === "edit";

  if (b.type === "divider") return <hr className="my-3 border-line" />;

  if (b.type === "text")
    return edit ? (
      <AutoTextarea
        aria-label="Text"
        value={b.text}
        placeholder="Write here. Enter starts a new line."
        onChange={(e) => onChange({ ...b, text: e.target.value })}
        className={`${field} min-h-[2.5rem] px-2 py-1`}
      />
    ) : (
      <p className="whitespace-pre-line leading-relaxed">{b.text}</p>
    );

  if (b.type === "callout") {
    const t = TONE_STYLE[b.tone];
    return (
      <div className={`flex gap-3 rounded-xl border-l-4 px-4 py-3 ${t.cls}`}>
        <t.icon size={18} className="mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          {edit && (
            <div role="group" aria-label="Callout type" className="mb-1 flex flex-wrap gap-1 text-xs">
              {CALLOUT_TONES.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={b.tone === k}
                  onClick={() => onChange({ ...b, tone: k })}
                  className={`rounded-full px-2 py-0.5 ${b.tone === k ? "bg-canvas text-ink" : "hover:bg-canvas/60"}`}
                >
                  {CALLOUT_LABEL[k]}
                </button>
              ))}
            </div>
          )}
          {edit ? (
            <AutoTextarea
              aria-label={`${CALLOUT_LABEL[b.tone]} callout text`}
              value={b.text}
              placeholder="Write the note, warning or decision."
              onChange={(e) => onChange({ ...b, text: e.target.value })}
              className={`${field} text-sm`}
            />
          ) : (
            <p className="whitespace-pre-line text-sm text-ink">
              <span className="sr-only">{CALLOUT_LABEL[b.tone]}: </span>
              {b.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <Table block={b} edit={edit} onChange={onChange} />;
}

function Table({ block: b, edit, onChange }: { block: TableBlock; edit: boolean; onChange: (next: Block) => void }) {
  const [head, ...body] = b.rows;
  const cols = head.length;
  const setCell = (r: number, c: number, v: string) =>
    onChange({ ...b, rows: b.rows.map((row, ri) => (ri === r ? row.map((x, ci) => (ci === c ? v : x)) : row)) });

  const cell = (r: number, c: number) =>
    edit ? (
      <AutoTextarea
        aria-label={r === 0 ? `Column ${c + 1} heading` : `Row ${r}, ${head[c] || `column ${c + 1}`}`}
        value={b.rows[r][c]}
        onChange={(e) => setCell(r, c, e.target.value)}
        className={`${field} min-w-[6rem]`}
      />
    ) : (
      <span className="whitespace-pre-line">{b.rows[r][c]}</span>
    );

  const tool = "inline-flex items-center gap-1 rounded px-1 hover:text-ink disabled:opacity-40 disabled:hover:text-faint";
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left">
              {head.map((_, c) => (
                <th key={c} scope="col" className="px-3 py-2 align-top font-medium">
                  {cell(0, c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} className="border-t border-line">
                {row.map((_, c) => (
                  <td key={c} className="px-3 py-2 align-top">
                    {cell(i + 1, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-faint">
          <button type="button" className={tool} onClick={() => onChange({ ...b, rows: [...b.rows, Array(cols).fill("")] })}>
            <IconPlus size={12} aria-hidden /> Row
          </button>
          <button
            type="button"
            className={tool}
            onClick={() => onChange({ ...b, rows: b.rows.map((r, i) => [...r, i === 0 ? `Column ${cols + 1}` : ""]) })}
          >
            <IconPlus size={12} aria-hidden /> Column
          </button>
          <button
            type="button"
            className={tool}
            disabled={b.rows.length <= 2}
            aria-label="Remove last row"
            onClick={() => onChange({ ...b, rows: b.rows.slice(0, -1) })}
          >
            <IconMinus size={12} aria-hidden /> Row
          </button>
          <button
            type="button"
            className={tool}
            disabled={cols <= 1}
            aria-label="Remove last column"
            onClick={() => onChange({ ...b, rows: b.rows.map((r) => r.slice(0, -1)) })}
          >
            <IconMinus size={12} aria-hidden /> Column
          </button>
        </div>
      )}
    </div>
  );
}
