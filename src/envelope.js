// UTF-8 of this ordered JSON array is the canonical request envelope (v1).
// The contract stores this digest as opaque bytes; it does not recompute SHA-256.
export function envelopeBytes({ organizationId, userId, jobId, policyVersion, providerId = 'openai', model, nonce, payload }) {
  return new TextEncoder().encode(JSON.stringify(['private-ai/request/v1', organizationId, userId, jobId, policyVersion, providerId, model, nonce, payload]));
}
export async function requestCommitment(fields) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', envelopeBytes(fields)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
