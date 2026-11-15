/**
 * Rules for the web addresses in media blocks. Only https addresses are ever
 * loaded or linked; everything else is treated as not set.
 */

/** A full https address, or false. */
export function isWebUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** The site an address points to, without "www.", or "". */
export function hostOf(raw: string): string {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export type VideoSource =
  /** A player page from a known video site, shown in a frame. */
  | { kind: "embed"; provider: "YouTube" | "Vimeo" | "Loom"; src: string; host: string }
  /** A video file the browser plays itself. */
  | { kind: "file"; provider: "Video file"; src: string; host: string };

const ID = /^[\w-]{3,40}$/;

/**
 * What to play for a video address, or null if it is not one we support.
 * The player address is rebuilt from the video's ID, never passed through.
 */
export function videoSource(raw: string): VideoSource | null {
  if (!isWebUrl(raw)) return null;
  const u = new URL(raw.trim());
  const host = u.hostname.replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean);
  const embed = (provider: "YouTube" | "Vimeo" | "Loom", id: string | null | undefined, src: (id: string) => string): VideoSource | null =>
    id && ID.test(id) ? { kind: "embed", provider, src: src(id), host } : null;

  if (host === "youtu.be") return embed("YouTube", parts[0], (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`);
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parts[0] === "watch" ? u.searchParams.get("v") : ["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null;
    return embed("YouTube", id, (x) => `https://www.youtube-nocookie.com/embed/${x}?autoplay=1`);
  }
  if (host === "vimeo.com") return embed("Vimeo", parts.find((p) => /^\d+$/.test(p)), (id) => `https://player.vimeo.com/video/${id}?autoplay=1`);
  if (host === "loom.com") return embed("Loom", parts[0] === "share" || parts[0] === "embed" ? parts[1] : null, (id) => `https://www.loom.com/embed/${id}?autoplay=1`);
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: "file", provider: "Video file", src: u.href, host };
  return null;
}

export type LinkKind = "document" | "sheet" | "slides" | "link";

/** A rough guess at what a link points to, for its icon only. */
export function linkKind(raw: string): LinkKind {
  const u = raw.toLowerCase();
  if (/docs\.google\.com\/spreadsheets|\.(xlsx?|csv)(\?|#|$)/.test(u)) return "sheet";
  if (/docs\.google\.com\/presentation|\.(pptx?|key)(\?|#|$)/.test(u)) return "slides";
  if (/docs\.google\.com\/document|\.(pdf|docx?|md|txt)(\?|#|$)/.test(u)) return "document";
  return "link";
}
