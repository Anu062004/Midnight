"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, language = "ts", title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="border border-line bg-coal text-bone">
      <div className="flex items-center justify-between border-b border-bone/15 px-4 py-2">
        <p className="meta-label text-bone/50">{title ?? language}</p>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded border border-bone/20 px-2.5 py-1 text-xs text-bone/70 hover:border-bone/50 hover:text-bone"
        >
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
