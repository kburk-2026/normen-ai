import { IconSchool, IconSparkles } from "@tabler/icons-react";
import type { Source } from "@/content/lifecycle";

/** Marks an item as course material or as Claude's addition. */
export default function SourceTag({ source }: { source: Source }) {
  return source === "course" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-steel-bg px-2 py-0.5 text-[11px] font-normal text-steel-soft">
      <IconSchool size={12} aria-hidden /> Course
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-bg px-2 py-0.5 text-[11px] font-normal text-orange-soft">
      <IconSparkles size={12} aria-hidden /> Claude&apos;s addition
    </span>
  );
}
