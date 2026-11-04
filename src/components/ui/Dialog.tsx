"use client";

import { useEffect, useId, useRef } from "react";
import { IconX } from "@tabler/icons-react";

/**
 * A modal dialog on the native <dialog> element: it traps focus, closes on
 * Escape, and returns focus to whatever opened it.
 */
export default function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // showModal focuses the first focusable element (the close button). Start in the first field instead.
      d.querySelector<HTMLElement>("input:not([type=radio]), textarea, select")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60"
    >
      {open && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="font-display text-lg font-medium">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-faint hover:text-ink">
              <IconX size={18} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-orange focus:outline-none";
export const primaryButton =
  "rounded-full bg-orange px-4 py-1.5 text-sm font-medium text-orange-ink transition-colors hover:bg-orange-soft disabled:cursor-not-allowed disabled:bg-canvas disabled:font-normal disabled:text-faint";
export const quietButton = "rounded-full px-4 py-1.5 text-sm text-muted hover:text-ink";
