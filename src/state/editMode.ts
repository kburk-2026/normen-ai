"use client";

import { useCallback, useEffect, useState } from "react";

export type Mode = "edit" | "view";
const KEY = "normen:mode";

function read(): Mode {
  try {
    return localStorage.getItem(KEY) === "view" ? "view" : "edit";
  } catch {
    return "edit";
  }
}

/** Edit or View, remembered in this browser and kept in step across tabs. */
export function useEditMode(): [Mode, (m: Mode) => void] {
  // Section pages render only in the browser (after projects load), so reading storage here is safe.
  const [mode, setMode] = useState<Mode>(() => (typeof window === "undefined" ? "edit" : read()));
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMode(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const set = useCallback((m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      // Blocked storage: the choice lasts for this page only.
    }
  }, []);
  return [mode, set];
}
