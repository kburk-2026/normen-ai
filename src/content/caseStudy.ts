import { allDefaultSections, type Block, type Project, type Section } from "./demo";
import type { PhaseId } from "./phases";
import type { Scorecard } from "./scorecard";
import { emptyRoi } from "./roi";

/**
 * Career Studio: a real AI project, written up in Normen as a case study.
 * Every fact comes from the public career-studio repository (README, case
 * study, build plan and commit history), anonymized: no employer names,
 * figures or contact details. Ratings marked as proposals in the milestone 18
 * mockup were approved by the project's owner.
 */

export const CASE_STUDY_ID = "career-studio";
/** The last commit in the source history, 3 Nov 2026. */
const UPDATED = "2026-11-03T12:00:00.000Z";
const AT = "2026-10-28T12:00:00.000Z";
const REPO = "https://github.com/kburk-2026/career-studio";

export const CASE_STUDY_PROJECT: Project = {
  id: CASE_STUDY_ID,
  name: "Career Studio",
  blurb: "A private job-search workspace that uses AI to tailor applications, with the guardrails enforced in code.",
  status: "In Progress",
  caseStudy: true,
  createdAt: "2026-10-27T12:00:00.000Z",
  updatedAt: UPDATED,
  activities: {
    "NRM-101": "done",
    "NRM-102": "done",
    "NRM-103": "done",
    "NRM-104": "done",
    "NRM-201": "done",
    "NRM-202": "done",
    "NRM-203": "done",
    "NRM-204": "done",
    "NRM-205": "done",
    "NRM-302": "done",
    "NRM-304": "done",
    "NRM-403": "done",
    "NRM-501": "done",
  },
  checks: {
    "C-101": true,
    "C-102": true,
    "C-103": true,
    "C-201": true,
    "C-202": true,
    "C-203": true,
    "C-301": true,
    "C-303": true,
    "C-402": true,
  },
  passed: ["conceive", "plan", "develop", "qualify"],
  // The build plan dates Conceive and Plan only as "Oct 2026", so they have no pass date.
  passedAt: { develop: "2026-10-28", qualify: "2026-10-28" },
  overrides: [
    {
      phase: "develop",
      reason:
        "Bias testing does not apply: it makes no decisions about people. It drafts the candidate's own applications. The fabrication evals stand in.",
      at: "2026-10-28",
      openCriteria: ["C-302"],
    },
    {
      phase: "qualify",
      reason:
        "No separate pilot: the owner is the only user. A rollback test is not recorded in the sources. Security sign-off is the release audit.",
      at: "2026-10-28",
      openCriteria: ["C-401", "C-403"],
    },
  ],
  sections: caseStudySections(),
  scorecard: caseStudyScorecard(),
  pulse: {
    checkIns: [],
    incidents: [
      incident(1, "A failed privacy check was hidden by a pipe, and a real employer name reached the private repository.", "Medium", "Every release command now runs with pipefail, so a failed check stops the push."),
      incident(2, "A real figure was used as test data.", "Medium", "A full-history audit found it. History was rewritten and checked again from a fresh clone."),
      incident(3, "The privacy scan came back clean because its watch list did not include the figure.", "Low", "Lesson recorded: a clean scan only covers what is on the watch list."),
      incident(4, "Token renewals running at the same time signed the owner out.", "Low", "One shared renewal; the session is kept on network errors."),
      incident(5, "Sign-ups were meant to be off and were not.", "Medium", "Caught by the release audit."),
    ],
    alerts: { flaggedAbove: null, accuracyBaseline: null, accuracyDrop: null },
  },
  guardrails: {
    // No decisions about people; personal data; employers read the output; costly but caught; every output checked.
    answers: { people: 0, data: 1, audience: 2, harm: 1, review: 0 },
    statuses: {
      "G-302": { status: "In place", reason: "" },
      "G-502": { status: "In place", reason: "" },
      "G-602": { status: "In place", reason: "" },
      "G-702": { status: "In place", reason: "" },
      "G-101": { status: "In place", reason: "" },
      "G-201": { status: "In place", reason: "" },
      "G-202": { status: "In place", reason: "" },
      "G-402": { status: "In place", reason: "" },
    },
  },
  // No time-saved or cost figures in the sources, so the ROI model starts empty.
  roi: emptyRoi(),
  targets: {},
  log: [
    { at: AT, text: "Qualify checkpoint passed with an override" },
    { at: AT, text: "Develop checkpoint passed with an override" },
    { at: "2026-10-27T12:00:00.000Z", text: "Project created" },
  ],
};

