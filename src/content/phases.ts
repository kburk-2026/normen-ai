import {
  IconArchive,
  IconBulb,
  IconChecklist,
  IconCloudUpload,
  IconCode,
  IconDatabase,
  IconFlask,
  IconMap2,
  IconRocket,
  IconSparkles,
  IconTruckDelivery,
} from "@tabler/icons-react";
import type { IconComponent } from "./types";

/**
 * The four AI product development stages. Each lifecycle phase draws on one or
 * more of them. Source: course material on AI product development stages.
 */
export type StageId = "ideation" | "data" | "rnd" | "deployment";

export type Stage = {
  id: StageId;
  label: string;
  icon: IconComponent;
  /** Tailwind classes for tags and strips, kept here so colors stay consistent. */
  tag: string;
  strip: string;
};

export const STAGES: Record<StageId, Stage> = {
  ideation: {
    id: "ideation",
    label: "Ideation",
    icon: IconSparkles,
    tag: "bg-orange-bg text-orange-soft",
    strip: "border-orange",
  },
  data: {
    id: "data",
    label: "Data",
    icon: IconDatabase,
    tag: "bg-steel-bg text-steel-soft",
    strip: "border-steel",
  },
  rnd: {
    id: "rnd",
    label: "R&D",
    icon: IconFlask,
    tag: "bg-tan-bg text-tan-soft",
    strip: "border-tan",
  },
  deployment: {
    id: "deployment",
    label: "Deployment",
    icon: IconCloudUpload,
    tag: "bg-line text-ink",
    strip: "border-ink",
  },
};

export type PhaseId =
  | "conceive"
  | "plan"
  | "develop"
  | "qualify"
  | "launch"
  | "deliver"
  | "retire";

export type Phase = {
  id: PhaseId;
  number: number;
  name: string;
  icon: IconComponent;
  /** AI stages this phase draws on. The first one sets the phase's color. */
  stages: StageId[];
  summary: string;
};

/**
 * The seven product management lifecycle phases. Activities, guardrails and
 * checkpoints are added in milestone 2.
 */
export const PHASES: Phase[] = [
  {
    id: "conceive",
    number: 1,
    name: "Conceive",
    icon: IconBulb,
    stages: ["ideation"],
    summary: "Confirm the problem, decide whether AI belongs in the answer, and form the team.",
  },
  {
    id: "plan",
    number: 2,
    name: "Plan",
    icon: IconMap2,
    stages: ["ideation", "data"],
    summary: "Set data, functional and model requirements, then win approval to build.",
  },
  {
    id: "develop",
    number: 3,
    name: "Develop",
    icon: IconCode,
    stages: ["data", "rnd"],
    summary: "Run model experiments, guard the MVP from scope creep, and prototype.",
  },
  {
    id: "qualify",
    number: 4,
    name: "Qualify",
    icon: IconChecklist,
    stages: ["rnd", "deployment"],
    summary: "Prove lab results hold up with real users before launch.",
  },
  {
    id: "launch",
    number: 5,
    name: "Launch",
    icon: IconRocket,
    stages: ["deployment"],
    summary: "Release, often as a soft launch to a small group first.",
  },
  {
    id: "deliver",
    number: 6,
    name: "Deliver",
    icon: IconTruckDelivery,
    stages: ["deployment"],
    summary: "Run it in production, watch for drift, and keep improving.",
  },
  {
    id: "retire",
    number: 7,
    name: "Retire",
    icon: IconArchive,
    stages: ["deployment"],
    summary: "Decommission cleanly, including the data and the model.",
  },
];
