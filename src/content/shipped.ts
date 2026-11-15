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
    date: "2026-11-15",
    kind: "Milestone",
    label: "Milestone 12",
    title: "Tools, changelog and a Fit Check that remembers",
    body: "Every project page has a Tools menu: status, export, backup and restore in one place. Each project keeps a changelog that writes itself. The Fit Check can save its score to a project, where it shows as evidence on the Conceive checkpoint. Press ? for keyboard shortcuts.",
  },
  {
    date: "2026-11-14",
    kind: "Milestone",
    label: "Milestone 11",
    title: "Media blocks",
    body: "Add images, videos and lists of files and links to any section, by web address. Videos from YouTube, Vimeo and Loom load nothing until you press play. The demo's Develop phase has a Prototype page showing an image and links.",
  },
  {
    date: "2026-11-14",
    kind: "Design",
    label: "Design",
    title: "Home, Project Console and phase colors",
    body: "Overview is now Home and the Workbench is now the Project Console. The top menu is down to Home, Console and Pulse; Guardrails, Scorecard and the Field Guide are a click away from Home. Each of the seven phases has its own color, so they are easy to tell apart.",
  },
  {
    date: "2026-11-14",
    kind: "Fix",
    label: "Fix",
    title: "New demo pages reach returning visitors",
    body: "If you had opened the demo before, its newer pages (Governance, and Model and data) were missing until you reset it. They now appear on your next visit, and your own edits stay.",
  },
  {
    date: "2026-11-14",
    kind: "Milestone",
    label: "Milestone 10",
    title: "AI blocks",
    body: "Three blocks for the AI side of a project: a Risk Register that works out each risk's level from likelihood and impact, a Model Card with the same questions for every project, and Data Sources, which records who owns the data, whether it holds personal data and whether access is approved.",
  },
  {
    date: "2026-11-14",
    kind: "Milestone",
    label: "Milestone 9",
    title: "Governance blocks",
    body: "Four new blocks for the record of a project: a Decision Log, an Approval Tracker, a Timeline that sorts itself by date, and a SWOT. The demo's Plan phase has a Governance page showing all four.",
  },
  {
    date: "2026-11-04",
    kind: "Milestone",
    label: "Milestone 8",
    title: "Write in every phase",
    body: "Overview and your own sections now hold blocks: text, callouts, dividers and tables. Move them by dragging or with Alt + arrow keys, undo a delete, and switch between Edit and View. Everything saves as you type and appears in the Markdown and PDF exports.",
  },
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
