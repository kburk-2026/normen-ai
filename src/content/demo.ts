import type { PhaseId } from "./phases";
import type { Block } from "./blocks";

export type { Block };

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

/** Noon UTC, so the seed shows as 4 Nov in every time zone from UTC-11 to UTC+11. */
export const SEED_TIME = "2026-11-04T12:00:00.000Z";
/** The seed time before milestone 8, still found in older saves. */
export const OLD_SEED_TIME = "2026-11-04T00:00:00.000Z";

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
  sections: demoSections(),
};

/** The demo's written pages: the default sections, with blocks in the phases it has reached. */
function demoSections(): Record<PhaseId, Section[]> {
  const s = allDefaultSections();
  const blocks: Partial<Record<PhaseId, Block[]>> = {
    conceive: [
      {
        id: "b-c1",
        type: "text",
        text: "Finance reviews every expense claim by hand, about 2,400 a month. Most are routine. The ones that need a second look (duplicates, policy breaks, odd amounts) wait in the same queue as everything else.\n\nThe idea: flag the claims that need a second look, so reviewers start there.",
      },
      {
        id: "b-c2",
        type: "callout",
        tone: "decision",
        text: "Decided 7 Oct: AI flags, people decide. No claim is approved or rejected without a reviewer.",
      },
    ],
    plan: [
      {
        id: "b-p1",
        type: "callout",
        tone: "warning",
        text: "Passed with an override: the privacy review (C-202) is still open. Data prep uses anonymized claims until legal signs off.",
      },
      {
        id: "b-p2",
        type: "table",
        rows: [
          ["Role", "Who", "Owns"],
          ["Sponsor", "Head of Finance", "Go or no-go at each checkpoint"],
          ["Product", "Ops product manager", "Scope, success measures"],
          ["Data", "Analytics team", "Pipeline and labels"],
        ],
      },
    ],
    develop: [
      {
        id: "b-d1",
        type: "text",
        text: "Two approaches so far, both trained on 18 months of anonymized travel claims. Finance labels which claims needed a second look.",
      },
      {
        id: "b-d2",
        type: "table",
        rows: [
          ["Experiment", "Result", "Next"],
          ["Rules baseline", "Catches 61% of flagged claims", "Keep as fallback"],
          ["Gradient boosted model", "Catches 84%, 6% false flags", "Bias check by department"],
        ],
      },
      { id: "b-d3", type: "divider" },
      {
        id: "b-d4",
        type: "callout",
        tone: "note",
        text: "Example figures for the demo, not real results.",
      },
    ],
  };
  for (const [phase, list] of Object.entries(blocks) as [PhaseId, Block[]][]) {
    s[phase] = s[phase].map((x) => (x.kind === "overview" ? { ...x, blocks: list } : x));
  }
  return s;
}
