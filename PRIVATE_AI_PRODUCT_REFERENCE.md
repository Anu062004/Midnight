# Private AI Workspace — Product and Engineering Reference

Version: 1.0  
Date: 12 September 2026  
Status: Proposed specification; no implementation or deployment is implied.  
Initial blockchain target: Midnight Preprod.  
Product name: To be selected before public release.

## 1. Product definition

A privacy workspace that helps people use AI with confidential information. It scans content before delivery, replaces selected sensitive values locally, applies organization rules, and records verifiable evidence of authorized activity without publishing the underlying documents.

The product combines a local privacy interface, an organization policy service, a controlled model gateway, and a Midnight evidence layer. A browser extension and agent integrations extend coverage after the core workflow is reliable.

Proposed positioning:

> Use AI with confidential work. Control what leaves your device, approve who can use it, and verify the permission behind each protected request.

The first release should serve small professional teams. A later client-permission module can support agencies and consultancies that process documents on behalf of other companies.

## 2. Customer problem and intended outcomes

Employees paste customer details, internal documents, source code, financial information, and credentials into AI applications. Organizations need practical controls before disclosure, while employees need answers that remain useful after redaction.

Desired outcomes:

- Users can inspect exactly what will be sent to a model.
- Protected values remain local wherever the selected workflow promises local processing.
- Administrators can enforce versioned policies on requests through the controlled gateway.
- Sensitive content does not enter routine logs or public blockchain records.
- Reviewers can distinguish a local scan, a signed assertion, a verified proof, and confirmed settlement.
- Clients can eventually grant and revoke future access to defined documents and workflows.

## 3. Scope, priorities, and non-goals

Priority definitions: P0 is required for the initial controlled pilot; P1 follows after the core workflow passes acceptance; P2 requires customer validation.

| Capability | Priority | Initial boundary |
|---|---|---|
| Separate local text composer | P0 | Text entered outside a third-party AI webpage |
| Local scanning and redaction preview | P0 | Structured identifiers, supported secrets, configurable terms |
| Local answer restoration | P0 | Human display only; sensitive tokens stay masked by default |
| Hosted application and one model adapter | P0 | One controlled request path |
| Organization membership and authorization | P0 | Owner and member roles |
| Versioned organization policies | P0 | Block, redact, allow, and explicit exceptions |
| Evidence states and Midnight Preprod anchoring | P0 | Commitments with clearly stated verification meaning |
| Audit view | P0 | Tenant-scoped metadata; no prompt bodies |
| Browser extension | P1 | One website adapter plus a separate local composer |
| Richer local entity recognition | P1 | Explicit model readiness and supported languages |
| Safe agent integration | P1 | Gateway or host preprocessing; no plaintext restoration tool result |
| Client-issued document permissions | P1 | One document workflow and revocation |
| Text document extraction | P1 | Selected formats, size limits, local extraction |
| Additional AI providers | P1 | Reuse the established adapter interface |
| SSO and managed deployment | P1 | Based on pilot requirements |
| OCR, spreadsheets, additional platforms | P2 | Explicit support matrix |
| Production blockchain deployment | P2 | Separate readiness and deployment decision |

Non-goals for the first release:

- Training a proprietary language model or building a general AI chat platform.
- Supporting every browser, file format, AI website, and operating system.
- Executing an entire language model or general semantic detector inside a circuit.
- Launching a token, speculative rewards system, or data marketplace.
- Claiming universal leak prevention, automatic regulatory compliance, or provider-side deletion.
- Preventing activity on unmanaged devices or applications outside the installed enforcement boundary.

## 4. Personas and permissions

| Persona | Primary need | Authorized scope |
|---|---|---|
| Organization owner | Configure workspace and members | Own organization and policy administration |
| Member | Safely complete AI tasks | Assigned projects and approved providers |
| Reviewer | Inspect evidence and exceptions | Explicitly granted audit access |
| Client approver, P1 | Grant document use to a service provider | Documents and grants they control |
| Agent identity, P1 | Execute narrowly authorized requests | Scoped credentials, provider and action restrictions |

Every server operation must derive organization and actor identity from an authenticated session or verified credential. A supplied wallet address, organization ID, or source label is not authentication.

## 5. Primary user journeys

### 5.1 First use

1. User signs in and joins or creates an organization.
2. Owner selects an approved model provider and policy.
3. User sees where processing happens and which data can leave the device.
4. User runs a synthetic example before entering confidential information.
5. Blockchain setup is handled by the operator or administrator under the selected transaction model; normal users should not need to approve every routine request in a wallet.

