import { CURRENCIES, CURRENCY_SYMBOL, ROI_KEYS, emptyRoiInputs, type Currency, type RoiInputs, type RoiModel } from "@/content/roi";

/** The four numbers the savings depend on. Until they are in, there is no result. */
export const isReady = (i: RoiInputs) => i.tasks !== null && i.minutes !== null && i.hourly !== null && i.adoption !== null;

const n = (v: number | null) => v ?? 0;

/** Plain arithmetic, so it can be shown line by line. */
export function roiResult(i: RoiInputs) {
  const hours = (n(i.tasks) * 12 * (n(i.adoption) / 100) * n(i.minutes)) / 60;
  const benefit = hours * n(i.hourly) + n(i.other);
  const cost = n(i.running) + n(i.people);
  const net = benefit - cost;
  const build = n(i.build);
  const payback = net > 0 ? build / (net / 12) : null;
  const threeYear = 3 * net - build;
  return { hours, benefit, cost, net, build, payback, threeYear };
}

/** The cautious case: half the share of tasks and half the minutes saved. */
export const cautiousInputs = (i: RoiInputs): RoiInputs => ({
  ...i,
  adoption: i.adoption === null ? null : i.adoption / 2,
  minutes: i.minutes === null ? null : i.minutes / 2,
});

export function money(v: number, currency: Currency) {
  const s = `${CURRENCY_SYMBOL[currency]}${Math.round(Math.abs(v)).toLocaleString("en-US")}`;
  return v < 0 ? `-${s}` : s;
}

export function paybackText(months: number | null) {
  if (months === null) return "Never, at these numbers";
  if (months < 1) return "Under a month";
  const m = Math.round(months);
  return m > 36 ? `${m} months (beyond 3 years)` : `${m} ${m === 1 ? "month" : "months"}`;
}

export const hoursText = (h: number) => Math.round(h).toLocaleString("en-US");

/** The working, as lines of text, shared by the page and the exports. */
export function workingLines(i: RoiInputs, currency: Currency): string[] {
  const r = roiResult(i);
  const m = (v: number) => money(v, currency);
  return [
    `Hours saved a year = ${n(i.tasks).toLocaleString("en-US")} tasks × 12 months × ${n(i.adoption)}% × ${n(i.minutes)} min ÷ 60 = ${hoursText(r.hours)}`,
    `Saved a year = ${hoursText(r.hours)} h × ${m(n(i.hourly))} + ${m(n(i.other))} = ${m(r.benefit)}`,
    `Net a year = ${m(r.benefit)} minus ${m(n(i.running))} minus ${m(n(i.people))} = ${m(r.net)}`,
    `Payback = ${m(r.build)} ÷ (${m(r.net)} ÷ 12) = ${paybackText(r.payback)}`,
    `After three years = 3 × ${m(r.net)} minus ${m(r.build)} = ${m(r.threeYear)}`,
  ];
}

/** Repair saved inputs: anything that is not a non-negative number becomes "not entered". */
export function normalizeRoiInputs(raw: unknown): RoiInputs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = emptyRoiInputs();
  for (const k of ROI_KEYS) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = k === "adoption" ? Math.min(v, 100) : v;
  }
  return out;
}

export function normalizeRoi(raw: unknown): RoiModel {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<RoiModel>;
  return {
    currency: CURRENCIES.includes(r.currency as Currency) ? (r.currency as Currency) : "USD",
    inputs: normalizeRoiInputs(r.inputs),
  };
}
