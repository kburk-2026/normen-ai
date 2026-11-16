/**
 * Risk tiering: five questions set a project's tier, and the tier decides which
 * guardrails it must have. Claude's design, not legal advice; the Field Guide
 * labels it as such.
 */

export const TIERS = ["Low", "Medium", "High"] as const;
export type Tier = (typeof TIERS)[number];

export type TierQuestion = { id: string; question: string; answers: { label: string; tier: Tier }[] };

export const TIER_QUESTIONS: TierQuestion[] = [
  {
    id: "people",
    question: "Does it make or shape decisions about people, such as jobs, pay, benefits, access or discipline?",
    answers: [
      { label: "No", tier: "Low" },
      { label: "It shapes them; a person decides", tier: "Medium" },
      { label: "It decides on its own", tier: "High" },
    ],
  },
  {
    id: "data",
    question: "What data does it use?",
    answers: [
      { label: "No personal data", tier: "Low" },
      { label: "Personal data, such as names or work records", tier: "Medium" },
      { label: "Sensitive data, such as health, money troubles, or protected traits", tier: "High" },
    ],
  },
  {
    id: "audience",
    question: "Who sees what it produces?",
    answers: [
      { label: "Only the team running it", tier: "Low" },
      { label: "People across the organization", tier: "Low" },
      { label: "Customers or the public", tier: "Medium" },
    ],
  },
  {
    id: "harm",
    question: "If it gets something wrong, what is the worst that happens?",
    answers: [
      { label: "Minor, and easy to fix", tier: "Low" },
      { label: "Costly, but someone would catch it", tier: "Medium" },
      { label: "Serious harm to a person", tier: "High" },
    ],
  },
  {
    id: "review",
    question: "Does a person check its outputs before they take effect?",
    answers: [
      { label: "Every output", tier: "Low" },
      { label: "A sample of them", tier: "Medium" },
      { label: "No", tier: "Medium" },
    ],
  },
];

/** The guardrails each tier adds. A tier requires its own and every lower tier's. */
export const TIER_ADDS: Record<Tier, string[]> = {
  Low: ["G-102", "G-302", "G-501", "G-502", "G-602", "G-702"],
  Medium: ["G-101", "G-201", "G-202", "G-402", "G-701"],
  High: ["G-301", "G-401", "G-601"],
};

export const GUARDRAIL_STATUSES = ["To do", "In progress", "In place", "Not needed"] as const;
export type GuardrailStatus = (typeof GUARDRAIL_STATUSES)[number];

export type GuardrailState = { status: GuardrailStatus; /** Why it is not needed. */ reason: string };

/** A project's tier answers (index into each question's answers) and guardrail statuses. */
export type GuardrailPlan = {
  answers: Record<string, number>;
  statuses: Record<string, GuardrailState>;
};

export const emptyGuardrailPlan = (): GuardrailPlan => ({ answers: {}, statuses: {} });
