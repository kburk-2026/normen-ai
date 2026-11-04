"use client";

import { IconCircle, IconCircleCheckFilled, IconCircleHalf2 } from "@tabler/icons-react";
import type { Activity } from "@/content/lifecycle";
import type { ActivityStatus } from "@/content/demo";
import { useProject } from "@/state/ProjectProvider";

export const STATUS: Record<ActivityStatus, { label: string; icon: typeof IconCircle; tone: string }> = {
  todo: { label: "To do", icon: IconCircle, tone: "text-faint" },
  doing: { label: "In progress", icon: IconCircleHalf2, tone: "text-steel-soft" },
  done: { label: "Done", icon: IconCircleCheckFilled, tone: "text-orange" },
};

const NEXT: Record<ActivityStatus, ActivityStatus> = { todo: "doing", doing: "done", done: "todo" };

/** Cycles an activity To do, In progress, Done. Read-only while its phase is locked. */
export default function StatusButton({ activity: a, locked, size = 20 }: { activity: Activity; locked: boolean; size?: number }) {
  const { statusOf, setStatus } = useProject();
  const current = statusOf(a.id);
  const st = STATUS[current];
  const next = STATUS[NEXT[current]];
  const Icon = st.icon;

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => setStatus(a.id, NEXT[current])}
      aria-label={`${a.id} ${a.title}: ${st.label}. ${locked ? "Locked until the previous checkpoint is passed." : `Mark as ${next.label}.`}`}
      title={locked ? "Locked until the previous checkpoint is passed" : `${st.label}. Click to mark ${next.label.toLowerCase()}.`}
      className={`-m-1 shrink-0 rounded-full p-1 transition-colors enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60 ${st.tone}`}
    >
      <Icon size={size} aria-hidden />
    </button>
  );
}