### 5.2 Protected AI request

1. User enters text in the separate local composer.
2. Scanner identifies supported sensitive spans on the device.
3. Interface shows the original and proposed outgoing text, findings, and policy decision.
4. User resolves findings or requests an allowed exception.
5. Application freezes the approved outgoing payload and computes its commitment.
6. Gateway authenticates the user, validates policy and required evidence, and checks the actual payload commitment.
7. Gateway sends only the approved payload to the configured provider.
8. Model response is scanned for supported findings before local display restoration.
9. Local interface restores permitted placeholders for the human reader.
10. Evidence progresses through explicit states until settlement is confirmed or fails.

Editing the approved payload invalidates its prior authorization. Retries must not silently send it twice.

### 5.3 Browser-assisted request, P1

Two modes must be distinguished:

- Separate extension composer: user enters raw content in an extension-owned interface; only cleaned content is inserted into the AI webpage.
- Existing-page assist: extension scans content already entered into the AI webpage before the supported send action. This mode cannot promise that the webpage never accessed the original text.

File uploads must be blocked or clearly marked unsupported until their contents are inspected through a supported path. A successfully scanned text caption does not authorize an unscanned attachment.

### 5.4 Client-controlled document use, P1

1. Client registers a specific document version and identifies a recipient organization.
2. Client approves a supported workflow, provider configuration, and validity window.
3. Gateway requires a valid grant before releasing document content to that workflow.
4. Every request is bound to the grant, document version, policy version, and outgoing payload.
5. Client can inspect permitted evidence and revoke future access.
6. New access is denied after revocation becomes effective under the published freshness rule.

An approved workflow identifier constrains the application route. It does not prove the user's true intent or every downstream use of delivered information. Revocation does not retract information already delivered.

## 6. Functional requirements

### 6.1 Local scanner

| ID | Requirement | Acceptance condition |
|---|---|---|
| SC-01 | Detect supported email, phone, financial identifier, credential, and custom-term patterns | Published synthetic evaluation corpus reports results by category |
| SC-02 | Preserve text outside selected spans | Unicode and overlap fixtures produce expected output without unrelated deletion |
| SC-03 | Resolve overlapping findings deterministically | Repeated runs with the same engine and policy produce the same selected spans |
| SC-04 | Use consistent placeholders within a job | Repeated identical entities map consistently where supported |
| SC-05 | Record scanner and policy versions | Evidence identifies the versions associated with the decision |
| SC-06 | Keep raw inputs and mappings local in local-processing mode | Network inspection finds neither in outbound requests or telemetry |
| SC-07 | Report detector availability | A failed optional model never appears as a completed model scan |
| SC-08 | Enforce required detector availability | A request requiring an unavailable detector is blocked or escalated explicitly |
| SC-09 | Bound input size and execution time | Oversized inputs fail visibly without partial authorization |

Initial detection should use well-tested patterns and format validation where appropriate. Entity recognition is an enhancement, not a guarantee that all confidential meaning is detected. Document supported languages and categories.

Each finding contains a category, start/end offsets, detector identifier, severity, and optional confidence. Original span text must not enter central audit records. Confidence must not be fabricated for deterministic detectors.

### 6.2 Redaction and restoration

- Show an exact outgoing-text preview before first delivery or when policy requires review.
- Offer allow, redact, and block decisions only where the active policy permits them.
- Scope token maps to organization, user, and a random job identifier. Never use the cleaned text hash as the sole map key: different originals may produce identical cleaned text.
- Keep maps in memory by default; expire them on timeout, logout, or explicit clearing.
- If persistence is required later, define encryption, key ownership, retention, and recovery first.
- Restore permitted values only in the human-facing local display.
- Leave passwords, private keys, and credentials masked by default, including in copy/export actions.
- Outgoing conversation history must use sanitized content, never the restored display text.
- Treat model-generated tokens as untrusted and require matching job context before restoration.
- Explain that redaction can reduce answer quality; never present an estimate as a measured guarantee.

### 6.3 Policy management

Policy fields:

- Identifier, organization, version, activation time, and content commitment.
- Required detectors and supported input categories.
- Default action and category-specific actions.
- Allowed provider configurations and model choices.
- Exception approvers and expiration rules.
- Evidence mode and behavior during outages.
- Maximum payload size and audit retention configuration.

Policy versions are immutable after publication. Updates create a new version. The server resolves which version is effective; a client cannot select an obsolete permissive policy. In-flight policy changes require revalidation before delivery.

