# Implementation notes

## Current scope

Milestone A is implemented as a separate browser composer. The starting folder contained only `PRIVATE_AI_PRODUCT_REFERENCE.md`; no framework, code, or deployment existed. Native JavaScript modules and a small Node HTTP server keep this first workflow runnable without runtime dependencies. UI logic is separate from the scanner so the latter can be reused when an authenticated gateway is added.

| Component | Implementation | Boundary |
|---|---|---|
| Composer and exact preview | `index.html`, `src/app.js` | Raw original never leaves the tab through app network requests |
| Scanner | `src/privacy.js`, `src/scan-worker.js` | Dedicated local Worker; 25,000 UTF-16 code-unit input cap; two-second worker deadline |
| Local policy | Versioned settings in browser memory | Local behavior only; no server authorization claims |
| Restoration map | One random UUID job per tab, in memory | Job-bound lookup; old maps invalidated on new scan, edit, policy application, clearing, expiry, or page exit |
| Response exercise | Echo of approved outgoing text | Explicitly synthetic; rescanned before human display |
| Activity | Latest 100 metadata events, in memory | Unsigned local assertions; not durable pilot audit storage |
| Server | `server.mjs` | Loopback only, explicit asset allowlist, no write endpoints or payload logging |
| Midnight probe | Fixed Preprod RPC destination | Reads chain identity and finalized head; does not submit transactions |

Browser assets and fonts are served locally. A restrictive Content Security Policy permits only same-origin assets, workers, and connections, prohibits form submission and framing, and avoids external scripts. Host and Origin checks reduce accidental cross-origin use and DNS rebinding against the local server. This server is for local development; it is not an authentication system.

## Scanner contract and limitations

- Offsets are JavaScript UTF-16 offsets, matching `String.slice` and browser text inputs. Text outside selected spans is preserved exactly.
- ASCII email patterns support dotted domains and common local-part characters. Internationalized email addresses and unusual RFC address forms are not covered.
- Phones support international `+` notation with 8–15 digits and common formatted North American numbers. Number allocation, ownership, and arbitrary regional formats are not verified.
- Financial identifier support currently means 13–19 digit Luhn-valid payment card candidates. IBAN, account numbers, tax IDs, and other financial identifiers are unsupported. Passing Luhn is not proof that a number is a real card.
- Credentials cover declared `sk-`, GitHub, and AWS access-key prefixes; labeled `api_key`, `access_token`, `password`, and `secret` assignments; and common PEM private-key blocks, including truncated blocks. Arbitrary credentials and every possible token format are not covered. Assignment matches replace the entire label/value span.
- Custom terms are case-sensitive literal strings, at most 50 terms of 100 code units each. No user-supplied regular expressions execute.
- Overlapping detections merge into their complete union. Block takes precedence over redact, which takes precedence over allow. Credential classification wins for restoration safety. Findings count merged spans, not every detector hit.
- Repeated identical category/value pairs use one placeholder within a job. Reserved original tokens such as `[EMAIL_1]` are rejected to avoid collisions. IDs bind restoration to a particular local job; predictable placeholders do not establish authenticity of model output.
- Names, confidential context, documents, semantic recognition, and language models are unavailable. Requiring an unavailable detector blocks the scan explicitly. Deterministic findings carry no fabricated confidence scores.
- Placeholder expansion beyond the configured limit rejects the preview. Original edits during a scan terminate the worker and invalidate its generation, so stale results cannot enable review.

The outgoing preview is read-only. Copy and the sample response require explicit review and exact equality with the stored payload and policy version. This local guard is not a security boundary against a user controlling their browser; server-side authentication, authorization, and independent validation belong in Milestone B.

Response findings are scanned with the active job policy. Newly detected response values become `[REDACTED]`, preventing collisions with existing job placeholders. Email, phone, and custom terms can restore in the human display only. Credentials and cards remain masked. Copying through the app uses the sanitized response regardless of the display toggle. There is no conversation-history or model delivery path yet.

## Local lifetime

