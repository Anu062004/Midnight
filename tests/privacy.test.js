import test from 'node:test';
import assert from 'node:assert/strict';
import { scan, redact, createLocalSession, DEFAULT_POLICY, LIMIT, TTL, validatePolicy } from '../src/privacy.js';

const policyWith = change => ({ ...structuredClone(DEFAULT_POLICY), ...change });
const corpus = [
  { category: 'email', input: 'Contact mira@example.com.', positive: true },
  { category: 'email', input: 'hello+team@example.co.uk', positive: true },
  { category: 'email', input: 'a@@example / a@localhost', positive: false },
  { category: 'phone', input: '+91 98765 43210', positive: true },
  { category: 'phone', input: '(415) 555-0136', positive: true },
  { category: 'phone', input: '2026-09-12 / 12345', positive: false },
  { category: 'card', input: '4242 4242 4242 4242', positive: true },
  { category: 'card', input: '378282246310005', positive: true },
  { category: 'card', input: '4242 4242 4242 4241', positive: false },
  { category: 'card', input: '0000000000000000', positive: false },
  { category: 'credential', input: 'sk-test_1234567890abcdefghijklmnop', positive: true },
  { category: 'credential', input: 'password="hello there"', positive: true },
  { category: 'credential', input: 'AKIAIOSFODNN7EXAMPLE', positive: true },
  { category: 'credential', input: '-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----', positive: true },
  { category: 'credential', input: '-----BEGIN PRIVATE KEY-----\ntruncated', positive: true },
  { category: 'credential', input: 'sk-ant-api03-synthetic1234567890abcdefghij', positive: true },
  { category: 'credential', input: 'AIzaSyD-synthetic_google_key_1234567890123', positive: true },
  { category: 'credential', input: 'xoxb-synthetic-slack-token-1234567890', positive: true },
  { category: 'credential', input: 'rk_' + 'live_synthetic1234567890abcdef', positive: true },
  { category: 'credential', input: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.4pcPyMD09olPSyXnrXCjTwXyr4BsezdI1AVTmud2fU4', positive: true },
  { category: 'credential', input: 'postgres://admin:hunter2@db.internal.example.com:5432/prod', positive: true },
  { category: 'credential', input: 'The secret to good design is restraint.', positive: false },
  { category: 'ssn', input: '523-45-6789', positive: true },
  { category: 'ssn', input: '000-45-6789', positive: false },
  { category: 'ssn', input: '666-45-6789', positive: false },
  { category: 'ssn', input: '523-00-6789', positive: false },
  { category: 'ssn', input: '523-45-0000', positive: false },
  { category: 'iban', input: 'DE89370400440532013000', positive: true },
  { category: 'iban', input: 'GB29 NWBK 6016 1331 9268 19', positive: true },
  { category: 'iban', input: 'DE89370400440532013001', positive: false },
  { category: 'custom', input: '北極 project', positive: true, terms: ['北極'] },
  { category: 'custom', input: 'northstar project', positive: false, terms: ['Northstar'] },
];
test('published synthetic detector corpus: precision and recall per category', t => {
  for (const category of ['email', 'phone', 'card', 'ssn', 'iban', 'credential', 'custom']) {
    let tp = 0, fp = 0, fn = 0;
    for (const fixture of corpus.filter(f => f.category === category)) {
      const hit = scan(fixture.input, policyWith({ customTerms: fixture.terms ?? [] })).findings.some(f => f.category === category);
      if (hit && fixture.positive) tp++;
      if (hit && !fixture.positive) fp++;
      if (!hit && fixture.positive) fn++;
      assert.equal(hit, fixture.positive, `${category}: ${fixture.input}`);
    }
    t.diagnostic(`${category}: precision=${tp / (tp + fp)}, recall=${tp / (tp + fn)}; synthetic fixtures only`);
  }
});
test('redaction preserves Unicode, spacing, punctuation and repeated entities', () => {
  const text = '🌒 नमस्ते mira@example.com — send to mira@example.com.\n終';
  const result = scan(text);
  const { outgoing, mapping } = redact(text, result.findings);
  assert.equal(outgoing, '🌒 नमस्ते [EMAIL_1] — send to [EMAIL_1].\n終');
  assert.equal(mapping.size, 1);
  assert.equal(result.findings[0].start, text.indexOf('mira@'));
  assert.deepEqual(scan(text), result);
});
test('overlapping spans cover the entire union, including secret tails', () => {
  const p = policyWith({ customTerms: ['abcXYZ', 'XYZdef'] });
  assert.equal(redact('abcXYZdef', scan('abcXYZdef', p).findings).outgoing, '[CUSTOM_1]');
  const q = policyWith({ customTerms: ['secret'], actions: { ...DEFAULT_POLICY.actions, custom: 'allow' } });
  const result = scan('secret=hello_world', q);
  assert.equal(result.findings[0].category, 'credential');
  assert.equal(redact('secret=hello_world', result.findings).outgoing, '[CREDENTIAL_1]');
});
test('block wins over overlapping allow rules and prevents approval', () => {
  const p = policyWith({ customTerms: ['mira'], actions: { ...DEFAULT_POLICY.actions, custom: 'block', email: 'allow' } });
  const local = createLocalSession();
  const job = local.prepare('mira@example.com', p);
  assert.equal(job.decision, 'blocked');
  assert.throws(() => local.approve(job.id, job.outgoing, 1), { code: 'POLICY_BLOCKED' });
});
test('input limits, reserved tokens and unavailable required detectors fail explicitly', () => {
  assert.throws(() => scan('  '), { code: 'EMPTY_INPUT' });
  assert.throws(() => scan('a'.repeat(LIMIT + 1)), { code: 'INPUT_TOO_LARGE' });
  assert.throws(() => scan('[EMAIL_1]'), { code: 'TOKEN_COLLISION' });
  assert.throws(() => scan('hello', policyWith({ requiredDetectors: ['semantic'] })), { code: 'DETECTOR_UNAVAILABLE' });
  assert.equal(scan('a'.repeat(LIMIT)).findings.length, 0);
  assert.throws(() => validatePolicy(policyWith({ customTerms: [''] })), { code: 'INVALID_POLICY' });
  assert.throws(() => validatePolicy(policyWith({ actions: { ...DEFAULT_POLICY.actions, credential: 'allow' } })), { code: 'INVALID_POLICY' });
});
test('approval binds exact preview and policy version; cannot restore before review', () => {
  const local = createLocalSession();
  const job = local.prepare('mira@example.com');
  assert.throws(() => local.response(job.id, job.outgoing), { code: 'REVIEW_REQUIRED' });
  assert.throws(() => local.approve(job.id, `${job.outgoing} `, 1), { code: 'PAYLOAD_CHANGED' });
  assert.throws(() => local.approve(job.id, job.outgoing, 2), { code: 'PAYLOAD_CHANGED' });
  assert.equal(local.approve(job.id, job.outgoing, 1).evidenceState, 'local_only');
});
test('jobs with identical sanitized text cannot reuse each other’s restoration context', () => {
  const local = createLocalSession();
  const first = local.prepare('mira@example.com');
  local.approve(first.id, first.outgoing, 1);
  const second = local.prepare('ravi@example.com');
  assert.equal(first.outgoing, second.outgoing);
  assert.notEqual(first.id, second.id);
  assert.throws(() => local.response(first.id, first.outgoing, true), { code: 'JOB_UNAVAILABLE' });
  local.approve(second.id, second.outgoing, 1);
  assert.equal(local.response(second.id, second.outgoing, true).display, 'ravi@example.com');
});
test('response is rescanned, unknown tokens stay literal, secrets stay masked', () => {
  const local = createLocalSession();
  const job = local.prepare('mira@example.com password="sensitive" 4242 4242 4242 4242');
  local.approve(job.id, job.outgoing, 1);
  const response = local.response(job.id, `${job.outgoing} invented@example.org [EMAIL_99] password=anothersecret`, true);
  assert.match(response.display, /mira@example.com/);
  assert.doesNotMatch(response.sanitized, /mira@example.com/);
  assert.doesNotMatch(response.display, /sensitive|4242|invented@example.org|anothersecret/);
  assert.match(response.display, /\[EMAIL_99\]/);
  assert.match(response.display, /\[REDACTED\]/);
});
test('expiration and explicit clearing invalidate mappings', () => {
  let time = 100;
  const local = createLocalSession({ now: () => time });
  const job = local.prepare('mira@example.com');
  local.approve(job.id, job.outgoing, 1);
  time += TTL;
  assert.throws(() => local.response(job.id, job.outgoing, true), { code: 'JOB_UNAVAILABLE' });
  const next = local.prepare('mira@example.com');
  local.clear();
  assert.throws(() => local.approve(next.id, next.outgoing, 1), { code: 'JOB_UNAVAILABLE' });
});
test('25,000 character scan benchmark on the current machine', t => {
  const input = 'Synthetic text mira@example.com, '.repeat(800).slice(0, LIMIT);
  const samples = [];
  for (let i = 0; i < 30; i++) { const start = performance.now(); scan(input); samples.push(performance.now() - start); }
  samples.sort((a, b) => a - b);
  t.diagnostic(`p95=${samples[Math.ceil(samples.length * .95) - 1].toFixed(2)}ms; Node ${process.version}, ${process.platform}/${process.arch}`);
  assert.ok(samples.at(-1) < 2000, 'scan should remain within the worker deadline');
});