### 6.4 Model gateway

- Authenticate all requests and authorize actor, organization, project, and provider.
- Check the bytes actually forwarded, including supported conversation history and attachments, against the approved envelope.
- Own the provider request path; the agent or browser cannot substitute a destination after approval.
- Keep provider credentials out of prompts, URLs, browser synchronization, and logs.
- Restrict custom destinations to administrator-approved configurations; protect against access to internal network endpoints.
- Apply per-tenant quotas, payload limits, timeouts, and safe retry rules.
- Distinguish refusal before delivery from uncertain delivery after a provider timeout.
- Preserve job and provider request identifiers without persisting prompt bodies by default.
- Support streaming only after the non-streaming path has correct authorization and error handling.

The gateway necessarily receives the cleaned payload. The provider receives the approved outgoing payload. Raw information missed by detection may remain in that payload; the UI must avoid an absolute privacy guarantee.

### 6.5 Browser extension, P1

- Use a minimal permission set and an explicit supported-domain list.
- Provide a separate local composer as the stronger privacy mode.
- Show active, disabled, unsupported-page, scanning, blocked, and connection-error states.
- Make disabling behave predictably; centrally mandated configurations cannot be overridden through ordinary options.
- Fetch authenticated organization policy instead of using fixed defaults.
- Handle supported click, keyboard, input-method, navigation, and page-update cases.
- Prevent double sends and invalidate results if input changes during scanning.
- Verify that the exact rewritten payload is the one released through the supported path.
- Keep credentials out of browser sync storage; use appropriately scoped authentication.
- Define token-map lifetime across extension worker restarts and clear state on logout.
- Provide a redaction preview rather than relying solely on a generic confirmation dialog.
- Include installation, update, permission, and troubleshooting documentation.
- Prepare real icons and distribution assets after functionality passes browser acceptance tests.

Website adapters require maintenance. Page integration is not equivalent to a universal network enforcement boundary.

### 6.6 Agent integration, P1

- Prefer preprocessing in the host or an enforced gateway before raw data is added to a cloud model context.
- A model-callable scan tool cannot undo disclosure that occurred before the tool was called.
- Expose narrowly scoped operations such as prepare protected input, submit approved job, and inspect job status.
- Never return restored confidential text as a standard model-visible tool result.
- Use per-agent credentials with organization, project, provider, action, and expiration limits.
- Record authorization decisions and bind them to the actual submitted job.
- Deny required-policy jobs when policy or authorization cannot be established.
- Do not expose unrestricted filesystem access or arbitrary URL fetching through the integration.

### 6.7 Audit and administration

- Tenant-scoped activity list with filters for actor, policy, outcome, provider, time, and evidence state.
- Receipt detail showing exactly what was checked, what was asserted, and what remains unverified.
- Exception queue with approver, justification, validity window, and immutable decision history.
- Organization membership management and immediate credential/session revocation.
- Metadata export with access logging and no raw-content export by default.
- Distinct counts for detected findings, blocked requests, delivered requests, signed records, and settled receipts.
- Never label every detected match as a confirmed prevented leak or every stored record as a generated proof.

## 7. Midnight architecture and proof boundaries

Target Midnight Preprod for development and integration testing. Obtain current supported tooling, network endpoints, and wallet/proving interfaces from official documentation when implementation begins. Do not treat this specification as a version compatibility matrix.

Suggested separation:

```text
Local composer -> local scan -> sanitized request -> controlled gateway -> AI provider
                       |                               |
                 local token map                 policy and evidence checks
                       |                               |
               human-only restoration        evidence service -> Midnight Preprod
```

### 7.1 What each evidence level means

| Evidence | Supported statement | Unsupported inference |
|---|---|---|
| Local scan result | This client reports its scanner result | Independent verification of scanner execution |
| Signed detector receipt | An identified signer asserted a result for bound input and versions | The signer is infallible or all sensitive meaning was detected |
| Hash commitment | A later disclosed value can be checked against its commitment | The value is safe, true, or authorized |
| Circuit-verified permission | Encoded authorization conditions were satisfied against checked state | All downstream activity complied with human intent |
| Confirmed anchor | The commitment was recorded in the confirmed ledger state | Provider receipt, deletion, training exclusion, or successful redaction |

The initial anchoring feature must be described as evidence recording. Do not call it proof of scanner execution unless the implemented verifier establishes that exact relationship.

### 7.2 Proposed contract responsibilities

