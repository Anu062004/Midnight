import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/* Vertical architectural flow: NODE ▼ NODE ▼ ... with hairline boxes. */
export function ArchitectureFlow({
  steps,
  dark = false,
  horizontalOnDesktop = false,
}: {
  steps: { label: string; detail?: string; accent?: boolean }[];
  dark?: boolean;
  horizontalOnDesktop?: boolean;
}) {
  return (
    <ol
      className={cn("flex", horizontalOnDesktop ? "flex-col md:flex-row md:items-stretch" : "flex-col")}
      aria-label="Architecture flow"
    >
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={cn("flex min-w-0", horizontalOnDesktop ? "flex-col md:flex-1 md:flex-row md:items-stretch" : "flex-col")}
        >
          <div
            className={cn(
              "flex-1 border px-5 py-4",
              dark ? "border-bone/20 bg-soot" : "border-line bg-paper",
              step.accent && "border-l-2 border-l-accent"
            )}
          >
            <p className={cn("meta-label", dark ? "text-bone/50" : "text-muted")}>{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-1 font-display text-base font-medium tracking-tight">{step.label}</p>
            {step.detail && <p className={cn("mt-1 text-sm leading-relaxed", dark ? "text-bone/65" : "text-muted")}>{step.detail}</p>}
          </div>
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn("grid shrink-0 place-items-center", dark ? "text-bone/50" : "text-muted", horizontalOnDesktop ? "py-1.5 md:px-1.5 md:py-0" : "py-1.5")}
            >
              <ArrowDown size={16} className={horizontalOnDesktop ? "md:hidden" : undefined} />
              {horizontalOnDesktop && <ArrowRight size={16} className="hidden md:block" />}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* Editorial policy table: rows of rule → decision. */
export function PolicyTable({
  title,
  rows,
  dark = false,
}: {
  title: string;
  rows: { rule: string; decision: "ALLOW" | "TOKENIZE" | "REDACT" | "BLOCK" | "APPROVED MODELS ONLY" | "PRIVATE MODEL ONLY"; note?: string }[];
  dark?: boolean;
}) {
  return (
    <div className={cn("border", dark ? "border-bone/20" : "border-line")}>
      <p className={cn("meta-label border-b px-5 py-3", dark ? "border-bone/20 text-bone/60" : "border-line text-muted")}>{title}</p>
      <dl>
        {rows.map((row) => (
          <div
            key={row.rule}
            className={cn(
              "grid grid-cols-4 items-baseline gap-2 border-b px-5 py-3.5 last:border-0 md:grid-cols-12",
              dark ? "border-bone/15" : "border-line"
            )}
          >
            <dt className="col-span-2 text-[15px] font-medium md:col-span-6">{row.rule}</dt>
            <dd className="col-span-2 text-right md:col-span-6 md:text-left">
              <span
                className={cn(
                  "inline-block rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                  row.decision === "BLOCK" && "border-ink bg-ink text-paper",
                  row.decision === "ALLOW" && (dark ? "border-bone/30 text-bone" : "border-line text-ink"),
                  (row.decision === "TOKENIZE" || row.decision === "REDACT") && "border-accent bg-accent text-accent-ink",
                  (row.decision === "APPROVED MODELS ONLY" || row.decision === "PRIVATE MODEL ONLY") &&
                    (dark ? "border-bone/30 text-bone" : "border-ink/40 text-ink")
                )}
              >
                {row.decision}
              </span>
              {row.note && <span className={cn("mt-1 block text-xs", dark ? "text-bone/55" : "text-muted")}>{row.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Small verification receipt card. Commitments only — never raw content. */
export function ReceiptCard({ dark = false, className }: { dark?: boolean; className?: string }) {
  const rows: Array<[string, ReactNode]> = [
    ["Policy", "local-starter v4"],
    ["Request", "0x82A9…91F2"],
    ["Scanner", "patterns-1.0.0"],
    ["Raw content stored", "NO"],
    ["Timestamp", "2026-09-12T09:41Z"],
  ];
  return (
    <div className={cn("border", dark ? "border-bone/20 bg-soot" : "border-line bg-paper", className)}>
      <div className={cn("flex items-center justify-between border-b px-5 py-3", dark ? "border-bone/20" : "border-line")}>
        <p className="meta-label">Protection receipt</p>
        <span className="inline-flex items-center gap-1.5 rounded bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
          <span aria-hidden>✓</span> Verified
        </span>
      </div>
      <dl className="px-5 py-2">
        {rows.map(([k, v]) => (
          <div key={k} className={cn("flex items-baseline justify-between gap-4 border-b py-2.5 text-sm last:border-0", dark ? "border-bone/15" : "border-line")}>
            <dt className={dark ? "text-bone/55" : "text-muted"}>{k}</dt>
            <dd className="font-mono text-[13px]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Static before/after prompt panel (for non-homepage use; homepage has the animated demo). */
export function PromptDemo({ dark = false }: { dark?: boolean }) {
  const faint = dark ? "text-bone/60" : "text-muted";
  return (
    <div className="grid gap-px border border-line bg-line md:grid-cols-2">
      <div className={cn("p-6", dark ? "bg-coal" : "bg-paper")}>
        <p className={cn("meta-label", faint)}>Without — everything exposed</p>
        <pre className="mt-4 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
{`Client: Acme Corp
Revenue: ₹5.2 Cr
AWS key: AKIAIOSFODNN7EXAMPLE`}
        </pre>
        <p className={cn("mt-4 text-sm", faint)}>→ External AI</p>
      </div>
      <div className={cn("p-6", dark ? "bg-coal" : "bg-paper")}>
        <p className={cn("meta-label", faint)}>With product — only safe context sent</p>
        <pre className="mt-4 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
{`Client: [CLIENT_1]
Revenue: [AMOUNT_1]
AWS key: [REMOVED]`}
        </pre>
        <p className={cn("mt-4 text-sm", faint)}>→ External AI · <span className="text-ink dark:text-accent">Real values remain local.</span></p>
      </div>
    </div>
  );
}
