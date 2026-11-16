"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { PHASES, type PhaseId } from "@/content/phases";
import { formatDate, today } from "@/lib/format";
import { useProject } from "@/state/ProjectProvider";
import { daysBetween, phaseSpans, timelineEvents, type PhaseSpan, type TimelineEvent } from "@/state/timeline";

const phaseName = (id: PhaseId) => PHASES.find((p) => p.id === id)!.name;
const color = (id: PhaseId) => `var(--color-phase-${id})`;

/** First day of the month a date falls in, and of the month after. */
const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
function nextMonth(d: string) {
  const [y, m] = [+d.slice(0, 4), +d.slice(5, 7)];
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/** A project's phases over time, its dated milestones and decisions, and a target date per phase. */
export default function TimelineView() {
  const { project, setPhaseTarget } = useProject();
  const now = today();
  const spans = phaseSpans(project, now);
  const events = timelineEvents(project, now);
  const [active, setActive] = useState<number | null>(null);
  const liveId = useId();

  // The chart runs from the first month anything happens to the month after the last date.
  const dates = [now, ...spans.flatMap((s) => [s.start, s.end, s.target].filter(Boolean) as string[]), ...events.map((e) => e.date)];
  const first = monthStart(dates.reduce((a, b) => (a < b ? a : b)));
  const last = nextMonth(dates.reduce((a, b) => (a > b ? a : b)));
  const months: string[] = [];
  for (let m = first; m <= last; m = nextMonth(m)) months.push(m);
  const span = daysBetween(first, last) || 1;
  const labelEvery = Math.ceil(months.length / 8);

  // A narrower drawing, so its text stays readable beside the sidebar.
  const W = 680, L = 112, R = 12, rowH = 28, top = 30;
  const x = (d: string) => L + ((W - L - R) * daysBetween(first, d)) / span;
  const laneY = top + spans.length * rowH + 14;
  const H = laneY + 34;

  const passedCount = spans.filter((s) => s.state === "passed").length;
  const current = spans.find((s) => s.state === "current");
  const description = `Timeline from ${formatDate(first)} to ${formatDate(last)}. ${passedCount} of 7 phases passed${
    current ? `; ${phaseName(current.phase)} in progress since ${current.start ? formatDate(current.start) : "an unrecorded date"}` : ""
  }. ${events.length} dated milestones and decisions. The tables below list every date.`;

  return (
    <div>
      <figure className="rounded-2xl bg-surface p-4">
        <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium">Phases over time</span>
          <span className="flex flex-wrap gap-4 text-xs text-muted">
            <Key swatch={<span className="block h-2.5 w-5 rounded-sm bg-muted" />}>Done</Key>
            <Key swatch={<span className="block h-2.5 w-5 rounded-sm border border-muted bg-[repeating-linear-gradient(45deg,var(--color-muted)_0_3px,transparent_3px_6px)]" />}>
              In progress
            </Key>
            <Key swatch={<span className="block h-2.5 w-5 rounded-sm border border-dashed border-muted" />}>Target</Key>
            <Key
              swatch={
                <svg width="10" height="10">
                  <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="var(--color-orange)" />
                </svg>
              }
            >
              Passed with an override
            </Key>
          </span>
        </figcaption>
        <div
          className="mt-3 overflow-x-auto rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          tabIndex={0}
          role="region"
          aria-label="Timeline chart. Scrolls sideways on narrow screens."
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[620px]" role="img" aria-label={description}>
            <defs>
              {spans
                .filter((s) => s.state === "current")
                .map((s) => (
                  <pattern key={s.phase} id={`hatch-${s.phase}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill={color(s.phase)} opacity="0.35" />
                    <line x1="0" y1="0" x2="0" y2="6" stroke={color(s.phase)} strokeWidth="3" />
                  </pattern>
                ))}
            </defs>
            {months.map((m, i) => (
              <g key={m}>
                <line x1={x(m)} x2={x(m)} y1={top - 8} y2={H - 6} stroke="var(--color-line)" />
                {i % labelEvery === 0 && i < months.length - 1 && (
                  <text x={x(m) + 4} y={14} fontSize="11" fill="var(--color-faint)">
                    {new Date(`${m}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}
                  </text>
                )}
              </g>
            ))}
            {spans.map((s, i) => (
              <PhaseRow key={s.phase} s={s} y={top + i * rowH} rowH={rowH} x={x} now={now} />
            ))}
            <text x={8} y={laneY + 14} fontSize="12" fill="var(--color-ink)">
              Milestones
            </text>
            {events.map((e, i) => (
              <circle
                key={`${e.date}-${i}`}
                cx={x(e.date)}
                cy={laneY + 10}
                r={active === i ? 7 : 5}
                fill={e.overdue ? "var(--color-orange)" : e.done === false ? "var(--color-surface)" : "var(--color-steel-soft)"}
                stroke={e.overdue ? "var(--color-orange)" : "var(--color-steel-soft)"}
                strokeWidth="2"
              />
            ))}
            {/* Hover targets wider than the dots. */}
            {events.map((e, i) => (
              <rect
                key={`hit-${e.date}-${i}`}
                x={x(e.date) - 9}
                y={laneY - 2}
                width={18}
                height={24}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
            <line x1={x(now)} x2={x(now)} y1={top - 12} y2={H - 4} stroke="var(--color-orange-soft)" strokeWidth="1.5" />
            <text x={x(now) + 4} y={top - 14} fontSize="11" fill="var(--color-orange-soft)">
              Today
            </text>
          </svg>
        </div>
        <p id={liveId} className="mt-2 min-h-[1rem] text-xs text-muted" aria-live="polite">
          {active !== null && events[active] && eventLine(events[active])}
        </p>
      </figure>

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <section aria-labelledby="tl-phases" className="rounded-2xl bg-surface p-4">
          <h2 id="tl-phases" className="text-sm font-medium">
            Phases
          </h2>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[440px] text-sm">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th scope="col" className="py-1.5 font-normal">Phase</th>
                  <th scope="col" className="py-1.5 font-normal">Started</th>
                  <th scope="col" className="py-1.5 font-normal">Passed, or target</th>
                  <th scope="col" className="py-1.5 text-right font-normal">Days</th>
                </tr>
              </thead>
              <tbody>
                {spans.map((s) => (
                  <tr key={s.phase} className="border-t border-line align-top">
                    <td className="py-1.5">{phaseName(s.phase)}</td>
                    <td className="whitespace-nowrap py-1.5 pr-2 font-mono text-xs text-muted">{s.start ? formatDate(s.start) : "-"}</td>
                    <td className="py-1.5 text-xs">
                      {s.state === "passed" ? (
                        <>
                          {s.end ? `Passed ${formatDate(s.end)}` : "Passed (date not recorded)"}
                          {s.override && <span className="ml-1 text-orange-soft">(override)</span>}
                        </>
                      ) : (
                        <label className="inline-flex items-center gap-1.5">
                          <span className="text-faint">Target</span>
                          <input
                            type="date"
                            value={s.target ?? ""}
                            aria-label={`Target date for ${phaseName(s.phase)}`}
                            onChange={(e) => setPhaseTarget(s.phase, e.target.value)}
                            className="w-[8.5rem] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[11px] text-ink [color-scheme:dark] focus:border-orange focus:outline-none"
                          />
                        </label>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-1.5 pl-2 text-right font-mono text-xs text-muted">
                      {s.start && s.end ? `${daysBetween(s.start, s.end)}${s.state === "current" ? " so far" : ""}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {spans.some((s) => s.undated) && (
            <p className="mt-2 text-xs text-faint">Some phases were passed before Normen recorded pass dates, so they have no bar.</p>
          )}
        </section>

        <section aria-labelledby="tl-events" className="rounded-2xl bg-surface p-4">
          <h2 id="tl-events" className="text-sm font-medium">
            Milestones and decisions
          </h2>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-faint">
              None yet. Dated items from Timeline, Decision Log and Approval Tracker blocks appear here.
            </p>
          ) : (
            <ol className="mt-2 text-sm">
              {[...events].reverse().map((e, i) => (
                <li key={`${e.date}-${i}`} className="flex flex-wrap gap-x-3 border-t border-line py-1.5 first:border-t-0">
                  <span className="w-24 shrink-0 font-mono text-xs text-muted">{formatDate(e.date)}</span>
                  <span className="min-w-[12rem] flex-1">{e.text}</span>
                  <Link
                    href={`/workbench/${project.id}/${e.phase}/${e.sectionId}`}
                    className={`text-xs hover:text-orange ${e.overdue ? "text-orange-soft" : "text-faint"}`}
                  >
                    {e.overdue ? "Overdue · " : ""}
                    {e.from}
                    <span className="sr-only">, in {phaseName(e.phase)}, {e.sectionTitle}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function eventLine(e: TimelineEvent) {
  return `${formatDate(e.date)} · ${e.text} · from the ${e.from} in ${phaseName(e.phase)}, ${e.sectionTitle}${e.overdue ? " · overdue" : ""}`;
}

function Key({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden>{swatch}</span>
      {children}
    </span>
  );
}

/** One phase's bar: done (solid), in progress (hatched to today), and its target (dashed outline and a tick). */
function PhaseRow({ s, y, rowH, x, now }: { s: PhaseSpan; y: number; rowH: number; x: (d: string) => number; now: string }) {
  const c = color(s.phase);
  const h = rowH - 12;
  const ph = PHASES.find((p) => p.id === s.phase)!;
  return (
    <g>
      <text x={8} y={y + 18} fontSize="12" fill={s.state === "locked" ? "var(--color-faint)" : "var(--color-ink)"}>
        0{ph.number} {ph.name}
      </text>
      {s.start && s.end && (
        <rect
          x={x(s.start)}
          y={y + 6}
          width={Math.max(4, x(s.end) - x(s.start))}
          height={h}
          rx={4}
          fill={s.state === "current" ? `url(#hatch-${s.phase})` : c}
        />
      )}
      {s.target && s.plannedFrom && s.target > s.plannedFrom && (
        <rect x={x(s.plannedFrom)} y={y + 6} width={x(s.target) - x(s.plannedFrom)} height={h} rx={4} fill="none" stroke={c} strokeDasharray="4 3" />
      )}
      {s.target && <line x1={x(s.target)} x2={x(s.target)} y1={y + 3} y2={y + rowH - 3} stroke={c} strokeWidth="2" />}
      {s.override && s.end && (
        <path d={`M${x(s.end)} ${y + 8} l6 7 l-6 7 l-6 -7 Z`} fill="var(--color-orange)" stroke="var(--color-surface)" strokeWidth="1.5" />
      )}
      {s.undated && (
        <text x={L_TEXT} y={y + 18} fontSize="11" fill="var(--color-faint)">
          Passed, date not recorded
        </text>
      )}
      {s.state !== "passed" && !s.target && (
        <text x={x(now) + 8} y={y + 18} fontSize="11" fill="var(--color-faint)">
          No target set
        </text>
      )}
    </g>
  );
}

const L_TEXT = 128;
