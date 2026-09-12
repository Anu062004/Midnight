"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

type Span =
  | { kind: "text"; value: string }
  | { kind: "sensitive"; value: string; token: string; label: string; action: "TOKENIZE" | "BLOCK" };

const PROMPT: Span[] = [
  { kind: "text", value: "Draft a renewal summary for " },
  { kind: "sensitive", value: "Acme Corporation", token: "[CLIENT_1]", label: "Customer name", action: "TOKENIZE" },
  { kind: "text", value: ".\nContract value: " },
  { kind: "sensitive", value: "₹5.2 crore", token: "[AMOUNT_1]", label: "Financial figure", action: "TOKENIZE" },
  { kind: "text", value: ".\nPull usage with key " },
  { kind: "sensitive", value: "sk-prod-9f27c1", token: "[REMOVED]", label: "Credential", action: "BLOCK" },
  { kind: "text", value: "." },
];

const STAGES = ["RAW", "SCANNING", "DETECTED", "POLICY", "SANITIZED", "VERIFIED", "AI SENT", "RESTORED"] as const;
const DURATIONS = [1200, 1600, 1700, 1500, 1500, 1300, 1700, 2600];

const STATUS_COPY: Record<(typeof STAGES)[number], string> = {
  RAW: "Original prompt stays on this device.",
  SCANNING: "Scanning locally — nothing transmitted.",
  DETECTED: "3 sensitive values detected.",
  POLICY: "Policy applied: 2 tokenized · 1 blocked.",
  SANITIZED: "Safe prompt assembled. Originals sealed locally.",
  VERIFIED: "Receipt recorded: policy v4 · request 0x82A9…91F2.",
  "AI SENT": "Only approved context reaches the model.",
  RESTORED: "Placeholders restored for display — locally only.",
};

function renderPrompt(stage: number) {
  const tokenized = stage >= 4;
  return PROMPT.map((span, i) => {
    if (span.kind === "text") return <span key={i}>{span.value}</span>;
    if (tokenized) {
      return (
        <span key={i} className="rounded bg-accent px-1 font-mono text-[12.5px] text-accent-ink">
          {span.token}
        </span>
      );
    }
    return (
      <span
        key={i}
        className={cn(
          "rounded-sm px-0.5 transition-colors duration-300",
          stage === 0 && "bg-transparent",
          stage === 1 && "animate-pulse bg-ink/[0.07] underline decoration-dotted underline-offset-4",
          stage >= 2 && span.action === "BLOCK" && "bg-ink text-paper",
          stage >= 2 && span.action === "TOKENIZE" && "bg-accent/60"
        )}
      >
        {span.value}
      </span>
    );
  });
}

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStage(STAGES.length - 1);
      return;
    }
    if (stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage, cycle, reduce]);

  const replay = useCallback(() => {
    setStage(0);
    setCycle((c) => c + 1);
  }, []);

  const sent = stage >= 6;
  const findings = PROMPT.filter((s): s is Extract<Span, { kind: "sensitive" }> => s.kind === "sensitive");

  return (
    <div className="border border-line bg-paper" aria-label="Interactive product demonstration">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="meta-label text-muted">Live workflow / tokenization</p>
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="hidden font-mono text-xs text-muted sm:block">
            {STAGES[stage]}
          </p>
          {!reduce && (
            <button
              type="button"
              onClick={replay}
              className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 text-xs font-medium hover:border-ink"
            >
              <RotateCcw size={13} aria-hidden /> Replay
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <p className="meta-label text-muted">Original prompt</p>
            <span className="inline-flex items-center gap-1.5 rounded bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" /> Local
            </span>
          </div>
          <pre className="mt-4 min-h-[132px] whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
            {renderPrompt(stage)}
          </pre>
          <div className="mt-4 min-h-[86px] border-t border-line pt-3" aria-live="polite">
            {stage >= 2 ? (
              <ul className="space-y-1.5">
                {findings.map((f) => (
                  <li key={f.token} className="flex items-center justify-between gap-3 font-mono text-xs">
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {f.label}: {stage >= 4 ? f.token : f.value}
                    </span>
                    {stage >= 3 && (
                      <span
                        className={cn(
                          "shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold",
                          f.action === "BLOCK" ? "border-ink bg-ink text-paper" : "border-accent bg-accent text-accent-ink"
                        )}
                      >
                        {f.action}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-xs text-muted">{stage === 1 ? "Scanning patterns…" : "Awaiting scan."}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="meta-label text-muted">AI model receives</p>
            <span className="inline-flex items-center gap-1.5 rounded border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              External
            </span>
          </div>
          <div className="mt-4 min-h-[132px] border border-dashed border-line p-3">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.pre
                  key={`sent-${cycle}`}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed"
                >
                  {`Draft a renewal summary for [CLIENT_1].\nContract value: [AMOUNT_1].\nPull usage with key [REMOVED].`}
                </motion.pre>
              ) : (
                <motion.p
                  key={`wait-${cycle}-${stage}`}
                  initial={false}
                  className="font-mono text-[13px] text-muted"
                >
                  — waiting for approved context —
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <ArrowRight size={14} aria-hidden />
            <span aria-live="polite">{STATUS_COPY[STAGES[stage]]}</span>
          </div>
          {stage >= 5 && (
            <div className="mt-3 flex items-center justify-between border border-line px-3 py-2 font-mono text-xs">
              <span className="text-muted">Receipt 0x82A9…91F2</span>
              <span className="font-semibold text-ink">✓ VERIFIED</span>
            </div>
          )}
        </div>
      </div>

      <ol className="grid grid-cols-4 border-t border-line md:grid-cols-8" aria-label="Pipeline stages">
        {STAGES.map((name, i) => (
          <li
            key={name}
            aria-current={i === stage ? "step" : undefined}
            className={cn(
              "border-r border-line px-2 py-2 text-center font-mono text-[10px] uppercase tracking-wider last:border-r-0",
              i < stage && "text-muted",
              i === stage && "bg-ink font-semibold text-paper",
              i > stage && "text-muted/50"
            )}
          >
            {name}
          </li>
        ))}
      </ol>
    </div>
  );
}
