"use client";

import { IconDatabase, IconFileDescription, IconShieldCheck } from "@tabler/icons-react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import { Add, Card, Remove, field, patch } from "./GovernanceBlocks";
import {
  ACCESS_STATUSES,
  MODEL_FIELDS,
  PERSONAL_DATA,
  RISK_CATEGORIES,
  RISK_LEVELS,
  RISK_STATUSES,
  filledMetrics,
  filledRisks,
  filledSources,
  newMetric,
  newRisk,
  newSource,
  riskCounts,
  riskLevel,
  type Block,
  type ModelCardBlock,
  type RiskBlock,
  type SourcesBlock,
} from "@/content/blocks";
import { formatDate } from "@/lib/format";

type Props<B extends Block> = { block: B; edit: boolean; onChange: (next: Block) => void };

/** Pill colors: orange needs attention, tan is in between, steel is settled. The word is always shown too. */
const TONE: Record<string, string> = {
  High: "bg-orange-bg text-orange-soft",
  Medium: "bg-tan-bg text-tan-soft",
  Low: "bg-steel-bg text-steel-soft",
  Yes: "bg-orange-bg text-orange-soft",
  "Not sure": "bg-tan-bg text-tan-soft",
  No: "bg-steel-bg text-steel-soft",
  Approved: "bg-steel-bg text-steel-soft",
  Requested: "bg-tan-bg text-tan-soft",
  "Not requested": "bg-canvas text-muted ring-1 ring-line",
  Open: "bg-tan-bg text-tan-soft",
  Mitigating: "bg-tan-bg text-tan-soft",
  Accepted: "bg-canvas text-muted ring-1 ring-line",
  Closed: "bg-steel-bg text-steel-soft",
};

