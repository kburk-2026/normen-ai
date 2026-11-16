"use client";

import { useEffect, useId, useState } from "react";
import { CURRENCIES, CURRENCY_SYMBOL, type Currency, type RoiInputs, type RoiModel } from "@/content/roi";
import { cautiousInputs, hoursText, isReady, money, paybackText, roiResult, workingLines } from "@/lib/roi";

type FieldSpec = { key: keyof RoiInputs; label: string; hint?: string; unit?: "money" | "min" | "%"; wide?: boolean };

const SAVES: FieldSpec[] = [
  { key: "tasks", label: "Tasks per month", hint: "Claims, tickets, documents…" },
  { key: "minutes", label: "Minutes saved per task", unit: "min" },
  { key: "hourly", label: "Cost of an hour of that work", hint: "Pay plus overhead", unit: "money" },
  { key: "adoption", label: "Share of tasks it handles", unit: "%" },
  { key: "other", label: "Other yearly benefit (optional)", hint: "For example, errors or fines avoided.", unit: "money", wide: true },
];
const COSTS: FieldSpec[] = [
  { key: "build", label: "To build, once", unit: "money" },
  { key: "running", label: "To run, per year", hint: "Hosting, licenses, model calls", unit: "money" },
  { key: "people", label: "People to look after it, per year", hint: "Reviewing outputs, monitoring, support", unit: "money", wide: true },
];

/** A number input that keeps what is typed and reports a number, or null when empty or invalid. */
function NumberInput({ spec, value, currency, onChange }: { spec: FieldSpec; value: number | null; currency: Currency; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => setText(value === null ? "" : String(value)), [value]);
  const hintId = useId();
  const prefix = spec.unit === "money" ? CURRENCY_SYMBOL[currency] : undefined;
  const suffix = spec.unit === "min" || spec.unit === "%" ? spec.unit : undefined;
  const max = spec.unit === "%" ? 100 : undefined;
  const parsed = text === "" ? null : Number(text);
  const invalid = parsed !== null && !(Number.isFinite(parsed) && parsed >= 0 && (max === undefined || parsed <= max));
  const errorId = useId();
  return (
    <label className={`block ${spec.wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs text-muted">{spec.label}</span>
      <span className="relative mt-1 block">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step="any"
          value={text}
          aria-invalid={invalid || undefined}
          aria-describedby={[invalid ? errorId : "", spec.hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
          onChange={(e) => {
            setText(e.target.value);
            const v = e.target.value === "" ? null : Number(e.target.value);
            if (v === null || (Number.isFinite(v) && v >= 0 && (max === undefined || v <= max))) onChange(v);
          }}
          className={`block w-full rounded-lg border border-line bg-canvas py-1.5 text-sm text-ink focus:border-orange focus:outline-none ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-12" : "pr-3"}`}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">{suffix}</span>}
      </span>
      {invalid && (
        <span id={errorId} className="mt-1 block text-xs text-tan-soft">
          {max !== undefined ? `Use a number from 0 to ${max}.` : "Use a number of 0 or more."} The last valid number is still used.
        </span>
      )}
      {spec.hint && (
        <span id={hintId} className="mt-1 block text-xs text-faint">
          {spec.hint}
        </span>
      )}
    </label>
  );
}

/** The inputs, grouped into what it saves and what it costs, with the currency choice. */
export function RoiInputsForm({ model, onChange, headingLevel = 2 }: { model: RoiModel; onChange: (m: RoiModel) => void; headingLevel?: 2 | 3 | 4 }) {
  const H = `h${headingLevel}` as "h2";
  const set = (key: keyof RoiInputs) => (v: number | null) => onChange({ ...model, inputs: { ...model.inputs, [key]: v } });
  const grid = (specs: FieldSpec[]) => (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {specs.map((s) => (
        <NumberInput key={s.key} spec={s} value={model.inputs[s.key]} currency={model.currency} onChange={set(s.key)} />
      ))}
    </div>
  );
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <H className="font-display text-lg font-medium">What it saves</H>
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          Currency
          <select
            value={model.currency}
            onChange={(e) => onChange({ ...model, currency: e.target.value as Currency })}
            className="rounded-full bg-canvas px-2.5 py-1 text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_SYMBOL[c]} {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      {grid(SAVES)}
      <H className="mt-6 font-display text-lg font-medium">What it costs</H>
      {grid(COSTS)}
    </div>
  );
}

