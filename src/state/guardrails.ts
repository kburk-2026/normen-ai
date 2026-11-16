import { GUARDRAILS } from "@/content/lifecycle";
import type { Project } from "@/content/demo";
import {
  GUARDRAIL_STATUSES,
  TIERS,
  TIER_ADDS,
  TIER_QUESTIONS,
  emptyGuardrailPlan,
  type GuardrailPlan,
  type GuardrailState,
  type GuardrailStatus,
  type Tier,
} from "@/content/riskTier";
import { addLog } from "./log";

/** The tier, once every question is answered: the highest tier any answer reaches. */
export function tierOf(plan: GuardrailPlan): Tier | null {
  let tier: Tier = "Low";
  for (const q of TIER_QUESTIONS) {
    const a = q.answers[plan.answers[q.id]];
    if (!a) return null;
    if (TIERS.indexOf(a.tier) > TIERS.indexOf(tier)) tier = a.tier;
  }
  return tier;
}

/** The answers that set the tier, in words. */
export function tierReasons(plan: GuardrailPlan): string[] {
  const tier = tierOf(plan);
  if (!tier) return [];
  return TIER_QUESTIONS.map((q) => q.answers[plan.answers[q.id]]).filter((a) => a.tier === tier).map((a) => a.label);
}

/** One sentence on what set the tier, for the page and the exports. */
export function tierExplanation(plan: GuardrailPlan): string {
  const tier = tierOf(plan);
  if (!tier) return "";
  return tier === "Low" ? "Every answer points to Low" : `Set by: ${tierReasons(plan).join("; ")}`;
}

export const requiredFor = (tier: Tier): string[] => TIERS.slice(0, TIERS.indexOf(tier) + 1).flatMap((t) => TIER_ADDS[t]);

export const stateOf = (plan: GuardrailPlan, id: string): GuardrailState => plan.statuses[id] ?? { status: "To do", reason: "" };

export function coverage(plan: GuardrailPlan) {
  const tier = tierOf(plan);
  const required = tier ? requiredFor(tier) : [];
  return {
    tier,
    required: required.length,
    inPlace: required.filter((id) => stateOf(plan, id).status === "In place").length,
    answered: TIER_QUESTIONS.filter((q) => q.answers[plan.answers[q.id]]).length,
  };
}

const titleOf = (id: string) => GUARDRAILS.find((g) => g.id === id)?.title ?? id;
const withPlan = (p: Project, plan: GuardrailPlan): Project => ({ ...p, guardrails: plan });

export function setAnswer(p: Project, questionId: string, answer: number, today: string): Project {
  if (p.guardrails.answers[questionId] === answer) return p;
  const before = tierOf(p.guardrails);
  const plan = { ...p.guardrails, answers: { ...p.guardrails.answers, [questionId]: answer } };
  const after = tierOf(plan);
  let next = addLog(withPlan(p, plan), "Risk tier questions answered", `tier-answers:${today}`);
  if (after !== before && after) next = addLog(next, before ? `Risk tier changed: ${before} to ${after}` : `Risk tier set: ${after}`);
  return next;
}

export function setGuardrailStatus(p: Project, id: string, status: GuardrailStatus): Project {
  const prev = stateOf(p.guardrails, id);
  if (prev.status === status) return p;
  const plan = { ...p.guardrails, statuses: { ...p.guardrails.statuses, [id]: { ...prev, status } } };
  return addLog(withPlan(p, plan), `Guardrail: ${titleOf(id)}, ${prev.status} to ${status}`);
}

export function setGuardrailReason(p: Project, id: string, reason: string, today: string): Project {
  const prev = stateOf(p.guardrails, id);
  if (prev.reason === reason) return p;
  const plan = { ...p.guardrails, statuses: { ...p.guardrails.statuses, [id]: { ...prev, reason } } };
  return addLog(withPlan(p, plan), `Guardrail reason edited: ${titleOf(id)}`, `guard-reason:${id}:${today}`);
}

/** Repair a saved plan: unknown questions, answers and guardrails are dropped. */
export function normalizeGuardrailPlan(raw: unknown): GuardrailPlan {
  if (!raw || typeof raw !== "object") return emptyGuardrailPlan();
  const r = raw as Partial<GuardrailPlan>;
  const answers: Record<string, number> = {};
  for (const q of TIER_QUESTIONS) {
    const a = (r.answers ?? {})[q.id];
    if (typeof a === "number" && Number.isInteger(a) && a >= 0 && a < q.answers.length) answers[q.id] = a;
  }
  const statuses: Record<string, GuardrailState> = {};
  for (const g of GUARDRAILS) {
    const s = (r.statuses ?? {})[g.id] as Partial<GuardrailState> | undefined;
    if (s && GUARDRAIL_STATUSES.includes(s.status as GuardrailStatus)) {
      statuses[g.id] = { status: s.status as GuardrailStatus, reason: typeof s.reason === "string" ? s.reason : "" };
    }
  }
  return { answers, statuses };
}
