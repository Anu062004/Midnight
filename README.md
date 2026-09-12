# Private AI Workspace

The first implementation of [the product reference](PRIVATE_AI_PRODUCT_REFERENCE.md): a working local text privacy workflow (Milestone A), with a read-only Midnight Preprod node check. This is a local development app, not a hosted team pilot.

## Run

Requires Node.js 22 or newer. There are no runtime package dependencies.

```sh
npm start
```

Open **http://127.0.0.1:3000**. For automatic server restarts, use `npm run dev`. `PORT=3001 npm start` changes the port.

1. Load the synthetic example and select **Scan text**.
2. Inspect findings and the exact outgoing preview.
3. Check the review box, then select **Try sample response**.
4. Toggle local restoration. Credentials and payment cards stay masked; the copy button always copies the masked response.
5. Try category rules, custom terms, activity filters, and metadata export. **Clear session** removes text, mappings, rules, and activity. Sessions also expire after 15 minutes or on page exit.

**Connections → Check node connection** performs a real read-only check against Midnight Preprod. Scanning itself makes no API requests. The response exercise echoes the approved text locally; it does not call an AI model.

## Verification

```sh
npm ci
npm test
npm run test:browser
```

Browser tests use installed Google Chrome through Playwright (`channel: 'chrome'`). If Chrome is unavailable, install it or adjust `playwright.config.js` to an installed Playwright browser. Tests bind temporary localhost ports and use only synthetic content. They do not require a provider key or funded wallet.

- 40 Node checks: detector corpus, Unicode, overlapping spans, local job isolation, exact preview binding, policy blocks, expiry, response scanning, server boundary, RPC validation, plus 28 wallet-adapter checks (discovery, versioning, connect/reject/mismatch, config/balances, disconnect, persistence, proving/transaction guards, official-package parity).
- 13 Chrome checks: the full local workflow and network boundary, clipboard masking, edit races, policy failures, expiration, unsafe HTML rendering, connection failure, wallet empty-state, and all four views at 320 / 375 / 414 / 768 / 1440 px.
- The detector test prints precision and recall by category **on its small published synthetic corpus**, plus a local scan timing sample. These are regression checks, not general accuracy claims.

## Midnight Wallet Integration

UI components (`useMidnightWallet()` equivalent) → wallet store → `MidnightWalletAdapter` → Midnight DApp Connector API → installed wallet (Lace, 1AM, future wallets) → Midnight Network. The app never touches `window.midnight` except through the adapter (`src/wallet/`).

- Official connector: `@midnight-ntwrk/dapp-connector-api@4.0.1` (exact) plus `@midnight-ntwrk/midnight-js-network-id@4.1.1` for network-id semantics. Both are 4.x — no mixed SDK generations. The browser bundle stays dependency-free (no bundler here); the packages back JSDoc types and Node parity tests. `midnight-js-dapp-connector-proof-provider` and `@midnight-ntwrk/ledger` are intentionally not installed: this build has no Compact contracts, and wallet-side proving goes through the connector's native `getProvingProvider` (feature-detected).
- Discovery: `discoverWallets()` scans `Object.values(window.midnight ?? {})` and keeps entries matching the `InitialAPI` shape (`name`, `apiVersion`, `connect()`). No wallet ids are hardcoded, so any standards-compatible wallet appears automatically with zero code changes.
- Supported connector range: `^4.0.0`. Incompatible wallets show disabled in the modal with their version.
- Network: `preprod`, configured once at startup (`configureNetwork`, mirroring official `setNetworkId`). After `connect()`, the adapter checks `getConnectionStatus()` and aborts with expected-vs-actual ids on mismatch.
- Usage: click Connect in the top bar or Connections view, pick a wallet, approve in the wallet. Disconnect is application-level (the v4 connector exposes no wallet `disconnect`): references, addresses, balances, and cached state are cleared. Only the selected wallet id is kept in localStorage — never keys or secrets — and reloads restore the selection without auto-connecting (no surprise wallet popups).
- Proving/transactions: `getWalletProvingProvider()` (absent on wallets like Lace — use another proving modality then), `balanceTransaction()`, `submitTransaction()`. Malformed transactions are refused client-side; balances stay `bigint`.
- Security: wallet `name`/`icon` are untrusted — names render via `textContent`, icons only for `data:image/*` or same-origin URLs (remote icons would violate the `img-src 'self'` CSP anyway). No seed phrases, private keys, or passwords are ever requested, stored, or logged.
- Manual checklist: install a compatible wallet → start app → Connect → wallet appears → install a second wallet → both appear → connect A → approve → network/address shown → disconnect → connect B → same flow → refresh → selection restored, still disconnected → reject a connection → clean “rejected in your wallet” message.

Known limitations: no real-wallet CI coverage (unit tests mock `window.midnight`); contract calls are not wired yet — the adapter exposes the connected API for that next step; network ids other than `mainnet` are wallet-defined, so `preprod` assumes a wallet that defines it (Lace/1AM do).

## Boundaries

Raw text, restoration maps, custom terms, and local activity remain in browser memory. No analytics, browser persistence, remote fonts, or prompt-body logs are used. Copying or exporting is an explicit user action; exported metadata contains no input text or mappings. Clearing the app cannot retract clipboard contents, downloads, or values manually copied from the restored display.

This scanner covers declared patterns, not all confidential meaning. Allowed categories and missed findings can remain in the outgoing text. Only the separate text composer is supported: no document parsing, image inspection, or third-party webpage protection.

**Not implemented:** sign-in, organizations, durable audit storage, server-enforced policies, live AI delivery, Compact contracts, signed receipts, proving, or evidence settlement. All local records are labelled `local_only` and `not_sent`; they cannot authorize any provider or blockchain operation.

See [implementation notes and Midnight sources](docs/IMPLEMENTATION.md) for the architecture and the next milestones. The original specification remains unchanged. The working name “Private AI” is provisional.

Fonts are self-hosted Latin subsets of Space Grotesk and Inter, distributed under the SIL Open Font License; license texts are in `assets/fonts/`.

## Website

`site/` is a separate Next.js 16 + TypeScript + Tailwind v4 marketing site for the AI Privacy Firewall (“Bulkhead”). It is independent of the workspace app above — separate `package.json`, separate port.

```sh
npm --prefix site install
npm --prefix site run dev     # http://127.0.0.1:3001
npm --prefix site run lint
npm --prefix site run typecheck
npm --prefix site run build
```

See `site/README.md` for routes, design system, and QA notes.
