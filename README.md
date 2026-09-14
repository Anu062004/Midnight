# Private AI Workspace

An implementation of [the product reference](PRIVATE_AI_PRODUCT_REFERENCE.md): local text redaction, authenticated organization policies, a controlled Gemini/OpenAI gateway, and a compiled Midnight receipt contract. This is a local development app. The contract and ZK proof path are tested locally; a Preprod deployment still requires a funded operator wallet.

## Run

Requires Node.js 24+, npm, and Compact compiler 0.31.1. See [Midnight setup](docs/MIDNIGHT.md) for the compiler and proof server.

```sh
npm ci
npm run contract:build
npm start
```

Open **http://127.0.0.1:3000**. For automatic server restarts, use `npm run dev`. `PORT=3001 npm start` changes the port.

1. Load the synthetic example and select **Scan text**.
2. Inspect findings and the exact outgoing preview.
3. Check the review box, then select **Try sample response**.
4. Toggle local restoration. Credentials, payment cards, SSNs, and IBANs stay masked; the copy button always copies the masked response.
5. Try category rules, custom terms, activity filters, and metadata export. **Clear session** removes text, mappings, rules, and activity. Sessions also expire after 15 minutes or on page exit.

**Connections → Check node connection** performs a real read-only check against Midnight Preprod. Scanning itself makes no API requests. The response exercise echoes the approved text locally; it does not call an AI model.

For live delivery, configure a provider in `.env` using `.env.example`, register in **Team & account**, then scan and review your outgoing text. Standard mode signs request evidence before sending. Strict mode prepares the request but blocks sending until **Anchor receipt with wallet → Verify receipt** confirms its commitment in finalized Preprod state. Deployment setup is in [docs/MIDNIGHT.md](docs/MIDNIGHT.md).

## Verification

```sh
npm ci
npm run contract:build
npm test
npm run test:browser
npm run midnight:proof-server
npm run test:proof
```

Browser tests use installed Google Chrome through Playwright (`channel: 'chrome'`). If Chrome is unavailable, install it or adjust `playwright.config.js` to an installed Playwright browser. Tests bind temporary localhost ports and use only synthetic content. They do not require a provider key or funded wallet.

- 47 Node checks cover scanner behavior, wallet integration, compiled contract authorization/replay, signatures, finalized evidence, gateway tenancy/CSRF, single dispatch and recovery.
- 15 Chrome checks cover the local workflow, account creation, reviewed live gateway delivery with a synthetic provider, strict blocking, clipboard masking, expiry, wallet discovery, and responsive views.
- A separate real proof-server check cryptographically verifies a receipt transaction and applies it to a synthetic ledger, with only fee balancing bypassed.
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

Known limitations: wallet connector tests use mocks; funded-wallet network deployment remains a manual check. Deployment and receipt calls are wired to the connector's balance and submit methods. The gateway generates proofs locally before returning transactions to the wallet. The configured wallet must support the `preprod` network.

## Boundaries

Raw original text and restoration maps remain in browser memory. Reviewed outgoing text reaches the authenticated gateway and selected provider. Published organization policies (including custom terms), accounts, and audit metadata persist in SQLite. Operator keys live in a restricted local file. No prompt/response bodies are persisted by the gateway. Clearing the local session does not delete organization audit records, clipboard contents, or downloads.

This scanner covers declared patterns, not all confidential meaning. Allowed categories and missed findings can remain in the outgoing text. Only the separate text composer is supported: no document parsing, image inspection, or third-party webpage protection.

**Remaining:** funded-wallet Preprod deployment validation, automatic operator transaction submission/batching, production identity/hosting/key management, and the reference's later document, extension, and agent workflows. Receipt confirmation proves that a commitment was recorded by the contract's authorized operator; it does not prove the scanner found every secret, encrypt the prompt, or establish provider deletion/training behavior.

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
