# Implementation notes

## Current scope

The separate browser composer, authenticated organization gateway, and Midnight receipt implementation are now connected. Native JavaScript handles the browser; Node 24 supplies HTTP, cryptography and SQLite, with official Midnight packages for contract execution, proving and finalized-state queries. [MIDNIGHT.md](MIDNIGHT.md) is the current setup and evidence reference. The contract is compiled and locally proven; funded-wallet Preprod deployment remains pending.

| Component | Implementation | Boundary |
|---|---|---|
| Composer and exact preview | `index.html`, `src/app.js` | Raw original never leaves the tab through app network requests |
| Scanner | `src/privacy.js`, `src/scan-worker.js` | Dedicated local Worker; 25,000 UTF-16 code-unit input cap; two-second worker deadline |
| Policy | Local session rules or immutable organization versions in SQLite | Current organization rules rechecked at delivery |
| Restoration map | One random UUID job per tab, in memory | Job-bound lookup; old maps invalidated on new scan, edit, policy application, clearing, expiry, or page exit |
| Response | Local echo or configured Gemini/OpenAI gateway | Both rescanned before human display |
| Activity | Local events plus tenant-scoped SQLite metadata | Signed receipts and independently checked ledger status remain distinct |
| Server | `server.mjs`, `gateway.mjs` | Loopback, authenticated/CSRF-protected write endpoints; no prompt/response persistence |
| Midnight probe | Fixed Preprod RPC destination | Reads chain identity and finalized head; does not submit transactions |
| Midnight evidence | `contracts/receipts.compact`, `midnight.mjs` | Operator authorization, replay prevention, local proving, wallet submission, finalized-state verification |

Browser assets and fonts are served locally. A restrictive Content Security Policy permits only same-origin assets, workers, and connections, prohibits native form submission and framing, and avoids external scripts. Forms use authenticated same-origin JSON APIs. Host/Origin, HttpOnly SameSite cookies, CSRF tokens, scrypt passwords, active membership checks, and owner permissions protect this local development gateway. This is not a production identity service; email verification and account recovery are not implemented.

## Scanner contract and limitations

- Offsets are JavaScript UTF-16 offsets, matching `String.slice` and browser text inputs. Text outside selected spans is preserved exactly.
- ASCII email patterns support dotted domains and common local-part characters. Internationalized email addresses and unusual RFC address forms are not covered.
- Phones support international `+` notation with 8–15 digits and common formatted North American numbers. Number allocation, ownership, and arbitrary regional formats are not verified.
- Financial identifier support means 13–19 digit Luhn-valid payment card candidates and mod-97-valid IBANs. US SSNs are supported with area/group/serial range checks (rejects `000`/`666`/`9xx` area, `00` group, `0000` serial). Other account numbers and tax IDs are unsupported. Passing Luhn or mod-97 is not proof that a number is real or currently active.
- Credentials cover declared `sk-`/`sk-proj-`/`sk-ant-`, GitHub, AWS, Google (`AIza`), Slack (`xox…`), and Stripe (`rk_live_`) key prefixes; JWTs; connection strings with an embedded `user:pass@host`; labeled `api_key`, `access_token`, `password`, and `secret` assignments; and common PEM private-key blocks, including truncated blocks. Arbitrary credentials and every possible token format are not covered. Assignment matches replace the entire label/value span.
- Custom terms are case-sensitive literal strings, at most 50 terms of 100 code units each. No user-supplied regular expressions execute.
- Overlapping detections merge into their complete union. Block takes precedence over redact, which takes precedence over allow. Credential classification wins for restoration safety, followed by SSN, then IBAN. Findings count merged spans, not every detector hit.
- Repeated identical category/value pairs use one placeholder within a job. Reserved original tokens such as `[EMAIL_1]` are rejected to avoid collisions. IDs bind restoration to a particular local job; predictable placeholders do not establish authenticity of model output.
- Names, confidential context, documents, semantic recognition, and language models are unavailable. Requiring an unavailable detector blocks the scan explicitly. Deterministic findings carry no fabricated confidence scores.
- Placeholder expansion beyond the configured limit rejects the preview. Original edits during a scan terminate the worker and invalidate its generation, so stale results cannot enable review.

The outgoing preview is read-only. Copy, sample response and live delivery require explicit review and exact equality with the local job payload/policy version. The gateway independently authenticates the actor, recomputes the request digest, scans outgoing text, checks policy freshness and claims delivery once. Local review remains a client assertion, not proof that a malicious browser actually ran the scanner.

Response findings are scanned with the active job policy. Newly detected response values become `[REDACTED]`, preventing collisions with existing job placeholders. Email, phone, and custom terms can restore in the human display only. Credentials, cards, SSNs, and IBANs remain masked. Copying uses the sanitized response regardless of the display toggle. The live gateway sends single reviewed requests; conversation history is not implemented.

