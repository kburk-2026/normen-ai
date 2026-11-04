import type { PhaseId, StageId } from "./phases";

/**
 * Where an item comes from. "course" items restate the course material on the
 * AI product development stages and lifecycle. "claude" items are Claude's
 * additions (governance, bias testing, human review, metrics, monitoring) and
 * are labeled as such in the Field Guide.
 */
export type Source = "course" | "claude";

export type Activity = {
  /** Display ID, NRM-<phase><nn>. */
  id: string;
  phase: PhaseId;
  stage: StageId;
  title: string;
  detail: string;
  source: Source;
};

export type GuardrailCategory =
  | "privacy"
  | "bias"
  | "human-review"
  | "security"
  | "transparency"
  | "compliance";

export const GUARDRAIL_LABELS: Record<GuardrailCategory, string> = {
  privacy: "Privacy",
  bias: "Bias",
  "human-review": "Human review",
  security: "Security",
  transparency: "Transparency",
  compliance: "Compliance",
};

export type Guardrail = {
  id: string;
  phase: PhaseId;
  category: GuardrailCategory;
  title: string;
  detail: string;
  source: Source;
};

export type ScorecardItem = {
  id: string;
  phase: PhaseId;
  metric: string;
  /** How it is measured. */
  measure: string;
  /** An example target. Teams set their own; these are illustrations. */
  exampleTarget: string;
  source: Source;
};

export type CheckpointCriterion = {
  id: string;
  phase: PhaseId;
  text: string;
  source: Source;
};

export const ACTIVITIES: Activity[] = [
  // 1 Conceive
  { id: "NRM-101", phase: "conceive", stage: "ideation", source: "course", title: "Confirm the problem", detail: "Write the problem in the words of the people who have it, with how often it happens and what it costs today." },
  { id: "NRM-102", phase: "conceive", stage: "ideation", source: "course", title: "Decide whether AI belongs in the answer", detail: "Weigh AI against rules, automation or a process fix. Run the Fit Check and keep the result." },
  { id: "NRM-103", phase: "conceive", stage: "ideation", source: "course", title: "Form the team", detail: "Name a product owner, a business sponsor, a data owner and an engineering lead." },
  { id: "NRM-104", phase: "conceive", stage: "data", source: "claude", title: "Find the data", detail: "List where the data lives, who owns it, and whether you are allowed to use it for this." },
  { id: "NRM-105", phase: "conceive", stage: "ideation", source: "claude", title: "Measure the baseline", detail: "Record how the work performs today, so there is something to beat." },

  // 2 Plan
  { id: "NRM-201", phase: "plan", stage: "data", source: "course", title: "Set data requirements", detail: "Sources, volume, labels, freshness and who keeps them up to date." },
  { id: "NRM-202", phase: "plan", stage: "ideation", source: "course", title: "Set functional requirements", detail: "What it does for the user, its inputs and outputs, and where it sits in their workflow." },
  { id: "NRM-203", phase: "plan", stage: "ideation", source: "course", title: "Set model requirements", detail: "Accuracy floor, speed, cost per run and how explainable the output must be." },
  { id: "NRM-204", phase: "plan", stage: "ideation", source: "claude", title: "Plan the human fallback", detail: "Decide what happens when the model is wrong, unsure or down." },
  { id: "NRM-205", phase: "plan", stage: "ideation", source: "course", title: "Win approval to build", detail: "Take the business case, risks and requirements to the sponsor for a go or no-go." },

  // 3 Develop
  { id: "NRM-301", phase: "develop", stage: "data", source: "claude", title: "Prepare and label the data", detail: "Clean, label and split the data. Record the version you train on." },
  { id: "NRM-302", phase: "develop", stage: "rnd", source: "course", title: "Run model experiments", detail: "Start with a simple baseline, then try a few candidates. Log every run." },
  { id: "NRM-303", phase: "develop", stage: "rnd", source: "course", title: "Guard the MVP from scope creep", detail: "Keep a cut list. New asks go to the backlog, not the build." },
  { id: "NRM-304", phase: "develop", stage: "rnd", source: "course", title: "Build the prototype", detail: "Put the best model into the real workflow behind a simple interface." },

  // 4 Qualify
  { id: "NRM-401", phase: "qualify", stage: "deployment", source: "course", title: "Pilot with real users", detail: "A small group uses it on real work with real data." },
  { id: "NRM-402", phase: "qualify", stage: "rnd", source: "course", title: "Compare pilot results to lab results", detail: "Find where the model does worse in real use than it did in testing, and why." },
  { id: "NRM-403", phase: "qualify", stage: "rnd", source: "claude", title: "Test the edge cases", detail: "Bad inputs, missing fields, unusual cases and deliberate misuse." },
  { id: "NRM-404", phase: "qualify", stage: "deployment", source: "claude", title: "Write the user guidance", detail: "What it is for, what it is not for, and how to report a bad output." },

  // 5 Launch
  { id: "NRM-501", phase: "launch", stage: "deployment", source: "course", title: "Soft launch to a small group", detail: "Release to one team or region first and watch closely." },
  { id: "NRM-502", phase: "launch", stage: "deployment", source: "claude", title: "Train users and support", detail: "Short training for users; a runbook for whoever takes the support calls." },
  { id: "NRM-503", phase: "launch", stage: "deployment", source: "claude", title: "Turn on monitoring", detail: "Accuracy, drift, usage and errors on a dashboard, each with an alert owner." },
  { id: "NRM-504", phase: "launch", stage: "deployment", source: "course", title: "Widen the rollout", detail: "Expand in steps, checking the numbers before each one." },

  // 6 Deliver
  { id: "NRM-601", phase: "deliver", stage: "deployment", source: "course", title: "Run it in production", detail: "A named owner, a support rota and a target for uptime and response time." },
  { id: "NRM-602", phase: "deliver", stage: "deployment", source: "course", title: "Watch for drift", detail: "Track whether the inputs or the accuracy are moving away from what you trained on." },
  { id: "NRM-603", phase: "deliver", stage: "rnd", source: "course", title: "Keep improving", detail: "Retrain on a schedule or when drift alerts fire. Log every model change." },
  { id: "NRM-604", phase: "deliver", stage: "deployment", source: "claude", title: "Collect user feedback", detail: "A one-click way to flag a bad output, reviewed every week." },

  // 7 Retire
  { id: "NRM-701", phase: "retire", stage: "deployment", source: "claude", title: "Decide to retire", detail: "Value has dropped below cost, a better option exists, or the rules have changed." },
  { id: "NRM-702", phase: "retire", stage: "deployment", source: "claude", title: "Plan the switch-over", detail: "Tell users early and move them to the replacement or the old process." },
  { id: "NRM-703", phase: "retire", stage: "deployment", source: "course", title: "Decommission the model", detail: "Turn it off, remove its access and shut down what it runs on." },
  { id: "NRM-704", phase: "retire", stage: "data", source: "course", title: "Delete or archive the data", detail: "Training data, logs and outputs, each handled under your retention policy." },
];

