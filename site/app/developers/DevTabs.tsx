"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { cn } from "@/lib/cn";

const tabs = [
  {
    id: "js",
    label: "JavaScript",
    title: "javascript",
    code: `import { createPrivacyClient } from "@bulkhead/ai";

const secure = createPrivacyClient({
  policy: "default",
});

const response = await secure.chat({
  prompt, // scanned, tokenized, receipted
});

console.log(response.text); // human display, restored locally`,
  },
  {
    id: "rest",
    label: "REST",
    title: "http",
    code: `POST /v1/chat HTTP/1.1
Authorization: Bearer $BULKHEAD_KEY
Content-Type: application/json

{
  "policy": "company-default",
  "prompt": "Summarize the renewal for Acme…",
  "receipt": true
}`,
  },
  {
    id: "mcp",
    label: "MCP",
    title: "json — tool policy",
    code: `{
  "mcpServers": {
    "crm": {
      "policy": {
        "customer_email": "TOKENIZE",
        "contract_value": "REDACT",
        "api_keys": "BLOCK"
      }
    }
  }
}`,
  },
] as const;

export function DevTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("js");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div role="tablist" aria-label="Integration examples" className="flex border border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex-1 border-r border-line px-4 py-3 font-mono text-sm last:border-r-0",
              active === tab.id ? "bg-ink font-semibold text-paper" : "text-muted hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="border border-t-0 border-line">
        <CodeBlock code={current.code} title={current.title} language={current.title} />
      </div>
      <p className="mt-3 text-xs text-muted">SDK and REST are architecture targets — interfaces shown are the planned shape.</p>
    </div>
  );
}
