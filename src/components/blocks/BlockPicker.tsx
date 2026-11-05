"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import {
  IconCheck,
  IconFileDescription,
  IconInfoCircle,
  IconLayoutGrid,
  IconLink,
  IconLock,
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

const BASICS: { type: BlockType; label: string; hint: string; icon: typeof IconTextSize }[] = [
  { type: "text", label: "Text", hint: "Plain text with line breaks", icon: IconTextSize },
  { type: "callout", label: "Callout", hint: "A note, warning or decision", icon: IconInfoCircle },
  { type: "divider", label: "Divider", hint: "A line between parts", icon: IconMinus },
  { type: "table", label: "Table", hint: "Rows and columns", icon: IconTable },
];

/** Blocks on the phase 2 plan, shown so people know what is coming. */
const LATER = [
  { label: "Decision Log", icon: IconScale, m: 9 },
  { label: "Approval Tracker", icon: IconCheck, m: 9 },
  { label: "Timeline", icon: IconTimeline, m: 9 },
  { label: "SWOT", icon: IconLayoutGrid, m: 9 },
  { label: "Risk Register", icon: IconShieldCheck, m: 10 },
  { label: "Model Card", icon: IconFileDescription, m: 10 },
  { label: "Data Sources", icon: IconDatabase, m: 10 },
  { label: "Image", icon: IconPhoto, m: 11 },
  { label: "Video", icon: IconVideo, m: 11 },
  { label: "File or link", icon: IconLink, m: 11 },
];

/** The "Add a block" button and its panel of block types. */
const BlockPicker = forwardRef<HTMLButtonElement, { onPick: (type: BlockType) => void }>(function BlockPicker(
  { onPick },
  buttonRef,
) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const headingId = useId();

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
          aria-labelledby={headingId}
          className="absolute left-0 top-full z-30 mt-2 w-[min(34rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-canvas p-3 shadow-2xl"
        >
          <h2 id={headingId} className="px-1 text-xs uppercase tracking-wide text-faint">
            Basics
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {BASICS.map(({ type, label, hint, icon: Icon }) => (
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
          <h3 className="mt-4 px-1 text-xs uppercase tracking-wide text-faint">Coming in later releases</h3>
          <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 px-1 text-sm text-faint sm:grid-cols-2">
            {LATER.map(({ label, icon: Icon, m }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon size={15} aria-hidden /> {label}
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px]">
                  <IconLock size={11} aria-hidden />
                  <span className="sr-only">milestone</span> M{m}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default BlockPicker;
