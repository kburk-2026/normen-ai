"use client";

import Link from "next/link";
import { IconArrowRight, IconShieldCheck } from "@tabler/icons-react";
import { STATUS_STYLE } from "@/components/projects/ProjectDialogs";
import { useWorkspace } from "@/state/ProjectProvider";
import { coverage } from "@/state/guardrails";
import { TIER_PILL } from "./ProjectGuardrails";
import TierRules from "./TierRules";

/** Every project's tier and guardrail coverage, then how tiering works. */
export default function GuardrailsOverview() {
  const { loaded, projects } = useWorkspace();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconShieldCheck size={26} className="text-orange" aria-hidden /> Guardrails
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each project answers five questions to set its risk tier, and the tier decides which guardrails it must have. Open a
        project to answer the questions and track each guardrail.
      </p>

      <h2 className="mt-8 font-display text-xl font-medium">Your projects</h2>
      {!loaded ? (
        <p className="mt-4 text-sm text-faint">Loading your projects…</p>
      ) : projects.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No projects yet.{" "}
          <Link href="/workbench" className="text-orange hover:text-orange-soft">
            Start one in the Project Console
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {projects.map((p) => {
            const c = coverage(p.guardrails);
            return (
              <li key={p.id}>
                <Link
                  href={`/workbench/${p.id}/guardrails`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-surface p-4 ring-1 ring-transparent transition-shadow hover:ring-orange"
                >
                  <span className="min-w-[12rem] flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    {c.tier ? (
                      <>
                        <span className={`rounded-full px-2.5 py-0.5 ${TIER_PILL[c.tier]}`}>{c.tier} tier</span>
                        <span>
                          {c.inPlace} of {c.required} required in place
                        </span>
                      </>
                    ) : (
                      <span>Tier not set: {c.answered} of 5 questions answered</span>
                    )}
                  </span>
                  <IconArrowRight size={16} className="text-faint group-hover:text-orange" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-12">
        <TierRules />
      </div>
    </div>
  );
}
