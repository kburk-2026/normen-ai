import type { PhaseId } from "./phases";

/**
 * A project's Scorecard: the measures it sets itself, its targets and what it
 * actually got. The built-in measures come from SCORECARD in lifecycle.ts; a
 * project can add its own.
 */

export const VERDICTS = ["On target", "Close", "Off target"] as const;
export type Verdict = (typeof VERDICTS)[number];
export type MetricStatus = Verdict | "Not measured";

export type Reading = {
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  /** What was measured, in the user's words, e.g. "84%" or "Signed off". */
  value: string;
  /** The user's own call against the target. Normen never works this out. */
  verdict: Verdict;
  note: string;
};

/** A measure the project added for itself. */
export type CustomMetric = { id: string; phase: PhaseId; metric: string; measure: string };

export type MetricRecord = { target: string; readings: Reading[] };

export type Scorecard = {
  /** Targets and readings by measure ID (built-in "S-301" or a custom ID). */
  metrics: Record<string, MetricRecord>;
  custom: CustomMetric[];
};

export const emptyScorecard = (): Scorecard => ({ metrics: {}, custom: [] });
