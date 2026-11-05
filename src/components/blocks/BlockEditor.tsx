"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconArrowDown, IconArrowUp, IconGripVertical, IconTrash } from "@tabler/icons-react";
import BlockContent from "./BlockContent";
import BlockPicker from "./BlockPicker";
import { isEmptyBlock, type Block } from "@/content/blocks";
import type { Section } from "@/content/demo";
import type { PhaseId } from "@/content/phases";
import type { Mode } from "@/state/editMode";
import { useProject } from "@/state/ProjectProvider";

const NAME: Record<Block["type"], string> = { text: "Text", callout: "Callout", divider: "Divider", table: "Table" };
const UNDO_MS = 8000;

/** The blocks of one section: an editor in Edit mode, the finished page in View mode. */
export default function BlockEditor({ phase, section, mode }: { phase: PhaseId; section: Section; mode: Mode }) {
  const { addBlock, insertBlock, updateBlock, moveBlock, deleteBlock } = useProject();
  const blocks = section.blocks;
  const edit = mode === "edit";

  const [announce, setAnnounce] = useState("");
  const [undo, setUndo] = useState<{ block: Block; index: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  /** What to focus once the list has re-rendered. */
  const focusNext = useRef<{ blockId?: string; keep?: Element | null } | null>(null);

  useLayoutEffect(() => {
    const f = focusNext.current;
    if (!f) return;
    focusNext.current = null;
    if (f.keep instanceof HTMLElement) {
      // A Move button that just became disabled (top or bottom) hands focus to its block.
      const target = (f.keep as HTMLButtonElement).disabled ? f.keep.closest<HTMLElement>("[data-block]") : f.keep;
      if (target && document.activeElement !== target) target.focus();
      return;
    }
    const el = f.blockId ? list.current?.querySelector<HTMLElement>(`[data-block="${f.blockId}"]`) : null;
    if (!el) return addButton.current?.focus();
    (el.querySelector<HTMLElement>("textarea, input") ?? el).focus();
  }, [blocks]);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [undo]);

  const move = (b: Block, to: number) => {
    const from = blocks.indexOf(b);
    if (to < 0 || to >= blocks.length || to === from) return;
    focusNext.current = { keep: document.activeElement };
    moveBlock(phase, section.id, b.id, to);
    setAnnounce(`${NAME[b.type]} block moved to position ${to + 1} of ${blocks.length}.`);
  };

  const remove = (b: Block) => {
    const index = blocks.indexOf(b);
    const next = blocks[index + 1] ?? blocks[index - 1];
    focusNext.current = { blockId: next?.id };
    deleteBlock(phase, section.id, b.id);
    setUndo({ block: b, index });
    setAnnounce(`${NAME[b.type]} block deleted.`);
  };

  const restore = () => {
    if (!undo) return;
    focusNext.current = { blockId: undo.block.id };
    insertBlock(phase, section.id, undo.block, undo.index);
    setAnnounce(`${NAME[undo.block.type]} block restored.`);
    setUndo(null);
  };

  if (!edit) {
    const shown = blocks.filter((b) => !isEmptyBlock(b));
    return shown.length ? (
      <div className="mt-8 space-y-4">
        {shown.map((b) => (
          <BlockContent key={b.id} block={b} mode="view" onChange={() => {}} />
        ))}
      </div>
    ) : (
      <p className="mt-8 text-sm text-faint">Nothing written here yet. Switch to Edit to add blocks.</p>
    );
  }

  /** Where a dragged block would land: index in the list before it is removed from its place. */
  const dropIndex = (e: React.DragEvent, i: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < r.top + r.height / 2 ? i : i + 1;
  };
  const drop = () => {
    if (!drag) return;
    const b = blocks.find((x) => x.id === drag.id);
    if (b) {
      const from = blocks.indexOf(b);
      move(b, drag.over > from ? drag.over - 1 : drag.over);
    }
    setDrag(null);
  };
  const lineAt = (i: number) => {
    if (!drag) return false;
    const from = blocks.findIndex((x) => x.id === drag.id);
    return drag.over === i && i !== from && i !== from + 1;
  };

  return (
    <div className="mt-8">
      {blocks.length === 0 && (
        <p className="mb-4 text-sm text-faint">
          Write this phase&apos;s story: what you decided, what you learned, what comes next.
        </p>
      )}
      <div ref={list} className="space-y-3" onDragOver={(e) => drag && e.preventDefault()} onDrop={drop}>
        {blocks.map((b, i) => (
          <div key={b.id}>
            {lineAt(i) && <div className="mb-2 h-0.5 rounded bg-orange" aria-hidden />}
            <div
              data-block={b.id}
              tabIndex={-1}
              role="group"
              aria-label={`${NAME[b.type]} block, ${i + 1} of ${blocks.length}`}
              onKeyDown={(e) => {
                if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                e.preventDefault();
                move(b, i + (e.key === "ArrowUp" ? -1 : 1));
              }}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                const over = dropIndex(e, i);
                if (over !== drag.over) setDrag({ ...drag, over });
              }}
              className={`group relative flex flex-col gap-1 rounded-xl focus:outline-none md:-ml-10 md:flex-row md:gap-2 ${drag?.id === b.id ? "opacity-40" : ""}`}
            >
              <span
                draggable
                title="Drag to move. Or use Alt + Up or Down."
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", b.id);
                  const card = (e.currentTarget as HTMLElement).parentElement;
                  if (card) e.dataTransfer.setDragImage(card, 16, 16);
                  setDrag({ id: b.id, over: i });
                }}
                onDragEnd={() => setDrag(null)}
                className="hidden w-8 shrink-0 cursor-grab justify-center pt-2.5 text-faint opacity-60 hover:text-ink group-focus-within:opacity-100 group-hover:opacity-100 md:flex"
              >
                <IconGripVertical size={16} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="rounded-xl border border-transparent p-1 group-focus-within:border-line group-hover:border-line">
                  <BlockContent block={b} mode="edit" onChange={(next) => updateBlock(phase, section.id, b.id, () => next)} />
                </div>
              </div>
              {/* On wide screens a small bar floats over the block's top edge; on phones it sits under the block. */}
              <div className="flex shrink-0 gap-0.5 self-end text-faint md:absolute md:right-2 md:top-0 md:-translate-y-1/2 md:rounded-full md:border md:border-line md:bg-canvas md:px-1 md:opacity-0 md:shadow-lg md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                <Tool label={`Move ${NAME[b.type]} block up`} icon={IconArrowUp} disabled={i === 0} onClick={() => move(b, i - 1)} />
                <Tool
                  label={`Move ${NAME[b.type]} block down`}
                  icon={IconArrowDown}
                  disabled={i === blocks.length - 1}
                  onClick={() => move(b, i + 1)}
                />
                <Tool label={`Delete ${NAME[b.type]} block`} icon={IconTrash} onClick={() => remove(b)} />
              </div>
            </div>
          </div>
        ))}
        {lineAt(blocks.length) && <div className="h-0.5 rounded bg-orange" aria-hidden />}
      </div>

      <div className="mt-6">
        <BlockPicker
          ref={addButton}
          onPick={(type) => {
            const b = addBlock(phase, section.id, type);
            focusNext.current = { blockId: b.id };
            setAnnounce(`${NAME[type]} block added.`);
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {undo && (
        <div
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-line bg-surface px-5 py-2.5 text-sm shadow-2xl print:hidden"
        >
          {NAME[undo.block.type]} block deleted.
          <button type="button" onClick={restore} className="font-medium text-orange hover:text-orange-soft">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

function Tool({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof IconTrash;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 hover:bg-surface hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-faint"
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}