Initial contract: accept versioned evidence commitments, enforce any implemented submitter authorization, prevent duplicate receipt consumption where required, and expose verification-compatible state.

Permission extension: register authorized issuers, commit grants and policy versions, update revocation state, and check the supported grant predicates for a request. Grant authenticity must come from verified issuer authority; possession of arbitrary private witness data is insufficient.

Potential predicates include recipient membership, document-version match, approved workflow/provider membership, validity interval, and non-revocation against a defined state. Each predicate requires an implementation and negative test before being advertised.

### 7.3 Private and public information

Keep original text, token maps, document bodies, credentials, client names, and detailed findings off the public ledger. Keep reviewer-specific evidence in encrypted or access-controlled storage with explicit disclosure permissions.

Potential public fields are a schema version, randomized evidence commitment or batch root, contract-managed replay protection, and the minimum verification state necessary. Public timing and transaction metadata remain part of the privacy review.

Use a reviewed commitment construction with fresh randomness where low-entropy values or repeated inputs could otherwise be guessed or correlated. Do not assume that hashing a short name or predictable prompt hides it. Preserve randomness privately for authorized later verification.

Specify byte encoding, field order, domain separation, and algorithm identifiers. Local and circuit commitments must use compatible constructions with cross-runtime test vectors, or be explicitly separate fields with separate meanings.

### 7.4 Settlement modes

- Standard mode: validate current authorization before delivery, sign the evidence record, and anchor evidence asynchronously. Display pending settlement honestly. This mode trusts the selected signer and gateway for their assertions.
- Strict mode: require the configured verified evidence or confirmed grant consumption before delivery. Deny sending if the required state is unavailable.

Choose defaults per workflow. Never silently downgrade strict mode during a wallet, prover, indexer, or network outage. Batch anchoring reduces transaction frequency but does not provide pre-send settlement or automatic completeness of the audit trail.

Track `local_only`, `signed`, `queued`, `submitted`, `confirmed`, `failed`, and `unknown` evidence states. A transaction ID supplied by a caller is only a hint until verified against the configured network, contract, commitment, and confirmation policy.

## 8. Data model

| Entity | Essential fields | Storage boundary |
|---|---|---|
| Organization | ID, name, configuration | Authorized application database |
| Membership | User, organization, role, status | Authorized application database |
| Provider configuration | Provider, approved endpoint/model, credential reference | Server configuration and secret store |
| Policy version | ID, organization, version, rules, commitment, activation | Authorized application database |
| Local job state | Random job ID, raw input, token map, expiration | Device memory by default |
| Job metadata | Organization, actor, policy, provider, state, timestamps | Authorized application database |
| Evidence record | Job, schema, payload commitment, signer/proof details, settlement state | Authorized evidence store |
| Document version, P1 | Owner, version commitment, controlled storage reference | Client-controlled or explicitly approved storage |
| Grant, P1 | Issuer, recipient, document, workflow, provider, validity, revocation | Private grant store plus necessary verification state |
| Exception | Job/policy reference, approver, reason, expiration | Authorized application database |
| Agent credential, P1 | Hashed credential reference, scopes, expiration, revocation | Authorized application database and secret store |

Use composite organization scoping in queries and authorization checks. A globally unique ID does not replace access control. Audit retention must be configurable; public anchors cannot be treated as deletable application records.

## 9. Proposed API contract

Route names are illustrative. Prefer a small API that supports the actual workflow.

| Method and path | Purpose | Important constraint |
|---|---|---|
| GET /api/session | Current user and organization context | Session-derived identity |
| GET /api/policy/effective | Resolve active policy | Authenticated tenant and project scope |
| POST /api/jobs | Create job metadata and approved envelope | No raw original text or token map |
| POST /api/jobs/:id/send | Validate and deliver sanitized payload | Payload binding, policy revalidation, idempotency |
| GET /api/jobs/:id | Delivery and evidence status | Requester authorization |
| GET /api/receipts/:id | Authorized receipt details | Meaning and verification state explicit |
| POST /api/exceptions | Request a permitted exception | No self-approval |
| POST /api/policies | Publish policy version | Administrator authorization |
| POST /api/grants | Issue document permission, P1 | Verified issuer control |
| POST /api/grants/:id/revoke | Revoke future access, P1 | Issuer authorization and published freshness semantics |

Use runtime schema validation, stable error codes, request size limits, and rate limits. Logs must redact authorization headers, keys, payload bodies, and exception text where sensitive.

