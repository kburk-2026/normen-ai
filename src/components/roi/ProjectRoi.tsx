"use client";

import { IconChevronRight, IconCoin } from "@tabler/icons-react";
import { ToolsMenu } from "@/components/projects/ProjectTools";
import { useProject } from "@/state/ProjectProvider";
import { RoiChart, RoiInputsForm, RoiResults } from "./RoiCalculator";

/** A project's main ROI model. */
export default function ProjectRoi() {
  const { project, setRoi } = useProject();
  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {project.name} <IconChevronRight size={14} aria-hidden /> <span className="text-ink">ROI</span>
        </p>
        <ToolsMenu />
      </div>
      <h1 className="mt-3 flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
        <IconCoin size={26} className="text-orange" aria-hidden /> Return on investment
      </h1>
      <div className="mt-2 h-[3px] w-14 rounded bg-orange" aria-hidden />
      <p className="mt-3 max-w-2xl text-sm text-muted">
        What the system saves against what it costs. Every number is yours; Normen only does the arithmetic and shows its
        working.
        {project.isDemo && " The demo's numbers are example figures."}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-5">
          <RoiInputsForm model={project.roi} onChange={setRoi} />
        </section>
        <section className="self-start rounded-2xl bg-surface p-5" aria-live="polite">
          <RoiResults model={project.roi} />
        </section>
      </div>
      <div className="mt-6">
        <RoiChart model={project.roi} />
      </div>
    </article>
  );
}
