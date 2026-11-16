"use client";

import { IconCalculator } from "@tabler/icons-react";
import { RoiInputsForm, RoiResults } from "@/components/roi/RoiCalculator";
import type { Block, RoiBlock } from "@/content/blocks";
import { isReady, money, paybackText, roiResult } from "@/lib/roi";

/** An ROI scenario inside a section: a summary row, with the full calculator while editing. */
export default function RoiBlockView({ block: b, edit, onChange }: { block: RoiBlock; edit: boolean; onChange: (next: Block) => void }) {
  const ready = isReady(b.model.inputs);
  const r = roiResult(b.model.inputs);
  const m = (v: number) => money(v, b.model.currency);
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <IconCalculator size={17} className="shrink-0 text-orange" aria-hidden />
        {edit ? (
          <input
            aria-label="Calculator title"
            value={b.title}
            onChange={(e) => onChange({ ...b, title: e.target.value })}
            className="w-full bg-transparent font-display text-base font-medium text-ink focus:outline-none"
          />
        ) : (
          <h2 className="font-display text-base font-medium">{b.title}</h2>
        )}
      </div>
      {ready ? (
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Saved a year", m(r.benefit)],
            ["Net a year", m(r.net)],
            ["Payback", paybackText(r.payback)],
            ["After three years", m(r.threeYear)],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse rounded-xl bg-canvas p-3">
              <dt className="mt-1 text-xs text-muted">{k}</dt>
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted">{edit ? "Open the numbers below and fill them in." : "No numbers yet."}</p>
      )}
      {edit && (
        <details className="mt-3" open={!ready}>
          <summary className="cursor-pointer text-xs text-muted">Edit numbers</summary>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <RoiInputsForm model={b.model} onChange={(model) => onChange({ ...b, model })} headingLevel={3} />
            <RoiResults model={b.model} headingLevel={3} />
          </div>
        </details>
      )}
    </div>
  );
}
