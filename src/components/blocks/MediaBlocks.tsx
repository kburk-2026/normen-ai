"use client";

import { useEffect, useState } from "react";
import {
  IconExternalLink,
  IconFileText,
  IconLink,
  IconPhoto,
  IconPlayerPlayFilled,
  IconPresentation,
  IconTable,
  IconVideo,
} from "@tabler/icons-react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import { Add, Card, Remove, field, patch } from "./GovernanceBlocks";
import { filledLinks, newLink, type Block, type ImageBlock, type LinksBlock, type VideoBlock } from "@/content/blocks";
import { hostOf, isWebUrl, linkKind, videoSource, type LinkKind } from "@/lib/media";

type Props<B extends Block> = { block: B; edit: boolean; onChange: (next: Block) => void };

const boxed =
  "mt-1 block w-full rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-faint focus:border-orange focus:outline-none";
const label = "text-xs uppercase tracking-wide text-faint";
const HTTPS_HINT = "Use a full web address starting with https://";

/** The small name shown above a media block while editing. */
function BlockName({ icon: Icon, name }: { icon: typeof IconPhoto; name: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-faint">
      <Icon size={14} aria-hidden /> {name}
    </p>
  );
}

function Placeholder({ icon: Icon, children }: { icon: typeof IconPhoto; children: React.ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-faint">
      <Icon size={22} aria-hidden />
      {children}
    </div>
  );
}

export function ImageView({ block: b, edit, onChange }: Props<ImageBlock>) {
  const ok = isWebUrl(b.url);
  // An address that stops working shows a plain message, not a broken-image icon.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [b.url]);

  return (
    <div>
      {edit && <BlockName icon={IconPhoto} name="Image" />}
      <figure>
        {ok && !failed ? (
          // A plain <img>: the address is the user's own, on any site, so next/image cannot optimize it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.url.trim()}
            alt={b.alt}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-h-[480px] w-full rounded-2xl bg-surface object-contain"
          />
        ) : (
          <Placeholder icon={IconPhoto}>
            {!b.url.trim() ? (
              "Paste an image address below."
            ) : !ok ? (
              HTTPS_HINT
            ) : (
              <>
                This image could not be loaded.
                <span className="break-all font-mono text-xs">{b.url.trim()}</span>
              </>
            )}
          </Placeholder>
        )}
        {!edit && b.caption.trim() && <figcaption className="mt-2 whitespace-pre-line text-center text-sm text-muted">{b.caption}</figcaption>}
      </figure>
      {edit && (
        <div className="mt-3 grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={label}>Image address</span>
            <input className={boxed} value={b.url} placeholder="https://" inputMode="url" onChange={(e) => onChange({ ...b, url: e.target.value })} />
          </label>
          <label>
            <span className={label}>Describe the image</span>
            <AutoTextarea
              className={boxed}
              value={b.alt}
              placeholder="What it shows, for people who cannot see it"
              onChange={(e) => onChange({ ...b, alt: e.target.value })}
            />
            {ok && !b.alt.trim() && (
              <span className="mt-1 block text-xs text-tan-soft">Without a description, screen reader users get nothing from this image.</span>
            )}
          </label>
          <label>
            <span className={label}>Caption (optional)</span>
            <AutoTextarea className={boxed} value={b.caption} placeholder="Shown under the image" onChange={(e) => onChange({ ...b, caption: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}

export function VideoView({ block: b, edit, onChange }: Props<VideoBlock>) {
  const source = videoSource(b.url);
  // Nothing loads from the video site until the reader presses play.
  const [playing, setPlaying] = useState(false);
  useEffect(() => setPlaying(false), [b.url]);
  const title = b.title.trim() || "Untitled video";

  return (
    <div>
      {edit && <BlockName icon={IconVideo} name="Video" />}
      {!source ? (
        <Placeholder icon={IconVideo}>
          {!b.url.trim()
            ? "Paste a video address below."
            : !isWebUrl(b.url)
              ? HTTPS_HINT
              : "This is not a YouTube, Vimeo or Loom video, or an .mp4 or .webm file. Use a Files and links block for other pages."}
        </Placeholder>
      ) : playing ? (
        source.kind === "embed" ? (
          <iframe
            src={source.src}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="aspect-video w-full rounded-2xl bg-black"
          />
        ) : (
          <video src={source.src} controls autoPlay aria-label={title} className="aspect-video w-full rounded-2xl bg-black" />
        )
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-surface p-6 text-center">
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${title}`}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-orange text-orange-ink transition-colors hover:bg-orange-soft"
          >
            <IconPlayerPlayFilled size={24} aria-hidden />
          </button>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-faint">
            {source.provider} · loads from {source.host} only when you press play
          </p>
        </div>
      )}
      {edit && (
        <div className="mt-3 grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-2">
          <label>
            <span className={label}>Video address</span>
            <input className={boxed} value={b.url} placeholder="https://" inputMode="url" onChange={(e) => onChange({ ...b, url: e.target.value })} />
          </label>
          <label>
            <span className={label}>Title</span>
            <input className={boxed} value={b.title} placeholder="What the video is" onChange={(e) => onChange({ ...b, title: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}

const KIND_ICON: Record<LinkKind, typeof IconLink> = { document: IconFileText, sheet: IconTable, slides: IconPresentation, link: IconLink };

export function LinksView({ block: b, edit, onChange }: Props<LinksBlock>) {
  const rows = edit ? b.rows : filledLinks(b);
  const n = filledLinks(b).length;
  return (
    <Card icon={IconLink} title="Files and links" note={n ? `${n} ${n === 1 ? "link" : "links"}` : undefined}>
      <ul>
        {rows.map((r, i) => {
          const set = (p: Partial<typeof r>) => onChange({ ...b, rows: patch(b.rows, r.id, p) });
          const Icon = KIND_ICON[linkKind(r.url)];
          const num = i + 1;
          return (
            <li key={r.id} className="flex items-start gap-3 border-t border-line py-2.5 text-sm first:border-t-0">
              <Icon size={18} className="mt-0.5 shrink-0 text-steel-soft" aria-hidden />
              {edit ? (
                <div className="min-w-0 flex-1">
                  <input aria-label={`Link ${num} title`} className={`${field} font-medium`} value={r.title} placeholder="Title" onChange={(e) => set({ title: e.target.value })} />
                  <input
                    aria-label={`Link ${num} address`}
                    className={`${field} font-mono text-xs text-muted`}
                    value={r.url}
                    placeholder="https://"
                    inputMode="url"
                    onChange={(e) => set({ url: e.target.value })}
                  />
                  <input aria-label={`Link ${num} note`} className={`${field} text-xs text-muted`} value={r.note} placeholder="Note (optional)" onChange={(e) => set({ note: e.target.value })} />
                  {r.url.trim() && !isWebUrl(r.url) && <span className="mt-0.5 block text-xs text-tan-soft">{HTTPS_HINT}</span>}
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <a
                    href={r.url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-orange"
                  >
                    {r.title.trim() || hostOf(r.url)} <IconExternalLink size={13} className="shrink-0 text-faint" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-xs text-muted">
                    <span className="font-mono text-faint">{hostOf(r.url)}</span>
                    {r.note.trim() && ` · ${r.note.trim()}`}
                  </p>
                </div>
              )}
              {edit && <Remove label={`Remove link ${num}`} onClick={() => onChange({ ...b, rows: b.rows.filter((x) => x.id !== r.id) })} />}
            </li>
          );
        })}
      </ul>
      {edit && <Add label="Add link" onClick={() => onChange({ ...b, rows: [...b.rows, newLink()] })} />}
    </Card>
  );
}
