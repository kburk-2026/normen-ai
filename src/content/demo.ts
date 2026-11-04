import type { PhaseId } from "./phases";

export type ActivityStatus = "todo" | "doing" | "done";

export type Project = {
  name: string;
  blurb: string;
  /** Status by activity ID; anything missing is "todo". */
  activities: Record<string, ActivityStatus>;
  /** Phases whose checkpoint has been passed. */
  passed: PhaseId[];
};

/** The seeded demo project. Conceive and Plan are done; Develop is under way. */
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
  passed: ["conceive", "plan"],
};