function incident(number: number, what: string, severity: "Low" | "Medium" | "High", action: string) {
  return { id: `cs-i${number}`, number, date: "2026-10-28", what, severity, status: "Resolved" as const, action, resolved: "2026-10-28" };
}

function caseStudySections(): Record<PhaseId, Section[]> {
  const s = allDefaultSections(UPDATED);
  const overview: Partial<Record<PhaseId, Block[]>> = {
    conceive: [
      {
        id: "cs-c0",
        type: "callout",
        tone: "note",
        text: "A real project, written up from its public case study. Anonymized: no employer names, figures or contact details.",
      },
      {
        id: "cs-c1",
        type: "text",
        text: "A focused job search produces dozens of tailored resumes, cover letters and answers. By hand it is slow. With a general AI chat it is fast but risky: models round numbers up, invent tools, and turn a prototype into a launched platform. One fabricated metric can cost an interview.\n\nThe goal: fast tailoring where every claim traces to something the candidate confirmed.",
      },
      {
        id: "cs-c2",
        type: "callout",
        tone: "decision",
        text: "AI drafts; the candidate confirms the facts. The model never decides a score. No Fit Check was saved; this problem statement is the written reason to go ahead.",
      },
    ],
    plan: [
      {
        id: "cs-p1",
        type: "decision",
        rows: [
          dec("r1", "Build after the interview, with no deadline; practice in chat first", "Nothing built in two days would be ready in time."),
          dec("r2", "New repository; code public with a fictional demo; real data only behind sign-in", "Show the work without exposing personal data."),
          dec("r3", "Claude API behind a small adapter", "So another provider can be plugged in later."),
          dec("r4", "Free tiers, plus a hard AI spending cap", "Keep it free to run."),
          dec("r5", "Plain HTML and JavaScript, grown from the mockup", "No build step."),
          dec("r6", "Rewrite the old API instead of extending it", "It took a passcode in the address and allowed filter injection."),
        ],
      },
      {
        id: "cs-p2",
        type: "sources",
        rows: [
          { id: "r1", name: "Confirmed profile facts", what: "Facts the candidate has confirmed, the only source for claims", owner: "The candidate", refresh: "When a fact is confirmed", personal: "Yes", access: "Approved" },
          { id: "r2", name: "Uploaded resumes", what: "Resumes read into the profile for review", owner: "The candidate", refresh: "On upload", personal: "Yes", access: "Approved" },
          { id: "r3", name: "Job postings and links", what: "Treated as untrusted text, wrapped as data", owner: "Employers", refresh: "Per application", personal: "No", access: "Approved" },
          { id: "r4", name: "Fictional demo candidate", what: "The public demo's data", owner: "The project", refresh: "", personal: "No", access: "Approved" },
        ],
      },
    ],
    develop: [
      {
        id: "cs-d1",
        type: "modelcard",
        fields: {
          name: "Career Studio drafting and coaching",
          version: "",
          kind: "Claude Opus for resumes and cover letters; Claude Sonnet for scoring, extraction, answers and coaching. Anthropic API through a provider adapter.",
          owner: "The candidate",
          use: "Draft application materials and interview coaching from confirmed facts.",
          notFor: "Deciding scores. Confirming facts. Changing sent documents. Acting on instructions found in postings.",
          data: "Confirmed profile facts and the job posting. Postings, uploads and answers are wrapped as untrusted data.",
          limits: "Models round numbers up and invent tools; every number must appear in the confirmed facts or it is flagged.",
          oversight: "The candidate confirms every fact. Sent documents are frozen.",
        },
        reviewed: "2026-10-28",
        metrics: [
          { id: "r1", name: "Automated tests", result: "90 passing", target: "All passing" },
          { id: "r2", name: "Live row-level security checks", result: "55 passing", target: "All passing" },
          { id: "r3", name: "Live evals: injection, fabrication bait, unrelated job, character limit", result: "Passing", target: "All passing" },
        ],
      },
    ],
    launch: [
      {
        id: "cs-l1",
        type: "text",
        text: "Launched on 28 Oct 2026 from the public repository. Since then the owner has used it on real applications and revised it along the way: commits from 29 Oct to 3 Nov.\n\nThe five incidents in Pulse are the case study's \"What went wrong\" section. Each changed how the project works.",
      },
    ],
  };
  for (const [phase, list] of Object.entries(overview) as [PhaseId, Block[]][]) {
    s[phase] = s[phase].map((x) => (x.kind === "overview" ? { ...x, blocks: list } : x));
  }
  s.plan.push({ id: "cs-plan-guardrails", kind: "custom", title: "Guardrails in code", blocks: riskBlocks(), updatedAt: UPDATED });
  s.develop.push({ id: "cs-develop-build", kind: "custom", title: "Build", blocks: buildBlocks(), updatedAt: UPDATED });
  return s;
}

