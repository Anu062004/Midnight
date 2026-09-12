export const SCANNER_VERSION = 'patterns-1.0.0';
export const LIMIT = 25_000;
export const TTL = 15 * 60 * 1000;
export const CATEGORIES = Object.freeze({ email: 'Email address', phone: 'Phone number', card: 'Payment card', credential: 'Credential', custom: 'Custom term' });
export const DEFAULT_POLICY = Object.freeze({
  id: 'local-starter', version: 1, maxLength: LIMIT,
  requiredDetectors: Object.freeze(['patterns']),
  actions: Object.freeze({ email: 'redact', phone: 'redact', card: 'redact', credential: 'redact', custom: 'redact' }),
  customTerms: Object.freeze([]),
});
export class PrivacyError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function validatePolicy(policy) {
  if (!policy || policy.id !== 'local-starter' || !Number.isSafeInteger(policy.version) || policy.version < 1 ||
      !Number.isSafeInteger(policy.maxLength) || policy.maxLength < 1 || policy.maxLength > LIMIT ||
      !Array.isArray(policy.requiredDetectors) || policy.requiredDetectors.some(d => typeof d !== 'string') ||
      !Array.isArray(policy.customTerms) || policy.customTerms.length > 50 ||
      policy.customTerms.some(t => typeof t !== 'string' || !t.trim() || t.length > 100) ||
      Object.keys(CATEGORIES).some(c => !['allow', 'redact', 'block'].includes(policy.actions?.[c])) ||
      policy.actions.credential === 'allow') {
    throw new PrivacyError('INVALID_POLICY', 'Use supported rules and up to 50 custom terms of 100 characters each. Credentials cannot be allowed.');
  }
}
function luhn(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = digits.length - 1, double = false; i >= 0; i--, double = !double) {
    let n = Number(digits[i]);
    if (double) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
    sum += n;
  }
  return sum % 10 === 0;
}
const detectors = [
  ['credential', 'private-key', /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----|$)/g],
  ['credential', 'key-prefix', /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/g],
  ['credential', 'assigned-secret', /\b(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*(?:"[^"\r\n]+"|'[^'\r\n]+'|[^\s,;]{4,})/gi],
  ['email', 'email-ascii', /(?<![A-Za-z0-9.!#$%&'*+/=?^_`{|}~-])[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+\b/g],
  ['card', 'card-luhn', /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g, luhn],
  ['phone', 'phone-international', /(?<![\w+])\+[1-9]\d{0,2}[ .-]?(?:\(\d{1,4}\)[ .-]?)?\d(?:[ .-]?\d){6,13}(?!\d)/g, v => { const n = v.replace(/\D/g, '').length; return n >= 8 && n <= 15; }],
  ['phone', 'phone-nanp', /(?<!\d)(?:\+?1[ .-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[ .-][2-9]\d{2}[ .-]\d{4}(?!\d)/g],
];
export function scan(text, policy = DEFAULT_POLICY, { allowPlaceholders = false } = {}) {
  validatePolicy(policy);
  if (typeof text !== 'string' || !text.trim()) throw new PrivacyError('EMPTY_INPUT', 'Add some text before scanning.');
  if (text.length > policy.maxLength) throw new PrivacyError('INPUT_TOO_LARGE', `Keep your text within ${policy.maxLength.toLocaleString()} characters. No partial scan was approved.`);
  if (policy.requiredDetectors.some(d => d !== 'patterns')) throw new PrivacyError('DETECTOR_UNAVAILABLE', 'A required detector is unavailable. Review the local policy before continuing.');
  if (!allowPlaceholders && /\[(?:EMAIL|PHONE|CARD|CREDENTIAL|CUSTOM)_\d+\]/.test(text)) throw new PrivacyError('TOKEN_COLLISION', 'Remove reserved placeholders such as [EMAIL_1] from the original text, then scan again.');
  const findings = [];
  const add = (category, detector, start, end) => findings.push({ category, detector, start, end, severity: category === 'credential' ? 'critical' : 'sensitive', action: policy.actions[category] });
  for (const [category, detector, pattern, valid] of detectors) {
    for (const match of text.matchAll(new RegExp(pattern))) {
      if (!valid || valid(match[0])) add(category, detector, match.index, match.index + match[0].length);
    }
  }
  for (const term of [...new Set(policy.customTerms)]) {
    // Literal, case-sensitive terms preserve UTF-16 offsets for all Unicode input.
    let start = 0;
    while ((start = text.indexOf(term, start)) !== -1) { add('custom', 'custom-literal', start, start + term.length); start += term.length; }
  }
  // Union overlapping spans. The strongest action/category wins; no uncovered
  // tail of an overlapping secret is allowed to escape redaction.
  const weight = { allow: 0, redact: 1, block: 2 };
  const priority = { phone: 1, email: 2, custom: 3, card: 4, credential: 5 };
  findings.sort((a, b) => a.start - b.start || b.end - a.end || priority[b.category] - priority[a.category]);
  const selected = [];
  for (const finding of findings) {
    const previous = selected.at(-1);
    if (!previous || finding.start >= previous.end) { selected.push({ ...finding }); continue; }
    const winner = priority[finding.category] > priority[previous.category] ? finding : previous;
    const action = weight[finding.action] > weight[previous.action] ? finding.action : previous.action;
    selected[selected.length - 1] = { ...winner, start: previous.start, end: Math.max(previous.end, finding.end), action };
  }
  return { findings: selected, scannerVersion: SCANNER_VERSION, policyVersion: policy.version, decision: selected.some(f => f.action === 'block') ? 'blocked' : 'review' };
}
export function redact(text, findings) {
  const mapping = new Map();
  const known = new Map();
  const counts = {};
  let outgoing = '', cursor = 0;
  for (const f of findings) {
    outgoing += text.slice(cursor, f.start);
    const value = text.slice(f.start, f.end);
    if (f.action === 'allow') outgoing += value;
    else {
      const key = JSON.stringify([f.category, value]);
      if (!known.has(key)) {
        const token = `[${f.category.toUpperCase()}_${counts[f.category] = (counts[f.category] ?? 0) + 1}]`;
        known.set(key, token);
        mapping.set(token, { value, category: f.category });
      }
      outgoing += known.get(key);
    }
    cursor = f.end;
  }
  return { outgoing: outgoing + text.slice(cursor), mapping };
}
export function createLocalSession({ now = Date.now } = {}) {
  // ponytail: one in-memory job per tab; add authenticated tenant scoping with the gateway milestone.
  let active = null;
  const clear = () => { active?.mapping.clear(); active = null; };
  const requireJob = id => {
    if (active && now() >= active.expiresAt) clear();
    if (!active || active.id !== id) throw new PrivacyError('JOB_UNAVAILABLE', 'This local job was cleared or expired. Scan your text again.');
    return active;
  };
  return {
    clear,
    prepare(text, policy = DEFAULT_POLICY, result = scan(text, policy)) {
      clear();
      const { outgoing, mapping } = redact(text, result.findings);
      if (outgoing.length > policy.maxLength) throw new PrivacyError('INPUT_TOO_LARGE', 'Redaction expanded the preview beyond the input limit. Shorten the original text and scan again.');
      active = { id: crypto.randomUUID(), outgoing, mapping, policy: structuredClone(policy), expiresAt: now() + TTL, decision: result.decision, approved: false };
      return { id: active.id, outgoing, expiresAt: active.expiresAt, ...result };
    },
    approve(id, outgoing, policyVersion) {
      const job = requireJob(id);
      if (job.decision === 'blocked') throw new PrivacyError('POLICY_BLOCKED', 'A local policy rule blocks this request. Edit the original text or local rules.');
      if (job.outgoing !== outgoing || job.policy.version !== policyVersion) throw new PrivacyError('PAYLOAD_CHANGED', 'The preview or policy changed. Scan and review again.');
      job.approved = true;
      return { jobId: id, payload: job.outgoing, policyVersion, evidenceState: 'local_only' };
    },
    response(id, text, restore = false) {
      const job = requireJob(id);
      if (!job.approved) throw new PrivacyError('REVIEW_REQUIRED', 'Review the outgoing preview first.');
      const result = scan(text, job.policy, { allowPlaceholders: true });
      if (result.decision === 'blocked') throw new PrivacyError('POLICY_BLOCKED', 'The response contains a finding blocked by the local policy.');
      // Credentials and payment numbers never restore, even if a model invents their token.
      // Replace newly discovered response findings with context-free masks to avoid
      // confusing a response-created token with an original job token.
      let safe = '', cursor = 0;
      for (const f of result.findings) {
        safe += text.slice(cursor, f.start) + (f.action === 'allow' ? text.slice(f.start, f.end) : '[REDACTED]');
        cursor = f.end;
      }
      safe += text.slice(cursor);
      return { sanitized: safe, display: restore ? safe.replace(/\[(?:EMAIL|PHONE|CARD|CREDENTIAL|CUSTOM)_\d+\]/g, token => {
        const entry = job.mapping.get(token);
        return entry && ['email', 'phone', 'custom'].includes(entry.category) ? entry.value : token;
      }) : safe, findings: result.findings.length };
    },
  };
}
