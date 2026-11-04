import {
  IconBook,
  IconCompass,
  IconGauge,
  IconHeartbeat,
  IconLayoutList,
  IconShieldCheck,
} from "@tabler/icons-react";
import type { IconComponent } from "./types";

export type NavItem = { href: string; label: string; icon: IconComponent };

export const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: IconCompass },
  { href: "/workbench", label: "Workbench", icon: IconLayoutList },
  { href: "/guardrails", label: "Guardrails", icon: IconShieldCheck },
  { href: "/scorecard", label: "Scorecard", icon: IconGauge },
  { href: "/pulse", label: "Pulse", icon: IconHeartbeat },
  { href: "/field-guide", label: "Field Guide", icon: IconBook },
];
