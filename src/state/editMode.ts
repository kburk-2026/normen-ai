"use client";

import { useSyncExternalStore } from "react";

/**
 * A small preference kept in this browser. Every component using it re-renders
 * when it changes, whether the change came from this tab or another one.
 */
function createPref<T extends string>(key: string, values: readonly T[], fallback: T) {
  const listeners = new Set<() => void>();
  const read = (): T => {
    try {
      const v = localStorage.getItem(key) as T | null;
      return v && values.includes(v) ? v : fallback;
    } catch {
      return fallback; // Blocked storage.
    }
  };
  const subscribe = (fn: () => void) => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) fn();
    };
    listeners.add(fn);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  };
  const set = (v: T) => {
    try {
      localStorage.setItem(key, v);
    } catch {
      // Blocked storage: nothing to remember the choice in.
    }
    listeners.forEach((fn) => fn());
  };
  return { read, set, use: () => useSyncExternalStore(subscribe, read, () => fallback) };
}

export type Mode = "edit" | "view";
export const modePref = createPref<Mode>("normen:mode", ["edit", "view"], "edit");
/** Whether single-key shortcuts (?, E, [ and ]) are on. They can be turned off for accessibility. */
export const keysPref = createPref<"on" | "off">("normen:keys", ["on", "off"], "on");

/** Edit or View, remembered in this browser. */
export function useEditMode(): [Mode, (m: Mode) => void] {
  return [modePref.use(), modePref.set];
}