export const GUARDRAILS: Guardrail[] = [
  { id: "G-101", phase: "conceive", category: "bias", source: "claude", title: "Name everyone it affects", detail: "List the people the system makes decisions about, not only the people who use it." },
  { id: "G-102", phase: "conceive", category: "compliance", source: "claude", title: "Check the use case against policy", detail: "Confirm with legal or compliance that the use is allowed and how much risk it carries." },
  { id: "G-201", phase: "plan", category: "privacy", source: "claude", title: "Privacy review", detail: "Map the personal data, collect only what you need, and set how long you keep it." },
  { id: "G-202", phase: "plan", category: "human-review", source: "claude", title: "Choose the human review points", detail: "Decide which outputs a person must approve before they take effect." },
  { id: "G-301", phase: "develop", category: "bias", source: "claude", title: "Bias testing", detail: "Compare error rates across the groups that matter, such as region, role or language." },
  { id: "G-302", phase: "develop", category: "transparency", source: "claude", title: "Keep an experiment log", detail: "Record the data version, model, settings and results of every run so they can be repeated." },
  { id: "G-401", phase: "qualify", category: "human-review", source: "claude", title: "Review pilot outputs", detail: "Reviewers check a sample of outputs every week of the pilot." },
  { id: "G-402", phase: "qualify", category: "security", source: "claude", title: "Security review", detail: "Access controls, misuse of inputs, and where data goes when it leaves your systems." },
  { id: "G-501", phase: "launch", category: "transparency", source: "claude", title: "Tell people it is AI", detail: "Label AI outputs and explain how to reach a person." },
  { id: "G-502", phase: "launch", category: "human-review", source: "claude", title: "Have an off switch", detail: "Someone named can turn it off and fall back to the old process within the hour." },
  { id: "G-601", phase: "deliver", category: "bias", source: "claude", title: "Repeat the bias tests", detail: "Rerun the Develop bias tests every quarter and after every retrain." },
  { id: "G-602", phase: "deliver", category: "human-review", source: "claude", title: "Incident process", detail: "A way to report harm, a person who triages it, and a record of what was done." },
  { id: "G-701", phase: "retire", category: "privacy", source: "claude", title: "Follow the retention policy", detail: "Delete what must go and keep only what you are required to keep." },
  { id: "G-702", phase: "retire", category: "transparency", source: "claude", title: "Write down the lessons", detail: "What worked, what did not, and what the next team should know." },
];