## Local lifetime

The browser session lasts 15 minutes from initialization or explicit clearing; it does not silently extend on activity. Every sensitive action checks wall-clock expiry, and visibility changes recheck it after suspension. Timers, page exit, and back/forward-cache restoration also clear local state. Browser strings cannot be cryptographically zeroized; clearing removes app references and visible DOM content. It does not erase user-controlled clipboard contents or exports.

The gateway generates persistent account/organization IDs during registration and derives request identity from authenticated sessions. Local session clearing does not sign the account out or delete server audit records. Signed-in users reload their published organization policy, including custom terms, after a local reset; organization policy retention differs from temporary local rules.

## Midnight: verified references

Official documentation checked on 12 September 2026:

- [Node overview](https://docs.midnight.network/nodes): the node handles protocol state, networking, and transaction validation. Operating a full node includes Cardano integration and is separate from implementing this DApp.
- [Node endpoints](https://docs.midnight.network/nodes/node-endpoints): public RPC access is available; the app does not need to operate a full node to begin integration.
- [Networks and environments](https://docs.midnight.network/guides/networks-and-environments): Preprod uses network ID `preprod`, RPC `https://rpc.preprod.midnight.network`, indexer `https://indexer.preprod.midnight.network/api/v4/graphql`, and a locally operated proof server at `http://localhost:6300`. The proof service handles private information and needs its own access boundary.
- [Toolchain installation](https://docs.midnight.network/getting-started/installation) and [Compact](https://docs.midnight.network/compact): implementation updated on 14 September using compiler 0.31.1, runtime 0.16.0, Midnight.js 4.1.1 and proof server 8.1.0. See the [compatibility matrix](https://docs.midnight.network/relnotes/support-matrix).

The implemented probe calls only `system_chain` and `chain_getFinalizedHead`. It verifies the JSON-RPC response IDs, chain name `Midnight Preprod`, and block-hash shape. It uses an eight-second deadline, disallows redirects, and rate-limits checks to one every five seconds per server process. No user-configurable URL, keys, witnesses, prompts, or mappings enter the request. The browser only shows the status after an explicit check.

A live probe succeeded at `2026-09-12T18:04:37.478Z`, returning finalized head `0x6751ccade65f907190e1480ba6b07513e74f4cc278f95be94c068055f5aca651`. This is a historical connectivity observation, not a current health guarantee or confirmation of an application receipt. The probe trusts the configured RPC service; it is not a light client.

## Next implementation boundaries

**Controlled team pilot.** Local account/organization roles, invitations, revocation, immutable policies, SQLite audit metadata, exact payload binding and single dispatch are implemented. Gemini is selected when its server key is configured; otherwise OpenAI is selected. A production identity provider, hosting/security review and representative scanner corpus remain release work.

**Midnight evidence.** The versioned commitment schema, operator-authorized/replay-protected Compact contract, Ed25519 attestation, local proof generation, wallet transaction flow and finalized-state verifier are implemented and tested locally. Strict delivery fails closed during required-evidence outages. Funded-wallet Preprod deployment/settlement validation and an automatic operator relayer/batching remain outstanding. See [MIDNIGHT.md](MIDNIGHT.md) for exact states, keys and limitations.

The P1 browser extension, agents, document permissions, and revocation remain later milestones, as ordered in the reference. Production hosting and production blockchain deployment are separate release decisions.

## Validation recorded

14 September 2026: 47 Node tests and 15 Chrome tests passed. The actual proof-server test generated and cryptographically verified a receipt proof, applied deployment and receipt transactions to a synthetic ledger, and checked the resulting commitment membership. Only fee balancing was disabled for that synthetic ledger. Node/indexer finalized-block lookup was checked on Preprod; no funded-wallet deployment or network receipt is claimed. The earlier Milestone A results below are historical.

Node 24.18.0 on macOS arm64: 12 Node tests passed; the 25,000-character synthetic scan benchmark reported p95 about 0.4 ms in Node on this machine. This does not establish browser p95 or cross-device performance. The small detector corpus reported precision/recall 1.0 for each declared category on its own fixtures only. Expand it with representative, approved synthetic cases before a pilot.

12 Chrome browser tests passed, including capture of all outgoing app requests during the full local workflow. The capture contained only same-origin asset GETs, no raw input or mappings, and no AI/model calls. Browser checks cover review gating, stale input, policy blocks, unavailable detectors, local expiry, safe text rendering, masked clipboard copying, connection failure, and all four screens at 320, 375, 414, 768, and 1440 px.