Suggested error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `POLICY_BLOCKED`, `DETECTOR_UNAVAILABLE`, `PAYLOAD_CHANGED`, `GRANT_EXPIRED`, `GRANT_REVOKED`, `EVIDENCE_PENDING`, `PROVIDER_UNAVAILABLE`, and `DELIVERY_UNKNOWN`.

## 10. Screens and experience requirements

| Screen | Essential content |
|---|---|
| Introduction | Specific supported workflow, privacy boundaries, synthetic demo |
| Onboarding | Organization setup, approved provider, starter policy |
| Workspace | Local composer, findings, outgoing preview, decision, response |
| Policies | Version history, rules, publication, detector availability |
| Activity | Request outcomes and evidence states with useful filtering |
| Receipt detail | Bound versions, verification meaning, transaction status |
| Members | Roles, invitations, revocation |
| Integrations | Accurate availability, supported versions, setup instructions |
| Client permissions, P1 | Document versions, approvals, expiration, revocation |
| Extension options, P1 | Authentication, organization, status, supported modes |

Use plain language. Hide wallet, proving, and transaction details from routine work unless they affect a user decision. Provide keyboard navigation, labeled controls, readable contrast, and status messages that do not depend on color alone.

Avoid labels such as “100% safe.” Prefer “3 supported findings redacted,” “Policy approved,” and “Evidence awaiting confirmation.”

## 11. Security and reliability requirements

- Raw data must never appear in analytics, crash reports, URLs, central audit fields, or public commitments in plaintext.
- Authentication and authorization must cover reads, writes, exports, policy changes, and evidence submission.
- Verify wallet ownership with a fresh signed challenge if wallets are used for identity; bind sessions to the verified result.
- Separate demo, development, Preprod, and production records. Demo receipts cannot authorize real provider calls.
- Enforce server-side policy regardless of client switches or source labels.
- Treat malicious prompts, webpages, model output, document content, and tool results as untrusted data.
- Restrict provider destinations and prevent credential forwarding to unexpected hosts.
- Define idempotency and concurrent-send behavior before enabling retries.
- Preserve delivery uncertainty after a network timeout; never claim “nothing was sent” without evidence.
- Keep external provider failure separate from settlement failure.
- Restrict proof-service access and document what private witness information a selected proving architecture exposes to its operator.
- Persist essential evidence durably before relying on it for recovery; ephemeral server storage is insufficient.
- Restrict administrative secrets to the server and rotate compromised credentials.
- Publish the enforcement boundary: controlled application, managed host, website adapter, or other explicitly supported surface.

## 12. Performance and quality targets

These are proposed acceptance targets, not measured product claims. Ratify them on named reference hardware during the first milestone.

| Metric | Proposed pilot target |
|---|---|
| Text-only input limit | 25,000 characters per initial request |
| Pattern scan latency | p95 below 300 ms at the input limit on reference hardware |
| Gateway overhead | p95 below 500 ms excluding provider time and strict settlement |
| Detector evaluation | Precision and recall reported separately per supported category |
| Critical synthetic secret cases | All declared release-blocking fixtures detected or blocked |
| Tenant isolation | No unauthorized reads/writes in the defined isolation test suite |
| Local-processing boundary | No raw input or token maps in inspected network requests |
| Evidence accuracy | No failed/pending transaction displayed as confirmed |
| Revocation freshness | A published maximum age; stale state blocks protected grant requests |

Track answer usefulness with paired tasks before and after redaction. Passing a finite test corpus does not establish perfect detection on arbitrary real-world inputs.

## 13. Acceptance test scenarios

1. Email and supported secret are redacted; unrelated text remains unchanged.
2. Repeated entities receive stable within-job placeholders.
3. Two jobs with identical sanitized text cannot access each other's original values.
4. Unicode, overlapping spans, long input, and empty input behave deterministically.
5. Required detector failure blocks sending; optional fallback is labeled clearly.
6. Changing a single outgoing byte after approval forces revalidation.
7. Requests without authenticated membership cannot submit jobs or read evidence.
8. A forged source label, wallet address, or transaction ID does not grant access.
9. Outdated policy versions cannot bypass the current policy.
10. Double-clicks and retry requests do not create duplicate model deliveries under the documented idempotency boundary.
11. Provider timeout after submission produces an uncertain-delivery state where appropriate.
12. Raw content and mappings are absent from browser network captures and service logs in local-processing mode.
13. Restored response values never re-enter model-bound history.
14. Strict evidence mode blocks delivery during settlement outages.
15. Background anchoring failure is visible without falsifying the provider delivery result.
16. Demo evidence cannot authorize a live request.
17. Grant expiration, revocation, wrong recipient, wrong document version, and wrong provider are rejected, P1.
18. Extension edits during a scan invalidate the result; disabled mode behaves as documented, P1.
19. Unsupported attachments are not reported as inspected, P1.
20. Cross-runtime commitment vectors match the documented construction; mutation invalidates verification.