/** Expected and cautious results side by side, with the working underneath. */
export function RoiResults({ model, headingLevel = 2 }: { model: RoiModel; headingLevel?: 2 | 3 | 4 }) {
  const H = `h${headingLevel}` as "h2";
  const { inputs, currency } = model;
  if (!isReady(inputs))
    return (
      <div>
        <H className="font-display text-lg font-medium">Results</H>
        <p className="mt-3 text-sm text-muted">
          Enter the tasks per month, minutes saved, hourly cost and share of tasks it handles to see the results.
        </p>
      </div>
    );
  const e = roiResult(inputs);
  const c = roiResult(cautiousInputs(inputs));
  const m = (v: number) => money(v, currency);
  const rows: [string, string, string][] = [
    ["Hours saved a year", hoursText(e.hours), hoursText(c.hours)],
    ["Saved a year", m(e.benefit), m(c.benefit)],
    ["Running costs a year", m(e.cost), m(c.cost)],
    ["Net a year", m(e.net), m(c.net)],
    ["Pays back the build in", paybackText(e.payback), paybackText(c.payback)],
    ["After three years", m(e.threeYear), m(c.threeYear)],
  ];
  return (
    <div>
      <H className="font-display text-lg font-medium">Results</H>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-faint">
            <th scope="col" className="py-1.5 font-normal">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-normal">
              Expected
            </th>
            <th scope="col" className="py-1.5 pl-2 text-right font-normal">
              Cautious
            </th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map(([k, a, b]) => (
            <tr key={k} className="border-t border-line">
              <th scope="row" className="py-2 text-left font-sans font-normal text-muted">
                {k}
              </th>
              <td className="px-2 py-2 text-right">{a}</td>
              <td className="py-2 pl-2 text-right text-muted">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-faint">
        The cautious case halves both the share of tasks it handles and the minutes saved, to show how much the answer depends on
        them.
      </p>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">Show the working</summary>
        <ul className="mt-2 space-y-1 font-mono">
          {workingLines(inputs, currency).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** Money in or out over 36 months, expected and cautious. Two series, so a legend and end labels. */
export function RoiChart({ model }: { model: RoiModel }) {
  const { inputs, currency } = model;
  if (!isReady(inputs)) return null;
  const W = 640, H = 220, L = 70, R = 96, T = 14, B = 26;
  const line = (i: RoiInputs) => {
    const r = roiResult(i);
    return Array.from({ length: 37 }, (_, k) => -r.build + (r.net / 12) * k);
  };
  const a = line(inputs);
  const b = line(cautiousInputs(inputs));
  const all = [...a, ...b, 0];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (k: number) => L + ((W - L - R) * k) / 36;
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const path = (vs: number[]) => vs.map((v, k) => `${k ? "L" : "M"}${x(k)},${y(v)}`).join(" ");
  const m = (v: number) => money(v, currency);
  // Keep the two end labels apart when the lines finish close together.
  const ya = y(a[36]);
  let yb = y(b[36]);
  if (Math.abs(ya - yb) < 12) yb = ya + (yb >= ya ? 12 : -12);
  return (
    <figure className="rounded-2xl bg-surface p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Money in or out, month by month over three years</span>
        <span className="flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="18" height="4" aria-hidden>
              <line x1="0" x2="18" y1="2" y2="2" stroke="var(--color-steel-soft)" strokeWidth="2" />
            </svg>
            Expected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="18" height="4" aria-hidden>
              <line x1="0" x2="18" y1="2" y2="2" stroke="var(--color-tan)" strokeWidth="2" strokeDasharray="5 3" />
            </svg>
            Cautious
          </span>
        </span>
      </figcaption>
      {/* On narrow screens the chart keeps a readable size and scrolls sideways inside its card. */}
      <div
        className="mt-2 overflow-x-auto rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        tabIndex={0}
        role="region"
        aria-label="Chart: money in or out over three years"
      >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[600px]"
        role="img"
        aria-label={`Both cases start at ${m(-roiResult(inputs).build)}, the build cost. After three years the expected case is at ${m(a[36])} and the cautious case at ${m(b[36])}.`}
      >
        {[...new Set([lo, 0, hi])].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--color-muted)" : "var(--color-line)"} strokeWidth="1" />
            <text x={L - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-faint)">
              {m(t)}
            </text>
          </g>
        ))}
        {[0, 12, 24, 36].map((k) => (
          <text key={k} x={x(k)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--color-faint)">
            {k === 0 ? "Start" : `Year ${k / 12}`}
          </text>
        ))}
        <path d={path(b)} fill="none" stroke="var(--color-tan)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={path(a)} fill="none" stroke="var(--color-steel-soft)" strokeWidth="2" />
        <text x={W - R + 6} y={ya + 4} fontSize="10" fill="var(--color-ink)">
          {m(a[36])}
        </text>
        <text x={W - R + 6} y={yb + 4} fontSize="10" fill="var(--color-ink)">
          {m(b[36])}
        </text>
      </svg>
      </div>
    </figure>
  );
}
