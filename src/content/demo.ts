import type { PhaseId } from "./phases";
import type { Block } from "./blocks";
import type { FitBand } from "./fitCheck";
import type { Scorecard } from "./scorecard";
import { emptyPulse, type Pulse } from "./pulse";
import type { GuardrailPlan } from "./riskTier";

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

/** One line of a project's changelog. Normen writes these; people never do. */
export type LogEntry = {
  /** ISO timestamp. */
  at: string;
  text: string;
  /** Set on entries that are written at most once, e.g. one "Edited" line per section per day. */
  key?: string;
};

/** The latest Fit Check result saved to a project. */
export type FitResult = {
  score: number;
  band: FitBand;
  /** True when the serious-harm answer forced the lowest band. */
  capped: boolean;
  /** Date saved, YYYY-MM-DD. */
  at: string;
};

export type Project = {
  id: string;
  name: string;
  blurb: string;
  status: ProjectStatus;
  /** True only for the seeded Expense triage demo. */
  isDemo?: boolean;
  /** Demo only: the DEMO_VERSION this save was last brought up to. */
  demoVersion?: number;
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
  /** The changelog, newest first. */
  log: LogEntry[];
  /** The latest saved Fit Check result, shown as evidence on the Conceive checkpoint. */
  fitCheck?: FitResult;
  /** Targets and readings for the project's measures. */
  scorecard: Scorecard;
  /** Weekly check-ins, incidents and alert lines, once the system is in use. */
  pulse: Pulse;
  /** Risk tier answers and the status of each guardrail. */
  guardrails: GuardrailPlan;
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
 * Bump when the demo gains a page, and list the page in DEMO_ADDED_PAGES.
 * A saved demo from an earlier version gets the new pages when it loads;
 * its edits stay, and a page deleted after that stays deleted.
 */
export const DEMO_VERSION = 6;
export const DEMO_ADDED_PAGES: { phase: PhaseId; sectionId: string; since: number }[] = [
  { phase: "plan", sectionId: "plan-governance", since: 1 },
  { phase: "develop", sectionId: "develop-model-data", since: 2 },
  { phase: "develop", sectionId: "develop-prototype", since: 3 },
];

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
  demoVersion: DEMO_VERSION,
  createdAt: "2026-10-01T12:00:00.000Z",
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
  fitCheck: { score: 78, band: "good", capped: false, at: "2026-10-06" },
  scorecard: demoScorecard(),
  // The demo has not launched, so its Pulse starts empty.
  pulse: emptyPulse(),
  // Claim notes hold health details, so the demo is High tier. The privacy review is still in
  // progress, matching the Plan checkpoint's open privacy criterion.
  guardrails: {
    answers: { people: 1, data: 2, audience: 1, harm: 1, review: 0 },
    statuses: {
      "G-101": { status: "In place", reason: "" },
      "G-102": { status: "In place", reason: "" },
      "G-201": { status: "In progress", reason: "" },
      "G-202": { status: "In place", reason: "" },
      "G-301": { status: "In progress", reason: "" },
      "G-302": { status: "In place", reason: "" },
    },
  },
  log: [
    { at: "2026-10-21T12:00:00.000Z", text: "Plan checkpoint passed with an override" },
    { at: "2026-10-07T12:00:00.000Z", text: "Conceive checkpoint passed" },
    { at: "2026-10-06T12:00:00.000Z", text: "Fit Check saved: 78 out of 100 (Good fit for AI)" },
    { at: "2026-10-01T12:00:00.000Z", text: "Project created" },
  ],
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
  s.plan.push({ id: "plan-governance", kind: "custom", title: "Governance", blocks: governanceBlocks(), updatedAt: SEED_TIME });
  s.develop.push({ id: "develop-model-data", kind: "custom", title: "Model and data", blocks: modelAndDataBlocks(), updatedAt: SEED_TIME });
  s.develop.push({ id: "develop-prototype", kind: "custom", title: "Prototype", blocks: prototypeBlocks(), updatedAt: SEED_TIME });
  return s;
}

/** The demo's Governance page in Plan: one of each governance block. (A function, so it exists when DEMO_PROJECT is built above.) */
function governanceBlocks(): Block[] {
  return [
  {
    id: "b-g1",
    type: "decision",
    rows: [
      { id: "r1", decision: "AI flags, people decide", date: "2026-10-07", by: "Head of Finance", why: "A wrong rejection costs more trust than a slow one.", status: "Made" },
      { id: "r2", decision: "Start data prep before the privacy review closes", date: "2026-10-21", by: "Sponsor", why: "Anonymized claims only. Logged as a checkpoint override.", status: "Made" },
      { id: "r3", decision: "Flag threshold for the pilot", date: "", by: "", why: "", status: "Open" },
    ],
  },
  {
    id: "b-g2",
    type: "approval",
    rows: [
      { id: "r1", item: "Build budget", who: "Head of Finance", date: "2026-10-20", status: "Approved" },
      { id: "r2", item: "Privacy review (C-202)", who: "Legal", date: "", status: "Pending" },
      { id: "r3", item: "Access to claims history", who: "IT security", date: "", status: "On hold" },
    ],
  },
  {
    id: "b-g3",
    type: "timeline",
    items: [
      { id: "r1", text: "Requirements approved", date: "2026-10-21", done: true },
      { id: "r2", text: "Privacy review signed off", date: "2026-11-13", done: false },
      { id: "r3", text: "Prototype demo to sponsor", date: "2026-12-04", done: false },
      { id: "r4", text: "Pilot starts", date: "", done: false },
    ],
  },
  {
    id: "b-g4",
    type: "swot",
    s: ["18 months of labeled claims", "Finance sponsor is engaged"],
    w: ["One analyst owns the pipeline"],
    o: ["The same model could triage invoices"],
    t: ["Policy changes shift what counts as unusual"],
  },
];
}

