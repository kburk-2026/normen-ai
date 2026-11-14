"use client";

import { IconCheck, IconLayoutGrid, IconPlus, IconScale, IconTimeline, IconX } from "@tabler/icons-react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import {
  APPROVAL_STATUSES,
  DECISION_STATUSES,
  SWOT_KEYS,
  SWOT_LABEL,
  filledApprovals,
  filledDecisions,
  filledItems,
  filledMilestones,
  newApproval,
  newDecision,
  newMilestone,
  sortMilestones,
  type ApprovalBlock,
  type Block,
  type DecisionBlock,
  type SwotBlock,
  type SwotKey,
  type TimelineBlock,
} from "@/content/blocks";
import { formatDate } from "@/lib/format";

type Props<B extends Block> = { block: B; edit: boolean; onChange: (next: Block) => void };

/** Status colors. Every status also shows its word, so color is never the only signal. */
const PILL: Record<string, string> = {
  Open: "bg-tan-bg text-tan-soft",
  Pending: "bg-tan-bg text-tan-soft",
  Made: "bg-steel-bg text-steel-soft",
  Approved: "bg-steel-bg text-steel-soft",
  "On hold": "bg-canvas text-muted ring-1 ring-line",
  Superseded: "bg-orange-bg text-orange-soft",
  Rejected: "bg-orange-bg text-orange-soft",
};

export const field = "block w-full bg-transparent text-ink placeholder:text-faint focus:outline-none";
const addButton = "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-faint hover:text-ink";

