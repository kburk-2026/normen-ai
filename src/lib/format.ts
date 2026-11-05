/** "2026-11-04" to "4 Nov 2026", the same on server and client. */
export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today's date as YYYY-MM-DD in the user's own time zone. */
export function today() {
  return localDay(new Date());
}

/** A timestamp's calendar date (YYYY-MM-DD) in the user's own time zone, not UTC. */
export function localDay(at: string | Date) {
  const d = typeof at === "string" ? new Date(at) : at;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
