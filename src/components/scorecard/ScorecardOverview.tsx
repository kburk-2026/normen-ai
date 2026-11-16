"use client";

import Link from "next/link";
import { IconArrowRight, IconGauge } from "@tabler/icons-react";
import { STATUS_STYLE } from "@/components/projects/ProjectDialogs";
import { useWorkspace } from "@/state/ProjectProvider";
import { STATUS_ORDER, statusCounts } from "@/state/scorecard";
import { STATUS_PILL } from "./ProjectScorecard";

/** Every project's Scorecard at a glance, each linking to its own. */
export default function ScorecardOverview() {
  const { loaded, projects } = useWorkspace();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconGauge size={26} className="text-orange" aria-hidden /> Scorecard
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each project sets its own measures and targets, logs what it actually got, and calls each reading on target, close or
        off. Open a project to see its Scorecard.
      </p>

      {!loaded ? (
        <p className="mt-8 text-sm text-faint">Loading your projects…</p>
      ) : projects.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No projects yet.{" "}
          <Link href="/workbench" className="text-orange hover:text-orange-soft">
            Start one in the Project Console
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {projects.map((p) => {
            const counts = statusCounts(p.scorecard);
            return (
              <li key={p.id}>
                <Link
                  href={`/workbench/${p.id}/scorecard`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-surface p-4 ring-1 ring-transparent transition-shadow hover:ring-orange"
                >
                  <span className="min-w-[12rem] flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </span>
                  <span className="flex flex-wrap gap-2 text-xs">
                    {STATUS_ORDER.map((s) => (
                      <span key={s} className={`rounded-full px-2.5 py-0.5 ${STATUS_PILL[s]}`}>
                        {counts[s]} {s.toLowerCase()}
                      </span>
                    ))}
                  </span>
                  <IconArrowRight size={16} className="text-faint group-hover:text-orange" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