Use synthetic fixtures and approved test accounts. Add browser integration tests for supported adapters and local contract tests for each implemented predicate. Confirm the complete receipt path on Preprod before calling it a live integration.

## 14. Delivery milestones

### Milestone A — local privacy workflow

Deliver the separate composer, deterministic scanner, preview, local map lifecycle, and human-only restoration. Exit when supported synthetic cases pass and network inspection confirms the stated local boundary.

### Milestone B — controlled team pilot

Deliver authenticated organizations, versioned policies, one provider adapter, controlled sending, idempotency, and metadata audit views. Exit when unauthorized, modified-payload, and cross-tenant cases are rejected.

### Milestone C — honest evidence on Midnight Preprod

Deliver the commitment schema, initial contract, verification service, explicit evidence states, and recovery behavior. Exit when actual ledger confirmation is verified and the UI describes only what the implementation establishes.

### Milestone D — browser and agent coverage

Deliver one maintained website adapter and one safe agent/host integration. Exit when raw-content boundaries, input changes, retries, unavailable services, and unsupported attachments behave as specified.

### Milestone E — client permissions

Deliver one document type, authenticated issuer approval, recipient restrictions, expiration, revocation, and client evidence review. Exit when a real pilot customer completes an approved document workflow and negative grant cases fail.

### Milestone F — operational release

Deliver required account integrations, monitoring, key management, support materials, distribution assets, and incident recovery checks. Production blockchain deployment is a separate milestone after network/tooling compatibility and contract review are established.

Do not assign calendar estimates until team size, proving architecture, supported document formats, and pilot constraints are known.

## 15. Differentiation and commercial hypotheses

Potential initial customer: an agency or consultancy whose client requires approval before confidential documents enter AI tools.

Distinctive product elements:

- Client owns the permission decision for their document versions.
- Agency requests are bound to approved workflows and provider configurations.
- Revocation blocks future controlled access with explicit freshness guarantees.
- Clients receive verifiable evidence without public document disclosure.
- Local redaction helps preserve useful AI workflows when full disclosure is unnecessary.

These are hypotheses to test. The broad privacy and authorization categories are not assumed to be unique.

Suggested commercial structure: organization subscription covering protected workspaces and usage, with enterprise identity and managed deployment priced after demand is established. Do not invent pricing before measuring service cost and willingness to pay. Avoid charging per detected secret because it does not map cleanly to customer value.

Validate with five prospective teams: inspect the last blocked or delayed confidential AI workflow, identify its approver, test the proposed permission process, and seek two narrowly scoped pilots. Do not build a marketplace or many connectors before this evidence exists.

## 16. Implementation decisions still required

- Product name, branding, and first customer segment.
- Exact supported identifier types and languages.
- First provider and credential ownership model.
- Default evidence mode and who operates the transaction signer.
- Proving location and private-witness trust boundary.
- Commitment construction and canonical request envelope.
- First browser adapter and document type.
- Identity provider, membership invitation model, and session lifetime.
- Retention defaults and approved evidence-disclosure process.
- Revocation freshness, in-flight request handling, and any grant usage limits.
- Detector benchmark targets and named reference hardware.

Recommended starting point: one local composer, one provider, one organization policy model, and accurately labeled Midnight evidence. Extend to client permissions and integrations once that path is reliable.

## 17. Definition of done

A capability is complete only when it is implemented, has passing relevant acceptance tests, handles its documented failures, and has accurate user-facing status. A UI card, configuration placeholder, stored hash, or transaction identifier alone does not establish a working integration.

The pilot is ready when a user can complete the protected request path, an administrator can enforce its policy, a reviewer can interpret its evidence correctly, and boundary tests demonstrate the advertised protections for supported workflows.

## 18. Technical reference starting points

- [Midnight official site](https://midnight.network/) — network and ecosystem information.
- [Midnight documentation](https://docs.midnight.network/) — verify current Compact, SDK, network, and proving interfaces before implementation.
- [Midnight FAQ](https://midnight.network/faq) — public/private state and disclosure model.

This document describes a proposed product architecture. Official network capabilities do not establish that the application's detectors, gateway, permissions, or proofs have been implemented correctly.
