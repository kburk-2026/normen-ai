/**
 * The Fit Check: ten weighted questions that score whether a problem needs AI.
 * Questions, weights and answer points are Claude's design (see CLAUDE.md).
 * Scoring is transparent: each answer earns a share of its question's weight.
 */

export type FitAnswer = {
  label: string;
  /** Share of the question's weight this answer earns, 0 to 1. */
  points: number;
  /** Shown on the result when this answer is chosen and points are low. */
  watchOut?: string;
  /** Choosing this answer forces the "AI isn't the answer" band, whatever the total. */
  capsResult?: boolean;
};

export type FitQuestion = {
  id: string;
  question: string;
  hint: string;
  /** Weights across all questions sum to 100. */
  weight: number;
  answers: FitAnswer[];
  /** Shown on the result when the chosen answer earns full points. */
  strength: string;
};

export const FIT_QUESTIONS: FitQuestion[] = [
  {
    id: "rules",
    question: "Could you write the decision down as rules?",
    hint: "If a flowchart can do it, rules or automation are cheaper and easier to trust.",
    weight: 15,
    strength: "The decision depends on judgment, which is where AI earns its keep.",
    answers: [
      { label: "Yes, the rules are clear", points: 0, watchOut: "Clear rules usually beat a model. Try rules or automation first." },
      { label: "Mostly, but with many exceptions", points: 0.6 },
      { label: "No, people judge from experience or examples", points: 1 },
    ],
  },
  {
    id: "examples",
    question: "Do you have past examples with the right answer recorded?",
    hint: "Models learn from examples. No examples means a long Data stage first.",
    weight: 15,
    strength: "There are labeled examples to learn from.",
    answers: [
      { label: "None", points: 0, watchOut: "No labeled examples yet. Plan time to collect and label data before any model work." },
      { label: "Some, but they are messy or incomplete", points: 0.5 },
      { label: "Hundreds or more, labeled", points: 1 },
    ],
  },
  {
    id: "volume",
    question: "How often does the task happen?",
    hint: "AI pays off on volume. Rare tasks rarely repay the setup.",
    weight: 10,
    strength: "There is enough volume for the effort to pay off.",
    answers: [
      { label: "A few times a month", points: 0, watchOut: "Low volume. The time saved may not cover the cost of building and running it." },
      { label: "Every day", points: 0.6 },
      { label: "Hundreds of times a day or more", points: 1 },
    ],
  },
  {
    id: "errors",
    question: "What happens when the answer is wrong?",
    hint: "Every model makes mistakes. The question is what they cost.",
    weight: 12,
    strength: "Mistakes are cheap and easy to fix.",
    answers: [
      {
        label: "Serious harm, and nobody would catch it",
        points: 0,
        capsResult: true,
        watchOut: "Mistakes would cause serious harm that nobody would catch. That rules AI out on its own, whatever the score.",
      },
      { label: "Costly, but a person would catch it", points: 0.6 },
      { label: "Minor and easy to fix", points: 1 },
    ],
  },
  {
    id: "review",
    question: "Can a person check outputs before they take effect?",
    hint: "Human review turns a risky model into a useful assistant.",
    weight: 8,
    strength: "A person can review outputs before they take effect.",
    answers: [
      { label: "No", points: 0, watchOut: "No human review. Plan for one, at least during the pilot." },
      { label: "Some of them", points: 0.5 },
      { label: "Yes", points: 1 },
    ],
  },
  {
    id: "input",
    question: "What kind of input does the task use?",
    hint: "Text, images and audio are where AI does what rules cannot.",
    weight: 10,
    strength: "The input is unstructured, which rules handle badly.",
    answers: [
      { label: "Neat fields already in a system", points: 0.3 },
      { label: "A mix of fields and free text", points: 0.7 },
      { label: "Mostly text, documents, images or audio", points: 1 },
    ],
  },
  {
    id: "simpler",
    question: "Would a simpler fix solve most of it?",
    hint: "A process change, a form or an automation is often enough.",
    weight: 10,
    strength: "Simpler fixes have been tried and fall short.",
    answers: [
      { label: "Probably, nobody has tried yet", points: 0, watchOut: "Try the simple fix first. It is faster and cheaper to learn from." },
      { label: "Partly", points: 0.5 },
      { label: "No, we tried and it fell short", points: 1 },
    ],
  },
  {
    id: "explain",
    question: "Must every decision be explained to the person it affects?",
    hint: "Some decisions, such as hiring or credit, need reasons a model cannot always give.",
    weight: 7,
    strength: "Decisions do not need a line-by-line explanation.",
    answers: [
      { label: "Yes, in detail, by law or policy", points: 0.2, watchOut: "Decisions must be explained in detail. Check with legal before you start." },
      { label: "A general reason is enough", points: 0.7 },
      { label: "No", points: 1 },
    ],
  },
  {
    id: "value",
    question: "What is it worth if it works?",
    hint: "AI projects take months. The prize should be worth it.",
    weight: 8,
    strength: "The payoff is big enough to justify the work.",
    answers: [
      { label: "A small time saving", points: 0.2 },
      { label: "A clear saving in time or cost", points: 0.6 },
      { label: "A major business outcome", points: 1 },
    ],
  },
  {
    id: "owner",
    question: "Is there someone to own it after launch?",
    hint: "Models drift. Someone has to watch and retrain them.",
    weight: 5,
    strength: "There is a named owner after launch.",
    answers: [
      { label: "No", points: 0, watchOut: "No owner after launch. Name one before you build." },
      { label: "Maybe, part-time", points: 0.5 },
      { label: "Yes, named", points: 1 },
    ],
  },
];

export type FitBand = "good" | "simpler" | "no";

export const FIT_BANDS: Record<FitBand, { min: number; title: string; body: string }> = {
  good: { min: 70, title: "Good fit for AI", body: "This problem has what AI needs. Take it to the Workbench and start with Conceive." },
  simpler: { min: 40, title: "Try rules or automation first", body: "AI could help, but a simpler fix may get you most of the way for less." },
  no: { min: 0, title: "AI isn't the answer here", body: "The problem lacks what AI needs to work well. Look at a process change instead." },
};

/** Answers are indexes into each question's answers, keyed by question ID. */
export function scoreFit(answers: Record<string, number>) {
  let score = 0;
  let capped = false;
  const strengths: string[] = [];
  const watchOuts: string[] = [];
  for (const q of FIT_QUESTIONS) {
    const i = answers[q.id];
    if (i === undefined) continue;
    const a = q.answers[i];
    score += q.weight * a.points;
    if (a.points === 1) strengths.push(q.strength);
    if (a.capsResult) {
      capped = true;
      if (a.watchOut) watchOuts.unshift(a.watchOut);
    } else if (a.watchOut) watchOuts.push(a.watchOut);
  }
  const rounded = Math.round(score);
  const band: FitBand = capped
    ? "no"
    : rounded >= FIT_BANDS.good.min
      ? "good"
      : rounded >= FIT_BANDS.simpler.min
        ? "simpler"
        : "no";
  return { score: rounded, band, capped, strengths, watchOuts };
}
