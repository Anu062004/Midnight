// UTF-8 of this ordered JSON array is the canonical request envelope (v1).
// This SHA-256 commitment is private gateway metadata, not a Compact commitment.
export function envelopeBytes({ organizationId, userId, jobId, policyVersion, model, nonce, payload }) {
  return new TextEncoder().encode(JSON.stringify(['private-ai/request/v1', organizationId, userId, jobId, policyVersion, 'openai', model, nonce, payload]));
}
export async function requestCommitment(fields) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', envelopeBytes(fields)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
