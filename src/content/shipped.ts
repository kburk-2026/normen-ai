/**
 * The Shipped log: what changed in Normen AI, newest first. Written by hand
 * in plain language at each release; add a new entry at the top.
 */
export type ShippedEntry = {
  /** ISO date. */
  date: string;
  kind: "Milestone" | "Fix" | "Design";
  label: string;
  title: string;
  body: string;
};

export const SHIPPED: ShippedEntry[] = [
  {
    date: "2026-11-04",
    kind: "Design",
    label: "Design",
    title: "Norm in your browser tab",
    body: "The browser tab and home screen icon is now Norm, waving.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 7",
    title: "Projects",
    body: "The Workbench holds many projects now, each with its phases as tabs and your own sections inside each phase. Back up and restore everything as one file.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 6",
    title: "Accessibility pass",
    body: "Every page now meets WCAG AA contrast, has headings and labels in order for screen readers, and respects reduced motion.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 5",
    title: "Field Guide, Shipped and export",
    body: "The full method with every item labeled by source, this log, and project export to Markdown or PDF.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 4",
    title: "Fit Check",
    body: "Ten weighted questions tell you whether a problem needs AI. A serious-harm answer caps the result.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 3",
    title: "Board view and checkpoints",
    body: "Pass a phase's checkpoint to unlock the next, or override with a logged reason.",
  },
  {
    date: "2026-11-04",
    kind: "Fix",
    label: "Fix",
    title: "Fonts ship with the app",
    body: "Builds no longer depend on Google Fonts.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 2",
    title: "Workbench",
    body: "Every phase's activities, guardrails and checkpoint, with progress saved in your browser.",
  },
  {
    date: "2026-11-04",
    kind: "Design",
    label: "Design",
    title: "Norm joins the header",
    body: "The mascot peeks over the header next to the wordmark.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 1",
    title: "First release",
    body: "Theme, navigation and the Overview page, live on Vercel.",
  },
];
