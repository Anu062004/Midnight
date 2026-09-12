"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

type AppStatus = "checking" | "online" | "offline";

let cached: { at: number; online: boolean } | null = null;

/**
 * Reachability probe for the workspace app. Uses a `no-cors` GET so no server
 * changes are needed: any HTTP response (even the workspace's 403 for foreign
 * origins) resolves opaque = reachable, while connection-refused rejects.
 * Results are cached module-wide for 10s so many buttons cost one request.
 */
async function probeApp(): Promise<boolean> {
  if (cached && Date.now() - cached.at < 10000) return cached.online;
  try {
    await fetch(`${siteConfig.appUrl}/`, {
      mode: "no-cors", // follow is mandatory with no-cors; response stays opaque
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    cached = { at: Date.now(), online: true };
    return true;
  } catch {
    cached = { at: Date.now(), online: false };
    return false;
  }
}

function useAppStatus(): AppStatus {
  const [status, setStatus] = useState<AppStatus>("checking");
  useEffect(() => {
    let alive = true;
    probeApp().then((online) => {
      if (alive) setStatus(online ? "online" : "offline");
    });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

const tones = {
  outline:
    "inline-flex min-h-[40px] items-center gap-1 rounded-md border border-line px-4 text-sm font-medium transition-colors hover:border-ink",
  primary:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-ink bg-ink px-6 font-medium text-paper transition-colors hover:bg-soot",
  dark: "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-bone/30 bg-transparent px-6 font-medium text-bone transition-colors hover:border-bone",
  accent:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-accent bg-accent px-6 font-medium text-accent-ink transition-colors hover:brightness-95",
  link: "inline-flex items-center gap-1 font-medium underline decoration-line underline-offset-4 hover:decoration-ink",
} as const;

/**
 * Status-aware Launch App entry point. Online → opens the running workspace in
 * a new tab. Offline → reveals the exact start command instead of a dead tab.
 */
export function LaunchAppButton({
  tone = "outline",
  className,
  compact = false,
}: {
  tone?: keyof typeof tones;
  className?: string;
  compact?: boolean;
}) {
  const status = useAppStatus();
  const [showHint, setShowHint] = useState(false);

  if (status === "checking") {
    return (
      <span className={cn(tones[tone], "opacity-60", className)} aria-busy="true" aria-live="polite">
        Checking app…
      </span>
    );
  }

  if (status === "online") {
    return (
      <a
        href={siteConfig.appUrl}
        target="_blank"
        rel="noreferrer"
        title="Open the running workspace application"
        className={cn(tones[tone], className)}
      >
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        Launch App <ArrowUpRight size={tone === "link" || compact ? 14 : 16} aria-hidden />
      </a>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-start gap-2", className)}>
      <button
        type="button"
        onClick={() => setShowHint((v) => !v)}
        aria-expanded={showHint}
        title="The workspace app is not reachable"
        className={cn(tones[tone], "opacity-80")}
      >
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-muted" />
        App offline
      </button>
      {showHint && (
        <span role="status" className="max-w-[46ch] text-sm leading-relaxed text-muted">
          Start it first: <code className="font-mono text-[13px] text-ink">npm start</code> in the repo root, then this
          button opens <code className="font-mono text-[13px] text-ink">{siteConfig.appUrl}</code>.
        </span>
      )}
    </span>
  );
}
