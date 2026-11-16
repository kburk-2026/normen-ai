/**
 * The ROI model: what a system saves against what it costs. Every input is the
 * user's own; the arithmetic is in src/lib/roi.ts and is shown in full.
 */

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€", GBP: "£" };

export type RoiInputs = {
  /** Tasks per month. */
  tasks: number | null;
  /** Minutes saved per task. */
  minutes: number | null;
  /** Cost of an hour of the work, pay plus overhead. */
  hourly: number | null;
  /** Share of tasks the system handles, in percent. */
  adoption: number | null;
  /** Other yearly benefit, optional. */
  other: number | null;
  /** One-off cost to build. */
  build: number | null;
  /** Yearly cost to run: hosting, licenses, model calls. */
  running: number | null;
  /** Yearly cost of people looking after it. */
  people: number | null;
};

export const ROI_KEYS = ["tasks", "minutes", "hourly", "adoption", "other", "build", "running", "people"] as const satisfies readonly (keyof RoiInputs)[];

export type RoiModel = { currency: Currency; inputs: RoiInputs };

export const emptyRoiInputs = (): RoiInputs => ({
  tasks: null,
  minutes: null,
  hourly: null,
  adoption: null,
  other: null,
  build: null,
  running: null,
  people: null,
});
export const emptyRoi = (): RoiModel => ({ currency: "USD", inputs: emptyRoiInputs() });
