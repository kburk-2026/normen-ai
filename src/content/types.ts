import type { ComponentType } from "react";

/** The subset of Tabler icon props this app uses. */
export type IconComponent = ComponentType<{
  size?: number;
  stroke?: number;
  className?: string;
  "aria-hidden"?: boolean;
}>;