export function Card({
  icon: Icon,
  title,
  note,
  children,
}: {
  icon: typeof IconScale;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={17} className="shrink-0 text-orange" aria-hidden />
        <h2 className="font-display text-base font-medium">{title}</h2>
        {note && <span className="ml-auto font-mono text-xs text-faint">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function Status<T extends string>({
  edit,
  value,
  options,
  label,
  onChange,
}: {
  edit: boolean;
  value: T;
  options: readonly T[];
  label: string;
  onChange: (v: T) => void;
}) {
  const cls = `rounded-full px-2.5 py-0.5 text-xs ${PILL[value]}`;
  return edit ? (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${cls} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange`}
    >
      {options.map((o) => (
        <option key={o} className="bg-canvas text-ink">
          {o}
        </option>
      ))}
    </select>
  ) : (
    <span className={`inline-block whitespace-nowrap ${cls}`}>{value}</span>
  );
}

export function DateField({
  edit,
  value,
  label,
  onChange,
  onBlur,
}: {
  edit: boolean;
  value: string;
  label: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return edit ? (
    <input
      type="date"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="bg-transparent text-xs text-muted [color-scheme:dark] focus:outline-none"
    />
  ) : (
    <>{value ? formatDate(value) : <span className="text-faint">No date</span>}</>
  );
}

export function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="shrink-0 rounded p-0.5 text-faint hover:text-ink">
      <IconX size={14} aria-hidden />
    </button>
  );
}

export function Add({ label, name, onClick }: { label: string; name?: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={name} className={addButton} onClick={onClick}>
      <IconPlus size={12} aria-hidden /> {label}
    </button>
  );
}

/** Replace one row of a list by ID. */
export const patch = <R extends { id: string }>(list: R[], id: string, p: Partial<R>) => list.map((r) => (r.id === id ? { ...r, ...p } : r));

export function DecisionLog({ block: b, edit, onChange }: Props<DecisionBlock>) {
  const rows = edit ? b.rows : filledDecisions(b);
  const th = "px-2 py-2 font-normal";
  return (
    <Card icon={IconScale} title="Decision Log">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-faint">
              <th scope="col" className={th}>Decision</th>
              <th scope="col" className={th}>Date</th>
              <th scope="col" className={th}>Made by</th>
              <th scope="col" className={th}>Why</th>
              <th scope="col" className={th}>Status</th>
              {edit && (
                <th scope="col" className="w-6">
                  <span className="sr-only">Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const set = (p: Partial<typeof r>) => onChange({ ...b, rows: patch(b.rows, r.id, p) });
              const n = i + 1;
              return (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="px-2 py-2 font-medium">
                    {edit ? (
                      <AutoTextarea aria-label={`Decision ${n}`} className={field} value={r.decision} placeholder="What was decided" onChange={(e) => set({ decision: e.target.value })} />
                    ) : (
                      r.decision
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-muted">
                    <DateField edit={edit} label={`Date of decision ${n}`} value={r.date} onChange={(date) => set({ date })} />
                  </td>
                  <td className="px-2 py-2 text-muted">
                    {edit ? (
                      <AutoTextarea aria-label={`Decision ${n} made by`} className={field} value={r.by} placeholder="Who" onChange={(e) => set({ by: e.target.value })} />
                    ) : (
                      r.by
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted">
                    {edit ? (
                      <AutoTextarea aria-label={`Why decision ${n} was made`} className={field} value={r.why} placeholder="The reason" onChange={(e) => set({ why: e.target.value })} />
                    ) : (
                      r.why
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Status edit={edit} label={`Status of decision ${n}`} value={r.status} options={DECISION_STATUSES} onChange={(status) => set({ status })} />
                  </td>
                  {edit && (
                    <td className="py-2">
                      <Remove label={`Remove decision ${n}`} onClick={() => onChange({ ...b, rows: b.rows.filter((x) => x.id !== r.id) })} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {edit && <Add label="Add decision" onClick={() => onChange({ ...b, rows: [...b.rows, newDecision()] })} />}
    </Card>
  );
}

export function ApprovalTracker({ block: b, edit, onChange }: Props<ApprovalBlock>) {
  const rows = edit ? b.rows : filledApprovals(b);
  const counted = filledApprovals(b);
  const note = counted.length ? `${counted.filter((r) => r.status === "Approved").length} of ${counted.length} approved` : undefined;
  return (
    <Card icon={IconCheck} title="Approval Tracker" note={note}>
      <ul>
        {rows.map((r, i) => {
          const set = (p: Partial<typeof r>) => onChange({ ...b, rows: patch(b.rows, r.id, p) });
          const n = i + 1;
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-2.5 text-sm first:border-t-0">
              <div className="min-w-[12rem] flex-1">
                {edit ? (
                  <>
                    <input aria-label={`Approval ${n}: what needs approval`} className={`${field} font-medium`} value={r.item} placeholder="What needs approval" onChange={(e) => set({ item: e.target.value })} />
                    <input aria-label={`Approval ${n}: who approves`} className={`${field} text-xs text-muted`} value={r.who} placeholder="Who approves" onChange={(e) => set({ who: e.target.value })} />
                  </>
                ) : (
                  <>
                    <p className="font-medium">{r.item}</p>
                    {r.who && <p className="text-xs text-muted">{r.who}</p>}
                  </>
                )}
              </div>
              <span className="text-xs text-muted">
                <DateField edit={edit} label={`Date of approval ${n}`} value={r.date} onChange={(date) => set({ date })} />
              </span>
              <Status edit={edit} label={`Status of approval ${n}`} value={r.status} options={APPROVAL_STATUSES} onChange={(status) => set({ status })} />
              {edit && <Remove label={`Remove approval ${n}`} onClick={() => onChange({ ...b, rows: b.rows.filter((x) => x.id !== r.id) })} />}
            </li>
          );
        })}
      </ul>
      {edit && <Add label="Add approval" onClick={() => onChange({ ...b, rows: [...b.rows, newApproval()] })} />}
    </Card>
  );
}

export function Timeline({ block: b, edit, onChange }: Props<TimelineBlock>) {
  const items = edit ? b.items : filledMilestones(b);
  const counted = filledMilestones(b);
  const note = counted.length ? `${counted.filter((m) => m.done).length} of ${counted.length} done` : undefined;
  return (
    <Card icon={IconTimeline} title="Timeline" note={note}>
      <ol className="relative ml-2 border-l border-muted/40">
        {items.map((m, i) => {
          const set = (p: Partial<typeof m>) => onChange({ ...b, items: patch(b.items, m.id, p) });
          const n = i + 1;
          return (
            <li key={m.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-1 py-2 pl-6 text-sm">
              <span
                aria-hidden
                className={`absolute -left-[7.5px] top-3 h-3.5 w-3.5 rounded-full border-2 ${m.done ? "border-steel bg-steel" : "border-muted bg-surface"}`}
              />
              <span className="w-28 shrink-0 font-mono text-xs text-muted">
                {/* Re-sort when the date field loses focus, not on every keystroke, so the row does not jump mid-typing. */}
                <DateField
                  edit={edit}
                  label={`Date of milestone ${n}`}
                  value={m.date}
                  onChange={(date) => set({ date })}
                  onBlur={() => onChange({ ...b, items: sortMilestones(b.items) })}
                />
              </span>
              <span className={`min-w-[10rem] flex-1 ${m.done && !edit ? "text-muted" : ""}`}>
                {edit ? (
                  <input aria-label={`Milestone ${n}`} className={field} value={m.text} placeholder="Milestone" onChange={(e) => set({ text: e.target.value })} />
                ) : (
                  m.text
                )}
              </span>
              {edit ? (
                <label className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={m.done} onChange={(e) => set({ done: e.target.checked })} className="accent-steel" />
                  Done<span className="sr-only">: milestone {n}</span>
                </label>
              ) : (
                <span className={`inline-flex items-center gap-1 text-xs ${m.done ? "text-steel-soft" : "text-faint"}`}>
                  {m.done && <IconCheck size={13} aria-hidden />} {m.done ? "Done" : "To do"}
                </span>
              )}
              {edit && <Remove label={`Remove milestone ${n}`} onClick={() => onChange({ ...b, items: b.items.filter((x) => x.id !== m.id) })} />}
            </li>
          );
        })}
      </ol>
      {edit && <Add label="Add milestone" onClick={() => onChange({ ...b, items: [...b.items, newMilestone()] })} />}
    </Card>
  );
}

const SWOT_TOP: Record<SwotKey, string> = { s: "border-t-steel", w: "border-t-orange", o: "border-t-tan", t: "border-t-muted" };

export function Swot({ block: b, edit, onChange }: Props<SwotBlock>) {
  return (
    <Card icon={IconLayoutGrid} title="SWOT">
      <div className="grid gap-3 sm:grid-cols-2">
        {SWOT_KEYS.map((k) => {
          const { name, axis } = SWOT_LABEL[k];
          const items = edit ? b[k] : filledItems(b[k]);
          return (
            <div key={k} className={`relative overflow-hidden rounded-xl border-t-[3px] bg-canvas p-4 ${SWOT_TOP[k]}`}>
              <span aria-hidden className="pointer-events-none absolute -top-5 right-2 select-none font-display text-8xl font-semibold text-ink/5">
                {name[0]}
              </span>
              <p className="text-[11px] uppercase tracking-widest text-faint">{axis}</p>
              <h3 className="font-display text-lg font-medium">{name}</h3>
              {items.length > 0 ? (
                <ul className="relative mt-2 space-y-1.5 text-sm">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 border-l-2 border-line pl-2.5">
                      {edit ? (
                        <>
                          <AutoTextarea
                            aria-label={`${name}, item ${i + 1}`}
                            className={field}
                            value={item}
                            placeholder="New item"
                            onChange={(e) => onChange({ ...b, [k]: b[k].map((x, j) => (j === i ? e.target.value : x)) })}
                          />
                          <Remove label={`Remove ${name} item ${i + 1}`} onClick={() => onChange({ ...b, [k]: b[k].filter((_, j) => j !== i) })} />
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                !edit && <p className="relative mt-2 text-sm text-faint">Nothing listed.</p>
              )}
              {edit && <Add label="Add item" name={`Add ${name} item`} onClick={() => onChange({ ...b, [k]: [...b[k], ""] })} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