/** A labeled choice: a select in Edit, a pill (or plain text) in View. */
function Choice<T extends string>({
  edit,
  label,
  name,
  value,
  options,
  onChange,
  plain,
}: {
  edit: boolean;
  label: string;
  /** Accessible name, e.g. "Likelihood of risk 2". */
  name: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  plain?: boolean;
}) {
  const look = plain ? "text-ink" : `rounded-full px-2.5 py-0.5 ${TONE[value]}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-faint">{label}</span>
      {edit ? (
        <select
          aria-label={name}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`cursor-pointer bg-transparent ${look} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange`}
        >
          {options.map((o) => (
            <option key={o} className="bg-canvas text-ink">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <span className={`whitespace-nowrap ${look}`}>{value}</span>
      )}
    </span>
  );
}

/** A short labeled text value on a row's detail line. */
function Small({
  edit,
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  edit: boolean;
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  if (!edit && !value.trim()) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-faint">{label}</span>
      {edit ? (
        <input
          aria-label={name}
          className="w-28 bg-transparent text-ink placeholder:text-faint focus:outline-none"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="text-ink">{value}</span>
      )}
    </span>
  );
}

export function RiskRegister({ block: b, edit, onChange }: Props<RiskBlock>) {
  const rows = edit ? b.rows : filledRisks(b);
  const { high, open } = riskCounts(b);
  return (
    <Card icon={IconShieldCheck} title="Risk Register" note={filledRisks(b).length ? `${high} high, ${open} open` : undefined}>
      <ul>
        {rows.map((r, i) => {
          const set = (p: Partial<typeof r>) => onChange({ ...b, rows: patch(b.rows, r.id, p) });
          const n = i + 1;
          const lv = riskLevel(r);
          return (
            <li key={r.id} className="border-t border-line py-3 text-sm first:border-t-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 font-medium">
                  {edit ? (
                    <AutoTextarea aria-label={`Risk ${n}`} className={field} value={r.risk} placeholder="What could go wrong" onChange={(e) => set({ risk: e.target.value })} />
                  ) : (
                    r.risk
                  )}
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${TONE[lv]}`}>{lv} risk</span>
                {edit && <Remove label={`Remove risk ${n}`} onClick={() => onChange({ ...b, rows: b.rows.filter((x) => x.id !== r.id) })} />}
              </div>
              {(edit || r.plan.trim()) && (
                <div className="mt-1 flex gap-2 text-muted">
                  <span className="shrink-0 pt-0.5 text-xs uppercase tracking-wide text-faint">Plan</span>
                  <div className="min-w-0 flex-1">
                    {edit ? (
                      <AutoTextarea
                        aria-label={`Plan for risk ${n}`}
                        className={`${field} text-muted`}
                        value={r.plan}
                        placeholder="How you will reduce or handle it"
                        onChange={(e) => set({ plan: e.target.value })}
                      />
                    ) : (
                      r.plan
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                <Choice edit={edit} plain label="Type" name={`Type of risk ${n}`} value={r.category} options={RISK_CATEGORIES} onChange={(category) => set({ category })} />
                <Choice edit={edit} plain label="Likelihood" name={`Likelihood of risk ${n}`} value={r.likelihood} options={RISK_LEVELS} onChange={(likelihood) => set({ likelihood })} />
                <Choice edit={edit} plain label="Impact" name={`Impact of risk ${n}`} value={r.impact} options={RISK_LEVELS} onChange={(impact) => set({ impact })} />
                <Small edit={edit} label="Owner" name={`Owner of risk ${n}`} value={r.owner} placeholder="Who" onChange={(owner) => set({ owner })} />
                <span className="ml-auto">
                  <Choice edit={edit} label="Status" name={`Status of risk ${n}`} value={r.status} options={RISK_STATUSES} onChange={(status) => set({ status })} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {edit && <Add label="Add risk" onClick={() => onChange({ ...b, rows: [...b.rows, newRisk()] })} />}
    </Card>
  );
}

export function ModelCard({ block: b, edit, onChange }: Props<ModelCardBlock>) {
  const metrics = edit ? b.metrics : filledMetrics(b);
  const fields = edit ? MODEL_FIELDS : MODEL_FIELDS.filter((f) => b.fields[f.key].trim());
  return (
    <Card icon={IconFileDescription} title="Model Card" note={b.reviewed ? `Reviewed ${formatDate(b.reviewed)}` : undefined}>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
            <dt className="text-xs uppercase tracking-wide text-faint">{f.label}</dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {edit ? (
                <AutoTextarea
                  aria-label={f.label}
                  className={field}
                  value={b.fields[f.key]}
                  placeholder="Not written yet"
                  onChange={(e) => onChange({ ...b, fields: { ...b.fields, [f.key]: e.target.value } })}
                />
              ) : (
                b.fields[f.key]
              )}
            </dd>
          </div>
        ))}
      </dl>
      {metrics.length > 0 && (
        <>
          <h3 className="mt-4 text-xs font-normal uppercase tracking-wide text-faint">Evaluation</h3>
          <div className="overflow-x-auto">
            <table className="mt-1 w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th scope="col" className="py-1 pr-2 font-normal">Measure</th>
                  <th scope="col" className="px-2 py-1 font-normal">Result</th>
                  <th scope="col" className="px-2 py-1 font-normal">Target</th>
                  {edit && (
                    <th scope="col" className="w-6">
                      <span className="sr-only">Remove</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => {
                  const set = (p: Partial<typeof m>) => onChange({ ...b, metrics: patch(b.metrics, m.id, p) });
                  const n = i + 1;
                  return (
                    <tr key={m.id} className="border-t border-line align-top">
                      <td className="py-1.5 pr-2">
                        {edit ? <input aria-label={`Measure ${n}`} className={field} value={m.name} placeholder="Measure" onChange={(e) => set({ name: e.target.value })} /> : m.name}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-xs">
                        {edit ? <input aria-label={`Result for measure ${n}`} className={field} value={m.result} placeholder="Result" onChange={(e) => set({ result: e.target.value })} /> : m.result}
                      </td>
                      <td className="px-2 py-1.5 text-muted">
                        {edit ? <input aria-label={`Target for measure ${n}`} className={field} value={m.target} placeholder="Target" onChange={(e) => set({ target: e.target.value })} /> : m.target}
                      </td>
                      {edit && (
                        <td className="py-1.5">
                          <Remove label={`Remove measure ${n}`} onClick={() => onChange({ ...b, metrics: b.metrics.filter((x) => x.id !== m.id) })} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {edit && (
        <div className="flex flex-wrap items-center gap-x-4">
          <Add label="Add measure" onClick={() => onChange({ ...b, metrics: [...b.metrics, newMetric()] })} />
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-faint">
            Last reviewed
            <input
              type="date"
              value={b.reviewed}
              onChange={(e) => onChange({ ...b, reviewed: e.target.value })}
              className="bg-transparent text-muted [color-scheme:dark] focus:outline-none"
            />
          </label>
        </div>
      )}
    </Card>
  );
}

export function DataSources({ block: b, edit, onChange }: Props<SourcesBlock>) {
  const rows = edit ? b.rows : filledSources(b);
  const counted = filledSources(b);
  const note = counted.length ? `${counted.filter((r) => r.personal === "Yes").length} with personal data` : undefined;
  return (
    <Card icon={IconDatabase} title="Data Sources" note={note}>
      <ul>
        {rows.map((r, i) => {
          const set = (p: Partial<typeof r>) => onChange({ ...b, rows: patch(b.rows, r.id, p) });
          const n = i + 1;
          return (
            <li key={r.id} className="border-t border-line py-3 text-sm first:border-t-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {edit ? (
                    <>
                      <input aria-label={`Source ${n} name`} className={`${field} font-medium`} value={r.name} placeholder="Name of the data" onChange={(e) => set({ name: e.target.value })} />
                      <AutoTextarea aria-label={`What source ${n} holds`} className={`${field} text-muted`} value={r.what} placeholder="What it holds" onChange={(e) => set({ what: e.target.value })} />
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{r.name}</p>
                      {r.what.trim() && <p className="whitespace-pre-line text-muted">{r.what}</p>}
                    </>
                  )}
                </div>
                {edit && <Remove label={`Remove source ${n}`} onClick={() => onChange({ ...b, rows: b.rows.filter((x) => x.id !== r.id) })} />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                <Small edit={edit} label="Owner" name={`Owner of source ${n}`} value={r.owner} placeholder="Who" onChange={(owner) => set({ owner })} />
                <Small edit={edit} label="Updated" name={`How often source ${n} updates`} value={r.refresh} placeholder="How often" onChange={(refresh) => set({ refresh })} />
                <Choice edit={edit} label="Personal data" name={`Personal data in source ${n}`} value={r.personal} options={PERSONAL_DATA} onChange={(personal) => set({ personal })} />
                <span className="ml-auto">
                  <Choice edit={edit} label="Access" name={`Access to source ${n}`} value={r.access} options={ACCESS_STATUSES} onChange={(access) => set({ access })} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {edit && <Add label="Add source" onClick={() => onChange({ ...b, rows: [...b.rows, newSource()] })} />}
    </Card>
  );
}