export const SCORECARD: ScorecardItem[] = [
  { id: "S-101", phase: "conceive", source: "claude", metric: "Baseline cost of the problem", measure: "Hours per month or error rate today", exampleTarget: "Measured before any build" },
  { id: "S-201", phase: "plan", source: "claude", metric: "Agreed model targets", measure: "Accuracy, speed and cost targets in the requirements", exampleTarget: "Signed off by the sponsor" },
  { id: "S-301", phase: "develop", source: "claude", metric: "Offline accuracy", measure: "Score on held-out test data", exampleTarget: "Meets the Plan target" },
  { id: "S-302", phase: "develop", source: "claude", metric: "Fairness gap", measure: "Largest error rate difference between groups", exampleTarget: "Under 5 points" },
  { id: "S-401", phase: "qualify", source: "claude", metric: "Pilot accuracy", measure: "Reviewed sample of real outputs", exampleTarget: "Within 5 points of lab accuracy" },
  { id: "S-402", phase: "qualify", source: "claude", metric: "Time saved", measure: "Minutes per task, pilot group against baseline", exampleTarget: "At least 20% faster" },
  { id: "S-501", phase: "launch", source: "claude", metric: "Adoption", measure: "Share of eligible users active weekly", exampleTarget: "60% by week four" },
  { id: "S-502", phase: "launch", source: "claude", metric: "Incidents", measure: "Reported harms or serious errors", exampleTarget: "None unresolved after 48 hours" },
  { id: "S-601", phase: "deliver", source: "claude", metric: "Drift", measure: "Change in input mix or accuracy since the last retrain", exampleTarget: "Alert when accuracy drops 3 points" },
  { id: "S-602", phase: "deliver", source: "claude", metric: "Flagged outputs", measure: "Share of outputs users mark as wrong", exampleTarget: "Under 2%" },
  { id: "S-701", phase: "retire", source: "claude", metric: "Clean shutdown", measure: "Data stores, keys and jobs left running", exampleTarget: "Zero" },
];

export const CHECKPOINTS: CheckpointCriterion[] = [
  { id: "C-101", phase: "conceive", source: "course", text: "The sponsor agrees the problem is real and worth solving." },
  { id: "C-102", phase: "conceive", source: "course", text: "AI is the right answer: Fit Check 70 or above, or a written reason to go ahead." },
  { id: "C-103", phase: "conceive", source: "course", text: "The team is named." },
  { id: "C-201", phase: "plan", source: "course", text: "Data, functional and model requirements are approved." },
  { id: "C-202", phase: "plan", source: "claude", text: "The privacy review is done." },
  { id: "C-203", phase: "plan", source: "course", text: "The sponsor approves the build." },
  { id: "C-301", phase: "develop", source: "claude", text: "The model meets the offline targets." },
  { id: "C-302", phase: "develop", source: "claude", text: "Bias tests pass, or every gap has a written fix." },
  { id: "C-303", phase: "develop", source: "course", text: "The prototype is demoed to the sponsor." },
  { id: "C-401", phase: "qualify", source: "course", text: "Pilot results hold up against lab results." },
  { id: "C-402", phase: "qualify", source: "claude", text: "Reviewers and security sign off." },
  { id: "C-403", phase: "qualify", source: "claude", text: "The rollback plan has been tested." },
  { id: "C-501", phase: "launch", source: "course", text: "The soft launch meets its targets." },
  { id: "C-502", phase: "launch", source: "claude", text: "Monitoring is live and every alert has an owner." },
  { id: "C-601", phase: "deliver", source: "claude", text: "Quarterly reviews are held and every model change is logged." },
  { id: "C-602", phase: "deliver", source: "claude", text: "A retirement trigger is met and the sponsor agrees." },
  { id: "C-701", phase: "retire", source: "course", text: "The model is off and nothing depends on it." },
  { id: "C-702", phase: "retire", source: "course", text: "Data is deleted or archived under policy." },
  { id: "C-703", phase: "retire", source: "claude", text: "Lessons are written up and shared." },
];
