"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { IconComponent } from "@/content/types";

export type MenuItem = { label: string; icon: IconComponent; onSelect: () => void; danger?: boolean };

/** A small action menu: opens from a button, closes on Escape, outside click or after a choice. */
export default function Menu({
  label,
  trigger,
  items,
}: {
  /** Accessible name for the trigger, e.g. "Actions for Expense triage". */
  label: string;
  trigger: React.ReactNode;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Move focus into the menu so keyboard users land on the first choice.
    wrap.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = [...(wrap.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="rounded-full p-1 text-faint transition-colors hover:bg-canvas hover:text-ink"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-line bg-canvas p-1.5 text-sm shadow-2xl"
        >
          {items.map(({ label: l, icon: Icon, onSelect, danger }) => (
            <button
              key={l}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                // Focus the trigger first, so a dialog opened by this choice returns focus here when it closes.
                button.current?.focus();
                onSelect();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-surface focus:bg-surface focus:outline-none ${
                danger ? "text-tan-soft" : "text-ink"
              }`}
            >
              <Icon size={16} aria-hidden /> {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
