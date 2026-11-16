"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import {
  IconCalculator,
  IconCheck,
  IconFileDescription,
  IconInfoCircle,
  IconLayoutGrid,
  IconLink,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconScale,
  IconShieldCheck,
  IconTable,
  IconTextSize,
  IconTimeline,
  IconDatabase,
  IconVideo,
} from "@tabler/icons-react";
import type { BlockType } from "@/content/blocks";

type Pick = { type: BlockType; label: string; hint: string; icon: typeof IconTextSize };

const GROUPS: { name: string; items: Pick[] }[] = [
  {
    name: "Basics",
    items: [
      { type: "text", label: "Text", hint: "Plain text with line breaks", icon: IconTextSize },
      { type: "callout", label: "Callout", hint: "A note, warning or decision", icon: IconInfoCircle },
      { type: "divider", label: "Divider", hint: "A line between parts", icon: IconMinus },
      { type: "table", label: "Table", hint: "Rows and columns", icon: IconTable },
    ],
  },
  {
    name: "Governance",
    items: [
      { type: "decision", label: "Decision Log", hint: "What was decided, by whom and why", icon: IconScale },
      { type: "approval", label: "Approval Tracker", hint: "Sign-off status by approver", icon: IconCheck },
      { type: "timeline", label: "Timeline", hint: "Milestones and key dates", icon: IconTimeline },
      { type: "swot", label: "SWOT", hint: "Strengths, weaknesses, opportunities, threats", icon: IconLayoutGrid },
    ],
  },
  {
    name: "AI",
    items: [
      { type: "risk", label: "Risk Register", hint: "What could go wrong, and the plan", icon: IconShieldCheck },
      { type: "modelcard", label: "Model Card", hint: "What the model is for, and its limits", icon: IconFileDescription },
      { type: "sources", label: "Data Sources", hint: "Where the data comes from, and who owns it", icon: IconDatabase },
    ],
  },
  {
    name: "Media",
    items: [
      { type: "image", label: "Image", hint: "A picture from a web address", icon: IconPhoto },
      { type: "video", label: "Video", hint: "YouTube, Vimeo, Loom or a video file", icon: IconVideo },
      { type: "links", label: "Files and links", hint: "A list of documents and pages", icon: IconLink },
    ],
  },
  {
    name: "Numbers",
    items: [{ type: "roi", label: "ROI calculator", hint: "What it saves against what it costs", icon: IconCalculator }],
  },
];


/** The "Add a block" button and its panel of block types. */
const BlockPicker = forwardRef<HTMLButtonElement, { onPick: (type: BlockType) => void }>(function BlockPicker(
  { onPick },
  buttonRef,
) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) wrap.current?.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus();
  };

  useEffect(() => {
    if (!open) return;
    wrap.current?.querySelector<HTMLButtonElement>("[data-pick]")?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close(true);
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 }[e.key];
    if (!step) return;
    const els = [...(wrap.current?.querySelectorAll<HTMLButtonElement>("[data-pick]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    els[Math.max(0, Math.min(els.length - 1, i + step))]?.focus();
  };

  return (
    <div ref={wrap} className="relative" onKeyDown={open ? onKey : undefined}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted transition-colors hover:border-orange hover:text-ink"
      >
        <IconPlus size={16} aria-hidden /> Add a block
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Block types"
          className="absolute left-0 top-full z-30 mt-2 max-h-[70vh] w-[min(34rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-line bg-canvas p-3 shadow-2xl"
        >
          {GROUPS.map((g, gi) => (
            <div key={g.name} className={gi ? "mt-4" : ""}>
              <h2 className="px-1 text-xs uppercase tracking-wide text-faint">
                {g.name}
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {g.items.map(({ type, label, hint, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    data-pick
                    onClick={() => {
                      setOpen(false);
                      onPick(type);
                    }}
                    className="flex items-start gap-2.5 rounded-xl bg-surface p-3 text-left hover:ring-1 hover:ring-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  >
                    <Icon size={18} className="mt-0.5 shrink-0 text-orange" aria-hidden />
                    <span>
                      <span className="block text-sm text-ink">{label}</span>
                      <span className="block text-xs text-faint">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default BlockPicker;
