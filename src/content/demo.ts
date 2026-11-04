import type { PhaseId } from "./phases";

export type ActivityStatus = "todo" | "doing" | "done";

/** A checkpoint passed without every criterion met. Kept as a permanent record. */
export type Override = {
  phase: PhaseId;
  reason: string;
  /** ISO date the override was logged. */
  at: string;
  /** Criteria IDs that were open when the override was logged. */
  openCriteria: string[];
};

export type Project = {
  name: string;
  blurb: string;
  /** Status by activity ID; anything missing is "todo". */
  activities: Record<string, ActivityStatus>;
  /** Checkpoint criteria that are met, by criterion ID. */
  checks: Record<string, boolean>;
  /** Phases whose checkpoint has been passed, normally or by override. */
  passed: PhaseId[];
  overrides: Override[];
};

/**
 * The seeded demo project. Conceive passed cleanly; Plan passed with an
 * override (privacy review still open); Develop is under way.
 */
export const DEMO_PROJECT: Project = {
  name: "Expense triage",
  blurb: "Flag expense claims that need a second look, so finance reviews the right ones first.",
  activities: {
    "NRM-101": "done",
    "NRM-102": "done",
    "NRM-103": "done",
    "NRM-104": "done",
    "NRM-105": "done",
    "NRM-201": "done",
    "NRM-202": "done",
    "NRM-203": "done",
    "NRM-204": "done",
    "NRM-205": "done",
    "NRM-301": "done",
    "NRM-302": "doing",
    "NRM-303": "doing",
  },
  checks: {
    "C-101": true,
    "C-102": true,
    "C-103": true,
    "C-201": true,
    "C-203": true,
    "C-301": false,
  },
  passed: ["conceive", "plan"],
  overrides: [
    {
      phase: "plan",
      reason:
        "Privacy review is booked with legal for week two. The sponsor agreed to start data prep on anonymized claims until it is done.",
      at: "2026-10-21",
      openCriteria: ["C-202"],
    },
  ],
};
