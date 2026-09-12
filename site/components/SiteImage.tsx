import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { getImageSlot } from "@/data/images";

/**
 * Reserved image scene. Renders the real file once its slot has a `src` in
 * `data/images.ts`; until then it holds the exact same space with a labeled
 * Swiss placeholder (FIG. no, dimensions, subject) so adding images later
 * never shifts layout.
 */
export function SiteImage({ slot, fig, className }: { slot: string; fig: string; className?: string }) {
  const entry = getImageSlot(slot);
  return (
    <figure className={className}>
      <div
        className="relative w-full overflow-hidden border border-line bg-ink/[0.04]"
        style={{ aspectRatio: entry.ratio }}
      >
        {entry.src ? (
          <Image
            src={entry.src}
            alt={entry.alt}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`${entry.alt} — image coming soon`}
            className="absolute inset-0 flex flex-col justify-between p-4 md:p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="meta-label text-muted">{fig}</span>
              <span className="font-mono text-[11px] text-muted">{entry.recommended}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageIcon size={22} aria-hidden className="text-muted" />
              <p className="max-w-[34ch] text-sm leading-relaxed text-muted">{entry.alt}</p>
            </div>
            <p className="meta-label text-muted">
              Space reserved — place file in <span className="font-mono normal-case tracking-normal">public/images/</span>
            </p>
          </div>
        )}
      </div>
      <figcaption className="meta-label mt-3 text-muted">
        <span className="text-ink">{fig}</span> — {entry.caption}
      </figcaption>
    </figure>
  );
}