The browser session lasts 15 minutes from initialization or explicit clearing; it does not silently extend on activity. Every sensitive action checks wall-clock expiry, and visibility changes recheck it after suspension. Timers, page exit, and back/forward-cache restoration also clear local state. Browser strings cannot be cryptographically zeroized; clearing removes app references and visible DOM content. It does not erase user-controlled clipboard contents or exports.

No user/organization IDs are fabricated. The current scope is a single unauthenticated local tab. Tenant/actor scoping is required before any team workflow is enabled.

## Midnight: verified references

Official documentation checked on 12 September 2026:

- [Node overview](https://docs.midnight.network/nodes): the node handles protocol state, networking, and transaction validation. Operating a full node includes Cardano integration and is separate from implementing this DApp.
- [Node endpoints](https://docs.midnight.network/nodes/node-endpoints): public RPC access is available; the app does not need to operate a full node to begin integration.
- [Networks and environments](https://docs.midnight.network/guides/networks-and-environments): Preprod uses network ID `preprod`, RPC `https://rpc.preprod.midnight.network`, indexer `https://indexer.preprod.midnight.network/api/v4/graphql`, and a locally operated proof server at `http://localhost:6300`. The proof service handles private information and needs its own access boundary.
- [Toolchain installation](https://docs.midnight.network/getting-started/installation) and [Compact](https://docs.midnight.network/compact): consult the current compatible toolchain before compiling contracts. This build deliberately contains no uncompiled contract or SDK compatibility claim.

The implemented probe calls only `system_chain` and `chain_getFinalizedHead`. It verifies the JSON-RPC response IDs, chain name `Midnight Preprod`, and block-hash shape. It uses an eight-second deadline, disallows redirects, and rate-limits checks to one every five seconds per server process. No user-configurable URL, keys, witnesses, prompts, or mappings enter the request. The browser only shows the status after an explicit check.

A live probe succeeded at `2026-09-12T18:04:37.478Z`, returning finalized head `0x6751ccade65f907190e1480ba6b07513e74f4cc278f95be94c068055f5aca651`. This is a historical connectivity observation, not a current health guarantee or confirmation of an application receipt. The probe trusts the configured RPC service; it is not a light client.

## Next implementation boundaries

**Milestone B — controlled team pilot.** Select the identity provider and first model provider. Add authenticated organizations and owner/member roles, a durable database, immutable published policies, and one fixed provider adapter. Bind approval to a canonical outgoing envelope; revalidate current policy at delivery; persist the idempotency decision before dispatch; retain delivery uncertainty after timeouts. Tenant isolation and modified-payload tests must pass before enabling real confidential requests. Local demo activity must never authorize a live call.

**Milestone C — Midnight evidence.** Define a reviewed randomized commitment schema, including encoding, domain separation, field order, and algorithm identifiers. Keep local SHA-family payload binding explicitly separate from any Compact commitment construction unless cross-runtime vectors establish equivalence. Implement and compile a minimal authorized-submitter contract, replay protection, signer/prover handling, durable recovery, and actual indexer/ledger confirmation against the configured network, contract, and commitment. Display `local_only`, `signed`, `queued`, `submitted`, `confirmed`, `failed`, and `unknown` according to verified state. Strict workflows must block during required-evidence outages. A hash or arbitrary transaction ID is insufficient.

The P1 browser extension, agents, document permissions, and revocation remain later milestones, as ordered in the reference. Production hosting and production blockchain deployment are separate release decisions.

## Validation recorded

Node 24.18.0 on macOS arm64: 12 Node tests passed; the 25,000-character synthetic scan benchmark reported p95 about 0.4 ms in Node on this machine. This does not establish browser p95 or cross-device performance. The small detector corpus reported precision/recall 1.0 for each declared category on its own fixtures only. Expand it with representative, approved synthetic cases before a pilot.

12 Chrome browser tests passed, including capture of all outgoing app requests during the full local workflow. The capture contained only same-origin asset GETs, no raw input or mappings, and no AI/model calls. Browser checks cover review gating, stale input, policy blocks, unavailable detectors, local expiry, safe text rendering, masked clipboard copying, connection failure, and all four screens at 320, 375, 414, 768, and 1440 px.
