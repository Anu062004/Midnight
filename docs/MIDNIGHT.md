# Midnight receipts

Implemented and locally validated on 14 September 2026. No Preprod contract address or network deployment is claimed.

## Run and deploy

1. Install Node.js 24+ and the official [Compact toolchain](https://docs.midnight.network/getting-started/installation). Install compiler **0.31.1** with `compact update 0.31.1`. On this workspace, a verified Apple Silicon tool manager is already installed under `.tools/`; `npm run contract:build` discovers it automatically. Other machines use `compact` on PATH or `COMPACT_BIN`.
2. Run `npm ci`, then `npm run contract:build`. This generates JavaScript, ZKIR, and proving/verifying keys in `contracts/managed/receipts/`. Generated files are ignored by version control and must be built before tests or deployment. The compiler version is pinned in `scripts/compile-contract.mjs`.
3. Start Docker, then run `npm run midnight:proof-server`. The pinned 8.1.0 proof server listens only on `127.0.0.1:6300`. Run `npm run test:proof` for the synthetic deployment, real proof, cryptographic verification, and ledger-application check. This test bypasses fee balancing only; it neither submits a network transaction nor uses a funded wallet.
4. Configure a provider using `.env.example` and run `npm start`. Existing `.env` values are never overwritten by setup. Visit `http://127.0.0.1:3000`, register in **Team & account**, and copy **Your user ID**.
5. Put that ID in `MIDNIGHT_OPERATOR_USER_ID` in `.env`, then restart the server. Deployment requires that exact authenticated account and the organization owner role. Merely registering an owner or supplying a wallet address never grants operator permission. Email addresses are not used for operator authorization because this local app does not verify them.
6. Connect a compatible wallet on **Preprod**, with NIGHT registered for DUST generation and enough DUST for transactions. See [wallet funding](https://docs.midnight.network/guides/acquire-tokens). In **Connections**, select **Deploy contract**, approve balancing/submission in the wallet, then select **Check deployment** after settlement. The server verifies its own generated contract address, operator authority, schema, and compiled verifier key against finalized ledger state.
7. Scan and review a request. **Send to AI** prepares its signed evidence. In standard mode it also delivers immediately. In strict mode, delivery stays blocked: select **Anchor receipt with wallet**, approve the wallet transaction, select **Verify receipt**, then select **Send to AI** again once confirmed. Current policy and exact outgoing payload are rechecked immediately before dispatch.

Every receipt currently needs a wallet action. This is a working development transaction flow; the automatic funded operator relayer and batching described in the product reference are not implemented. Standard receipts remain signed but unanchored until the user submits them. Do not describe all standard requests as confirmed on-chain.

## Contract and privacy boundary

`contracts/receipts.compact` has an immutable schema version (1), an operator commitment, and a set of recorded 32-byte commitments. `record` proves knowledge of the operator secret and rejects duplicate commitments. The private witness supplies only the operator secret. No prompt, token map, policy text, account ID, or finding is passed to the circuit or proof server.

The operator commitment is Compact `persistentHash<Vector<2, Bytes<32>>>` over `[pad(32, "private-ai:operator:v1"), secret]`. This is distinct from the request digest below. `publicKey` is a pure off-chain helper, not an unauthenticated ledger mutation circuit.

The request commitment is **SHA-256** of UTF-8 bytes of this ordered JSON array, with no whitespace outside strings:

```text
["private-ai/request/v1", organizationId, userId, jobId, policyVersion,
 providerId, model, nonce, outgoingPayload]
```

IDs, model, provider, nonce and payload are strings; policyVersion is an integer. The browser generates a fresh 32-byte random nonce encoded as 64 lowercase hex characters. The gateway recomputes the digest using authenticated organization/actor IDs and its configured provider. The contract accepts the digest as opaque bytes; it does not reimplement SHA-256 or prove that redaction ran. Compact and JavaScript hash functions are not claimed to be interchangeable. Unit tests bind every envelope field and include a fixed Compact operator vector.

Public chain data exposes the commitment, authority, schema, timing, and normal transaction metadata. Nonce and envelope metadata stay in authenticated gateway storage; the prompt body itself is not persisted. Low-entropy prompts are protected from public guessing by the private random nonce in the normal browser flow. An authorized reviewer needs the original envelope and nonce to recompute a digest later.

Local redaction is not encryption. The provider sees the approved outgoing text, including any intentionally allowed or missed confidential content. The contract establishes an authorized receipt, not confidentiality of everything the user typed or proof of provider behavior.

## Signing, proving and confirmation

`midnight.mjs` pins Midnight.js 4.1.1, Compact runtime 0.16.0, compiler 0.31.1, and proof server 8.1.0, following the [compatibility matrix](https://docs.midnight.network/relnotes/support-matrix). Imports use Midnight.js protocol exports to avoid mixing incompatible WASM types.

The server creates `data/midnight-operator.json` with exclusive creation and mode 0600, containing a random operator secret and contract maintenance key. The directory is mode 0700 when created. The key file is access controlled, **not encrypted at rest**. It and SQLite are ignored by version control and excluded from HTTP assets. Keep a secure backup: deleting/replacing the operator key breaks access to the existing contract. Production secret storage/rotation requires an operator key-management design. Contract maintenance capability remains with this key; the deployed verifier is checked again on confirmation.

An Ed25519 signing seed is SHA-256 of UTF-8 `private-ai:attestation:v1` followed by the operator's 32 secret bytes. The signed message is UTF-8 `private-ai:receipt:v1:preprod:<lowercase commitment hex>`. Exported attestations include signature (hex), algorithm, and DER/SPKI public key (hex). Reviewers must pin a trusted operator public key; accepting a public key from an arbitrary receipt alone is not authentication. The authenticated contract-status endpoint also exposes the operator's attestation key.

Unproven SDK transactions and private transcripts remain inside the server. Only proven, unsealed transactions go to the wallet for fee balancing and submission. The proof service is fixed to loopback and never accepts a browser-supplied URL. Normal browser assets require no SDK bundle or remote CSP exceptions.

Confirmation obtains the chain identity and finalized head from the fixed Preprod node, queries the fixed Preprod indexer **at that block hash**, compares the compiled `record` verifier key, checks authority/schema, and tests membership of the exact job commitment. A transaction hash supplied by a user never establishes confirmation. The verifier trusts those configured node/indexer services; it is not a light client.

## Evidence and recovery

| State | Meaning |
| --- | --- |
| `signed` | Gateway signed its validated request digest; no ledger confirmation |
| `queued` | Proof is being prepared or a proven transaction awaits wallet submission |
| `submitted` | Wallet reports submission; still not independently confirmed |
| `confirmed` | Expected receipt found in the verified finalized contract state |
| `unknown` | A previous proof/preparation step was interrupted or failed; inspect before retrying |
| `not_configured` | No signing/contract service; live delivery is blocked |

Local-only scans stay separate from gateway jobs. Strict sending queries finalized evidence again and fails closed on node/indexer errors, missing receipts, unexpected contracts, changed policy, stale approval, or revoked sessions. Standard sending requires signed evidence but does not wait for settlement.

SQLite retains proven transactions for wallet retry, signatures, job IDs, commitments, and confirmation blocks. A prepared deployment is reused rather than creating a new contract after a rejected wallet popup. Confirmed transaction blobs are removed. A crash while proving leaves `unknown`; an interrupted deployment with no address is released on restart. There is one gateway process/prover at a time. Cached transactions can expire; replacing an expired pending deployment requires operator reconciliation against the saved address before resetting its database record. There is no automatic redeployment or blind provider resend.

Delivery has a separate state machine: `prepared → sending → delivered/rejected/unknown`. A durable compare-and-set claims the job before the provider call. Restart converts in-flight sending to unknown, and that job cannot send again. Metadata retention deletes old evidence/jobs and preserves consumed-job tombstones to prevent resurrection. Clearing the browser only clears local text/maps/activity.

## Validation

```sh
npm run contract:build
npm test
npm run test:browser
npm run midnight:proof-server
npm run test:proof
```

Tests cover unauthorized circuit calls, replay rejection, exact commitment binding, signatures, wrong-network/authority/verifier rejection, finalized-block query pinning, strict outages and forged submission hints, tenant isolation, CSRF, concurrent dispatch, and restart recovery. Browser tests exercise real local gateway routes using a synthetic provider; they do not make paid AI calls. The proof test uses the actual proof server and ledger cryptographic verifier with synthetic state. Funded-wallet balancing and network deployment/settlement are not yet validated.

Official references: [using contracts from JavaScript](https://docs.midnight.network/guides/compact-javascript-runtime), [deployment/provider pipeline](https://docs.midnight.network/guides/deploy-and-operate), [writing a contract](https://docs.midnight.network/compact/reference/writing), [network endpoints](https://docs.midnight.network/guides/networks-and-environments), and [node responsibilities](https://docs.midnight.network/nodes).
