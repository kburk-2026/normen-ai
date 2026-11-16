"use client";

import { useId, useState } from "react";
import { formatDate } from "@/lib/format";

export type Point = { week: string; value: number; over: boolean };

const shortDate = (d: string) => formatDate(d).replace(/ \d{4}$/, "");

/**
 * One measure over the weeks, as bars or a line, with an optional dashed alert
 * line. Single series, so the title names it and there is no legend. Hover, or
 * focus and arrow keys, shows a week's value; the whole chart is described in words.
 */
export default function TrendChart({
  title,
  unit,
  points,
  alert,
  alertLabel,
  kind,
}: {
  title: string;
  unit: string;
  points: Point[];
  alert: number | null;
  alertLabel: string;
  kind: "line" | "bar";
}) {
  const [active, setActive] = useState<number | null>(null);
  const liveId = useId();

  if (points.length < 2)
    return (
      <figure className="rounded-2xl bg-surface p-4">
        <figcaption className="text-sm font-medium">{title}</figcaption>
        <p className="mt-6 pb-6 text-center text-xs text-faint">
          {points.length === 1 ? `One week logged: ${fmt(points[0].value)}${unit}. ` : ""}A trend appears once two weeks have this number.
        </p>
      </figure>
    );

  const W = 320, H = 150, L = 38, R = 8, T = 12, B = 22;
  const values = points.map((p) => p.value);
  const all = alert !== null ? [...values, alert] : values;
  const lo = kind === "bar" ? 0 : Math.floor(Math.min(...all) - 1);
  const hi = kind === "bar" ? Math.ceil(Math.max(...all) * 1.1) || 1 : Math.ceil(Math.max(...all) + 1);
  const step = (W - L - R) / points.length;
  const x = (i: number) => L + step * (i + 0.5);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const ticks = [...new Set([lo, (lo + hi) / 2, hi].map((t) => Math.round(t * 10) / 10))];
  const bw = Math.min(26, step * 0.6);
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));
  const description = `${title}, ${points.length} weeks from ${formatDate(points[0].week)}: ${points
    .map((p) => `${fmt(p.value)}${unit}${p.over ? " (past the alert line)" : ""}`)
    .join(", ")}.${alert !== null ? ` Alert line at ${fmt(alert)}${unit}.` : ""}`;

  const move = (to: number) => setActive(Math.max(0, Math.min(points.length - 1, to)));

  return (
    <figure className="rounded-2xl bg-surface p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="font-mono text-xs text-muted">
          latest {fmt(values.at(-1)!)}
          {unit}
        </span>
      </figcaption>
      <div
        className="relative mt-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        tabIndex={0}
        role="group"
        aria-label={`${title} chart. Use the left and right arrow keys to read each week.`}
        aria-describedby={liveId}
        onFocus={() => setActive((a) => a ?? points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            move((active ?? points.length - 1) + (e.key === "ArrowRight" ? 1 : -1));
          }
          if (e.key === "Home") move(0);
          if (e.key === "End") move(points.length - 1);
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={description}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={L - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-faint)">
                {fmt(t)}
              </text>
            </g>
          ))}
          {kind === "bar"
            ? points.map((p, i) => {
                const top = y(p.value);
                const r = Math.min(3, Math.max(0, y(lo) - top));
                return (
                  <path
                    key={p.week}
                    d={`M${x(i) - bw / 2},${y(lo)} V${top + r} q0,-${r} ${r},-${r} H${x(i) + bw / 2 - r} q${r},0 ${r},${r} V${y(lo)} Z`}
                    fill={active === i ? "var(--color-steel-soft)" : "var(--color-steel)"}
                  />
                );
              })
            : (
              <>
                <polyline
                  points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
                  fill="none"
                  stroke="var(--color-steel-soft)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {points.map((p, i) => (
                  <circle
                    key={p.week}
                    cx={x(i)}
                    cy={y(p.value)}
                    r={active === i ? 5 : 4}
                    fill={p.over ? "var(--color-orange)" : "var(--color-steel-soft)"}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                  />
                ))}
              </>
            )}
          {alert !== null && (
            <g>
              <line x1={L} x2={W - R} y1={y(alert)} y2={y(alert)} stroke="var(--color-orange-soft)" strokeWidth="1.5" strokeDasharray="4 3" />
              <text
                x={L + 4}
                y={y(alert) - 4}
                fontSize="10"
                fill="var(--color-orange-soft)"
                stroke="var(--color-surface)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {alertLabel}
              </text>
            </g>
          )}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text key={p.week} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-faint)">
                {shortDate(p.week)}
              </text>
            ) : null,
          )}
          {/* Hover targets: the full width of each week, taller than the marks. */}
          {points.map((p, i) => (
            <rect
              key={p.week}
              x={x(i) - step / 2}
              y={T}
              width={step}
              height={H - T - B}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute -top-2 whitespace-nowrap rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: `${Math.min(85, Math.max(15, (x(active) / W) * 100))}%`, transform: "translate(-50%, -100%)" }}
          >
            <p className="text-faint">Week of {formatDate(points[active].week)}</p>
            <p className="font-mono text-ink">
              {fmt(points[active].value)}
              {unit}
              {points[active].over && <span className="ml-1.5 font-sans text-orange-soft">past the alert line</span>}
            </p>
          </div>
        )}
        <p id={liveId} className="sr-only" aria-live="polite">
          {active !== null
            ? `Week of ${formatDate(points[active].week)}: ${fmt(points[active].value)}${unit}${points[active].over ? ", past the alert line" : ""}.`
            : ""}
        </p>
      </div>
    </figure>
  );
}

function fmt(n: number) {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
