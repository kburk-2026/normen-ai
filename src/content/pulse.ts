/**
 * Pulse: how a project is doing in use. One check-in per week, an incident
 * log, and two alert lines the project sets for itself.
 */

export type CheckIn = {
  id: string;
  /** The Monday the week starts on, YYYY-MM-DD. One check-in per week. */
  week: string;
  /** Every number is optional: people log what they have. */
  uses: number | null;
  /** Share of outputs people flagged as wrong, in percent. */
  flagged: number | null;
  /** Accuracy on a reviewed sample, in percent. */
  accuracy: number | null;
  note: string;
};

export const SEVERITIES = ["Low", "Medium", "High"] as const;
export type Severity = (typeof SEVERITIES)[number];
export const INCIDENT_STATUSES = ["Open", "Investigating", "Resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export type Incident = {
  id: string;
  /** Shown as #1, #2... in the order incidents were reported. */
  number: number;
  /** YYYY-MM-DD. */
  date: string;
  what: string;
  severity: Severity;
  status: IncidentStatus;
  /** What was done about it. */
  action: string;
  /** YYYY-MM-DD, or "" while not resolved. */
  resolved: string;
};

/** The project's own alert lines. null means not set. */
export type AlertLines = {
  /** Flag a week when flagged outputs go above this percent. */
  flaggedAbove: number | null;
  /** Accuracy at launch, in percent. */
  accuracyBaseline: number | null;
  /** Flag a week when accuracy falls this many points below the baseline. */
  accuracyDrop: number | null;
};

export type Pulse = { checkIns: CheckIn[]; incidents: Incident[]; alerts: AlertLines };

export const emptyPulse = (): Pulse => ({
  checkIns: [],
  incidents: [],
  alerts: { flaggedAbove: null, accuracyBaseline: null, accuracyDrop: null },
});