function dec(id: string, decision: string, why: string) {
  return { id, decision, date: "", by: "The candidate", why, status: "Made" as const };
}

function riskBlocks(): Block[] {
  const r = (id: string, risk: string, plan: string, category: "Privacy" | "Accuracy" | "Security" | "Operations", likelihood: "Low" | "Medium" | "High", impact: "Low" | "Medium" | "High") => ({
    id, risk, plan, category, likelihood, impact, owner: "The candidate", status: "Mitigating" as const,
  });
  return [
    {
      id: "cs-r1",
      type: "risk",
      rows: [
        r("r1", "Fabricated numbers or titles", "Every number must appear in the confirmed facts, or it is flagged.", "Accuracy", "High", "High"),
        r("r2", "Prompt injection from postings, uploads or answers", "Untrusted text is wrapped as data. Covered by the live evals.", "Security", "Medium", "Medium"),
        r("r3", "AI spending runs over", "The Console's cap plus the app's own lower cap, recorded through an insert-only function.", "Operations", "Low", "Low"),
        r("r4", "Personal data exposed", "Row-level security on every table and file. A privacy scanner blocks secrets and private names.", "Privacy", "Medium", "High"),
        r("r5", "Answers over the character limit", "Sent back to be shortened twice, then trimmed and flagged.", "Accuracy", "Medium", "Low"),
      ],
    },
  ];
}

function buildBlocks(): Block[] {
  return [
    {
      id: "cs-b1",
      type: "timeline",
      items: [
        { id: "r1", text: "App shell, fictional demo and privacy guard", date: "2026-10-27", done: true },
        { id: "r2", text: "Database with row-level security and a live check", date: "2026-10-27", done: true },
        { id: "r3", text: "Magic-link sign-in and an owner-only API", date: "2026-10-27", done: true },
        { id: "r4", text: "AI job review with fit scoring and spending limits", date: "2026-10-28", done: true },
        { id: "r5", text: "Tailored resumes and cover letters, with editor checks", date: "2026-10-28", done: true },
        { id: "r6", text: "AI-drafted answers to application questions", date: "2026-10-28", done: true },
        { id: "r7", text: "Interview coach", date: "2026-10-28", done: true },
        { id: "r8", text: "Released from the public repository", date: "2026-10-28", done: true },
      ],
    },
    {
      id: "cs-b2",
      type: "links",
      rows: [
        { id: "r1", title: "Career Studio source code", url: REPO, note: "Public, with a fictional demo" },
        { id: "r2", title: "Case study", url: `${REPO}/blob/main/docs/CASE_STUDY.md`, note: "The source for this project" },
      ],
    },
  ];
}

function caseStudyScorecard(): Scorecard {
  const m = (id: string, metric: string, measure: string) => ({ id, phase: "qualify" as const, metric, measure });
  const one = (value: string, note = "") => ({ target: "All passing", readings: [{ id: "r1", date: "2026-10-28", value, verdict: "On target" as const, note }] });
  return {
    custom: [
      m("cs-tests", "Automated tests", "Tests passing in the release run"),
      m("cs-rls", "Row-level security", "Live checks that one account cannot read another's data"),
      m("cs-evals", "Live evals", "Prompt injection, fabrication bait, unrelated job, hard character limit"),
      m("cs-contrast", "Contrast", "WCAG AA audit at desktop and phone width"),
    ],
    metrics: {
      "cs-tests": one("90 passing"),
      "cs-rls": one("55 passing"),
      "cs-evals": one("Passing"),
      "cs-contrast": { target: "WCAG AA", readings: [{ id: "r1", date: "2026-10-28", value: "AA at desktop and phone", verdict: "On target", note: "" }] },
    },
  };
}
