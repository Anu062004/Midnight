export type DocEntry = { slug: string; title: string; body: string[] };

export type DocGroup = { title: string; entries: DocEntry[] };

export const docGroups: DocGroup[] = [
  {
    title: "Workspace App",
    entries: [
      {
        slug: "workspace-overview",
        title: "Overview",
        body: [
          "The workspace app in this repository is the working product behind the site: a local text-privacy workflow, a read-only Midnight Preprod check, an authenticated team gateway with live model delivery, and a multi-wallet adapter. Run it with Node 24+ via `npm start` in the repo root, then open http://127.0.0.1:3000. The workspace itself has no runtime package dependencies.",
          "Start with the synthetic example before entering confidential information. The response exercise echoes approved text locally — it is not a model call unless you explicitly send through the organization gateway.",
        ],
      },
      {
        slug: "workspace-workflow",
        title: "Local Workflow",
        body: [
          "Write or paste text (25,000 character cap) and select Scan. A dedicated Web Worker finds supported email, phone, payment-card, Social Security number, IBAN, credential, and custom-term patterns within a two-second deadline, then shows the exact outgoing preview with findings.",
          "Checking the review box gates copying and the sample response. Restoration happens in the human display only — credentials and cards stay masked, and copy/export always use the sanitized text. Sessions expire after 15 minutes and keep everything in memory: no localStorage, no telemetry, no prompt-body logs.",
        ],
      },
      {
        slug: "workspace-server",
        title: "Server Boundary",
        body: [
          "The server binds loopback-only (127.0.0.1), serves an explicit asset allowlist, and sends a restrictive Content-Security-Policy with no-store caching. Host and Origin checks blunt DNS rebinding and cross-origin use; POST routes require an Origin header and JSON bodies capped at 200KB.",
          "GET /api/midnight/status performs the read-only Preprod check (chain identity plus finalized head, rate-limited to one call per five seconds). All gateway routes use stable error codes and never log payloads or keys.",
        ],
      },
      {
        slug: "workspace-gateway",
        title: "Model Gateway",
        body: [
          "Set GEMINI_API_KEY and GEMINI_MODEL (verified working with gemini-2.5-flash) to deliver through Gemini with the key sent in the x-goog-api-key header — never in URLs or logs. With those blank, the gateway falls back to the OpenAI Responses API. The .env file is git-ignored and should carry 0600 permissions.",
          "Delivery revalidates the frozen approval (payload commitment, policy version, model), enforces per-tenant quotas and expiry, and preserves uncertainty after timeouts: a timeout reports unknown delivery, never 'nothing was sent'.",
        ],
      },
      {
        slug: "workspace-wallets",
        title: "Wallet Adapter",
        body: [
          "The Connections view discovers any standards-compatible Midnight wallet injected into window.midnight — Lace, 1AM, or future wallets, none hardcoded. Only connectors satisfying the ^4.0.0 range are accepted; others show as unsupported with their version.",
          "Connect passes the preprod network hint, validates the wallet's reported network, then loads configuration, addresses, and balances (each failure isolated so partial loads never kill the connection). Disconnect is application-level and clears all state; only the selected wallet id persists in localStorage.",
        ],
      },
      {
        slug: "workspace-environment",
        title: "Environment Variables",
        body: [
          "GEMINI_API_KEY / GEMINI_MODEL select the Gemini provider when set; OPENAI_API_KEY / OPENAI_MODEL are the fallback pair. DATABASE_PATH sets durable gateway storage (default ./data/workspace.sqlite, created 0700/0600) and PORT sets the listen port (default 3000).",
          "Keep provider keys out of the repository, shell history, and screenshots. A key pasted anywhere public should be rotated in its provider console before reuse.",
        ],
      },
      {
        slug: "workspace-verification",
        title: "Verification",
        body: [
          "Root `npm test` runs 47 Node checks: detector corpus with per-category precision/recall, Unicode and overlap handling, job isolation, binding, expiry, server boundary, RPC validation, Midnight contract/proving logic, and 28 wallet-adapter checks with mocked connectors. No real wallet or provider key is needed.",
          "The Playwright suite (Chrome) covers the full local workflow, clipboard masking, policy failures, expiry, and responsive layouts — all with synthetic content only.",
        ],
      },
    ],
  },
  {
    title: "Getting Started",
    entries: [
      {
        slug: "overview",
        title: "Overview",
        body: [
          "Bulkhead is a privacy layer between your people or agents and external AI models. Prompts are scanned locally, organization policy decides what may leave, sensitive values are tokenized or blocked, and only the safe version is sent.",
          "Every protected request's envelope — organization, actor, job, policy version, model, and a fresh nonce — hashes into one opaque request commitment recorded via Midnight. Receipts contain metadata bound inside that hash, never content.",
        ],
      },
      {
        slug: "architecture",
        title: "Architecture",
        body: [
          "Request path: input → local privacy engine (scanner, policy engine, token vault) → safe request → AI gateway → model → output scanner → local restore. A Midnight receipt is recorded in parallel with dispatch.",
          "The gateway owns the provider path and revalidates the frozen approval before sending. Retries cannot double-send; timeouts resolve to an explicit unknown-delivery state.",
        ],
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        body: [
          "1. Create a policy with the default category actions. 2. Send a prompt through the SDK or gateway with receipt enabled. 3. Inspect the returned receipt id and verify it against the policy version you published.",
          "Start with synthetic examples before connecting confidential workflows, and keep the strictest categories on block until detectors are tuned.",
        ],
      },
    ],
  },
  {
    title: "Privacy Engine",
    entries: [
      {
        slug: "scanner",
        title: "Scanner",
        body: [
          "Versioned pattern detectors cover credentials, email, phone, payment-card shapes, and custom literal terms. Overlapping findings merge; block wins over redact over allow.",
          "Detection covers declared patterns, not all confidential meaning. Report required-detector outages as blocks, never as silent passes.",
        ],
      },
      {
        slug: "policy-engine",
        title: "Policy Engine",
        body: [
          "Policies are versioned and immutable once published. Each version carries category actions, custom terms, detector requirements, payload limits, evidence mode, and retention.",
          "In-flight policy changes invalidate approvals: the gateway revalidates the current version at dispatch.",
        ],
      },
      {
        slug: "tokenization",
        title: "Tokenization",
        body: [
          "Sensitive values map to request-scoped placeholders such as [CLIENT_1]. Identical values share one placeholder within a request; different requests never share mappings.",
          "Credentials stay masked everywhere, including restored display and clipboard actions.",
        ],
      },
      {
        slug: "restoration",
        title: "Restoration",
        body: [
          "Permitted placeholders restore for the human reader only. Conversation history and exports keep the sanitized form. Model-generated tokens are untrusted and never restore.",
        ],
      },
    ],
  },
  {
    title: "AI Gateway",
    entries: [
      {
        slug: "providers",
        title: "Providers",
        body: [
          "One controlled egress serves every configured model. Provider credentials live server-side and never enter prompts, URLs, or browser storage.",
          "Provider targets are allow-listed per organization; custom destinations require administrator approval.",
        ],
      },
      {
        slug: "requests",
        title: "Requests",
        body: [
          "Requests bind job id, policy version, model, nonce, and payload commitment. The gateway checks the exact bytes forwarded against the approval envelope.",
          "Size limits, per-tenant quotas, and timeouts apply before dispatch.",
        ],
      },
      {
        slug: "responses",
        title: "Responses",
        body: [
          "Model output is rescanned with the active policy before display. Newly detected values become [REDACTED]; the sanitized form is what persists.",
        ],
      },
      {
        slug: "errors",
        title: "Errors",
        body: [
          "Stable codes: POLICY_BLOCKED, PAYLOAD_CHANGED, POLICY_CHANGED, JOB_EXPIRED, QUOTA_EXCEEDED, PROVIDER_UNAVAILABLE, DELIVERY_UNKNOWN. Timeouts after dispatch report unknown delivery — never 'nothing was sent'.",
        ],
      },
    ],
  },
  {
    title: "Agents",
    entries: [
      {
        slug: "mcp",
        title: "MCP",
        body: [
          "The MCP gateway applies the same scan-and-policy pass to tool inputs and tool results. Policies address tools, arguments, recipients, and result classes.",
          "Status: planned. Interfaces on this page describe the architecture target.",
        ],
      },
      {
        slug: "tool-policies",
        title: "Tool Policies",
        body: [
          "Example: send_email allows internal recipients, redacts pricing and PII for external recipients, and blocks credentials in arguments. Bulk exports require approved-model routing.",
        ],
      },
    ],
  },
  {
    title: "Midnight",
    entries: [
      {
        slug: "wallet-connection",
        title: "Wallet Connection",
        body: [
          "Connect any standards-compatible Midnight wallet through the DApp Connector API. Discovery reads window.midnight; no wallet is hardcoded. Only the selected wallet id is remembered.",
        ],
      },
      {
        slug: "policy-registry",
        title: "Policy Versions",
        body: [
          "Policy versions are immutable once published and live in the gateway's own storage, not on-chain. The policy version a request used is one of the fields hashed into that request's on-chain commitment, so it's cryptographically bound — but it isn't a separately disclosed on-chain field, and there's no on-chain policy registry today.",
        ],
      },
      {
        slug: "receipts",
        title: "Receipts",
        body: [
          "On-chain, the contract records only an opaque 32-byte request commitment per job, plus the operator's authority and a contract schema version — never a prompt, policy body, or scanner version. The gateway separately holds a signed, off-chain attestation over that commitment for its own audit trail.",
        ],
      },
      {
        slug: "verification",
        title: "Verification",
        body: [
          "Verify a receipt by recomputing its commitment from the disclosed envelope (organization, actor, job, policy version, model, nonce, payload) and checking that exact commitment's membership in the finalized contract state at a specific block. Confirmation state is explicit: pending is shown as pending, never as confirmed.",
        ],
      },
    ],
  },
  {
    title: "Reference",
    entries: [
      {
        slug: "configuration",
        title: "Configuration",
        body: [
          "Gateway: provider credentials, approved models, quotas, timeouts, retention days. Engine: category actions, custom terms (50 max, 100 chars each), required detectors, payload ceiling.",
        ],
      },
      {
        slug: "environment-variables",
        title: "Environment Variables",
        body: [
          "PROVIDER_API_KEY and PROVIDER_MODEL select the active model backend. DATABASE_PATH sets durable storage. PORT sets the local port. Never commit secrets; keep .env out of version control with 0600 permissions.",
        ],
      },
      {
        slug: "api-reference",
        title: "API Reference",
        body: [
          "Jobs: create an approved envelope, then send exact bytes. Activity: tenant-scoped metadata with actor, policy, outcome, and evidence filters. Errors use stable codes with human-readable messages.",
        ],
      },
      {
        slug: "doc-security",
        title: "Security",
        body: [
          "See the Security page for the threat model. Rule of thumb: raw content stays local, secrets stay masked, and every boundary fails closed.",
        ],
      },
    ],
  },
];