/** The demo's "Model and data" page in Develop: one of each AI block. Figures are examples. */
function modelAndDataBlocks(): Block[] {
  return [
    {
      id: "b-m1",
      type: "risk",
      rows: [
        { id: "r1", risk: "The model flags one department's claims more often than others", plan: "Compare flag rates by department each month. Retrain if any gap passes 5 points.", category: "Bias", likelihood: "Medium", impact: "High", owner: "Analytics lead", status: "Mitigating" },
        { id: "r2", risk: "Claim notes contain names and health details", plan: "Strip free-text notes before training. Privacy review C-202 covers the rest.", category: "Privacy", likelihood: "High", impact: "High", owner: "Legal", status: "Open" },
        { id: "r3", risk: "Reviewers trust the flag and stop checking unflagged claims", plan: "Sample 5% of unflagged claims for review every week.", category: "Misuse", likelihood: "Medium", impact: "Medium", owner: "Finance ops", status: "Open" },
        { id: "r4", risk: "The scoring service is down at month end", plan: "Fall back to the rules baseline; reviewers see a banner.", category: "Operations", likelihood: "Low", impact: "Medium", owner: "IT", status: "Accepted" },
      ],
    },
    {
      id: "b-m2",
      type: "modelcard",
      fields: {
        name: "Expense triage classifier",
        version: "0.3 (prototype)",
        kind: "Gradient boosted trees, built in-house",
        owner: "Analytics team",
        use: "Rank incoming expense claims so finance reviews the riskiest first.",
        notFor: "Approving or rejecting claims on its own. Judging employees.",
        data: "18 months of anonymized travel claims, labeled by finance.",
        limits: "Weak on claim types with few examples, such as relocation. Not tested on claims in other currencies.",
        oversight: "Every flag goes to a reviewer. Reviewers can overrule it and say why.",
      },
      reviewed: "2026-11-02",
      metrics: [
        { id: "r1", name: "Flagged claims caught", result: "84%", target: "80% or more" },
        { id: "r2", name: "False flags", result: "6%", target: "Under 10%" },
        { id: "r3", name: "Flag-rate gap between departments", result: "7 points", target: "Under 5 points" },
      ],
    },
    {
      id: "b-m3",
      type: "sources",
      rows: [
        { id: "r1", name: "Expense claims history", what: "18 months of claims with amount, category, department and outcome", owner: "Finance systems", refresh: "Nightly", personal: "Yes", access: "Approved" },
        { id: "r2", name: "Reviewer decisions", what: "Which claims finance sent back, and why", owner: "Finance ops", refresh: "Weekly", personal: "No", access: "Approved" },
        { id: "r3", name: "HR department list", what: "Department and cost center for each employee", owner: "HR", refresh: "Monthly", personal: "Yes", access: "Requested" },
      ],
    },
  ];
}

/** The demo's "Prototype" page in Develop: an image and a list of links. Every address is real. */
function prototypeBlocks(): Block[] {
  return [
    {
      id: "b-pr1",
      type: "text",
      text: "The prototype sits between the expense tool and the review queue. It changes the order claims are reviewed in, and nothing else.",
    },
    {
      id: "b-pr2",
      type: "image",
      url: "https://normen-ai.vercel.app/demo/triage-flow.svg",
      alt: "Flow diagram. A claim comes in from the expense tool and the model scores it. Flagged claims go to the top of the queue; claims that are not flagged join the normal queue, with 5% sampled. Either way, a reviewer decides.",
      caption: "How a claim moves through triage.",
    },
    {
      id: "b-pr3",
      type: "links",
      rows: [
        { id: "r1", title: "Normen Field Guide", url: "https://normen-ai.vercel.app/field-guide", note: "The method this project follows" },
        { id: "r2", title: "Fit Check", url: "https://normen-ai.vercel.app/fit-check", note: "The ten questions behind the Conceive checkpoint" },
        { id: "r3", title: "Normen AI source code", url: "https://github.com/kburk-2026/normen-ai", note: "" },
      ],
    },
  ];
}

/** The demo's Scorecard: the measures for the phases it has reached. Example figures, not real results. */
function demoScorecard(): Scorecard {
  const r = (id: string, date: string, value: string, verdict: "On target" | "Close" | "Off target", note = "") => ({ id, date, value, verdict, note });
  return {
    custom: [],
    metrics: {
      "S-101": { target: "Measured before any build", readings: [r("r1", "2026-10-05", "310 review hours a month", "On target", "Baseline from finance timesheets")] },
      "S-201": { target: "Signed off by the sponsor", readings: [r("r1", "2026-10-21", "Signed off", "On target")] },
      "S-301": {
        target: "Catches 80% or more of flagged claims",
        readings: [
          r("r1", "2026-10-28", "61%", "Off target", "Rules baseline"),
          r("r2", "2026-11-04", "79%", "Close", "First boosted model"),
          r("r3", "2026-11-11", "84%", "On target", "After cleaning duplicate claims"),
        ],
      },
      "S-302": {
        target: "Under 5 points",
        readings: [r("r1", "2026-11-04", "9 points", "Off target"), r("r2", "2026-11-11", "7 points", "Off target", "Travel team still flagged more often")],
      },
    },
  };
}
