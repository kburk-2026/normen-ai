"use client";

import Link from "next/link";
import { IconArrowRight, IconHeartbeat } from "@tabler/icons-react";
import { STATUS_STYLE } from "@/components/projects/ProjectDialogs";
import { formatDate } from "@/lib/format";
import { useWorkspace } from "@/state/ProjectProvider";
import { pulseSummary } from "@/state/pulse";

/** Every project's Pulse at a glance, each linking to its own. */
export default function PulseOverview() {
  const { loaded, projects } = useWorkspace();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconHeartbeat size={26} className="text-orange" aria-hidden /> Pulse
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        How each project is doing once people use it: weekly check-ins against your own alert lines, and an incident log. Open a
        project to log a week or report an incident.
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
            const s = pulseSummary(p.pulse);
            return (
              <li key={p.id}>
                <Link
                  href={`/workbench/${p.id}/pulse`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-surface p-4 ring-1 ring-transparent transition-shadow hover:ring-orange"
                >
                  <span className="min-w-[12rem] flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </span>
                  <span className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                    <span>{s.lastWeek ? `Last check-in ${formatDate(s.lastWeek)}` : "No check-ins yet"}</span>
                    <span>{s.weeks} {s.weeks === 1 ? "week" : "weeks"} logged</span>
                    <span className={s.pastAlert ? "text-orange-soft" : ""}>{s.pastAlert} past an alert line</span>
                    <span className={s.openIncidents ? "text-orange-soft" : ""}>
                      {s.openIncidents} open {s.openIncidents === 1 ? "incident" : "incidents"}
                    </span>
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
