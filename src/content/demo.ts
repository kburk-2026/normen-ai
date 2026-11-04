import type { PhaseId } from "./phases";

export type ActivityStatus = "todo" | "doing" | "done";

export const PROJECT_STATUSES = ["Draft", "In Progress", "In Review", "Complete"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** A checkpoint passed without every criterion met. Kept as a permanent record. */
export type Override = {
  phase: PhaseId;
  reason: string;
  /** ISO date the override was logged. */
  at: string;
  /** Criteria IDs that were open when the override was logged. */
  openCriteria: string[];
};

/** A block of content in a section. Block types arrive in milestone 8. */
export type Block = { id: string; type: string; [key: string]: unknown };

/**
 * A page inside a phase. Every phase has an "overview" and a "checklist"
 * section that cannot be deleted; "custom" sections are the user's own.
 */
export type Section = {
  id: string;
  kind: "overview" | "checklist" | "custom";
  title: string;
  blocks: Block[];
  /** ISO timestamp of the last change. */
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  blurb: string;
  status: ProjectStatus;
  /** True only for the seeded Expense triage demo. */
  isDemo?: boolean;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  /** Status by activity ID; anything missing is "todo". */
  activities: Record<string, ActivityStatus>;
  /** Checkpoint criteria that are met, by criterion ID. */
  checks: Record<string, boolean>;
  /** Phases whose checkpoint has been passed, normally or by override. */
  passed: PhaseId[];
  /** ISO date each checkpoint was passed. Older passes may have none. */
  passedAt: Partial<Record<PhaseId, string>>;
  overrides: Override[];
  /** Sections by phase, in display order. */
  sections: Record<PhaseId, Section[]>;
};

const SEED_TIME = "2026-11-04T00:00:00.000Z";

/** The two sections every phase starts with. IDs are stable per phase. */
export function defaultSections(phase: PhaseId, at = SEED_TIME): Section[] {
  return [
    { id: `${phase}-overview`, kind: "overview", title: "Overview", blocks: [], updatedAt: at },
    { id: `${phase}-checklist`, kind: "checklist", title: "Checklist", blocks: [], updatedAt: at },
  ];
}

export function allDefaultSections(at = SEED_TIME): Record<PhaseId, Section[]> {
  const ids: PhaseId[] = ["conceive", "plan", "develop", "qualify", "launch", "deliver", "retire"];
  return Object.fromEntries(ids.map((id) => [id, defaultSections(id, at)])) as Record<PhaseId, Section[]>;
}

export const DEMO_ID = "demo";

/**
 * The seeded demo project. Conceive passed cleanly; Plan passed with an
 * override (privacy review still open); Develop is under way.
 */
export const DEMO_PROJECT: Project = {
  id: DEMO_ID,
  name: "Expense triage",
  blurb: "Flag expense claims that need a second look, so finance reviews the right ones first.",
  status: "In Progress",
  isDemo: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: SEED_TIME,
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
  },
  passed: ["conceive", "plan"],
  passedAt: { conceive: "2026-10-07", plan: "2026-10-21" },
  overrides: [
    {
      phase: "plan",
      reason:
        "Privacy review is booked with legal for week two. The sponsor agreed to start data prep on anonymized claims until it is done.",
      at: "2026-10-21",
      openCriteria: ["C-202"],
    },
  ],
  sections: allDefaultSections(),
};
