import {
  IconHeartbeat,
  IconHome,
  IconLayoutList,
} from "@tabler/icons-react";
import type { IconComponent } from "./types";

export type NavItem = { href: string; label: string; icon: IconComponent };

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/workbench", label: "Console", icon: IconLayoutList },
  { href: "/pulse", label: "Pulse", icon: IconHeartbeat },
];
