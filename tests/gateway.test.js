import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createPublicKey, verify } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGateway } from '../gateway.mjs';
import { createMidnight } from '../midnight.mjs';
import { requestCommitment } from '../src/envelope.js';
import * as RT from '@midnight-ntwrk/compact-runtime';
import { Contract, pureCircuits } from '../contracts/managed/receipts/contract/index.js';

async function register(gateway, email = `${randomUUID()}@example.com`) {
  const data = await gateway.handle({ method: 'POST', path: '/api/register', body: { email, password: 'SyntheticPassword123!', organizationName: 'Synthetic test' } });
  return { ...data, call: (method, path, body = {}) => gateway.handle({ method, path, body, secret: data.cookie, csrf: data.csrf }) };
}
async function prepare(user, changes = {}) {
  const fields = { organizationId: user.organization.id, userId: user.user.id, jobId: randomUUID(), policyVersion: user.policy.version, providerId: 'gemini', model: 'test-model', nonce: randomBytes(32).toString('hex'), payload: 'Summarize [EMAIL_1]', ...changes };
  const commitment = await requestCommitment(fields);
  const body = { jobId: fields.jobId, policyVersion: fields.policyVersion, model: fields.model, nonce: fields.nonce, payload: fields.payload, commitment, mode: 'live' };
  return { fields, body, ...(await user.call('POST', '/api/jobs', body)) };
}
const providerResponse = () => Response.json({ candidates: [{ content: { parts: [{ text: 'Synthetic model reply' }] }, finishReason: 'STOP' }] });
const rejected = code => error => error.code === code;
const signer = { sign: () => ({ signature: 'synthetic test attestation' }) };

test('gateway binds Gemini payload, enforces tenancy/CSRF, and dispatches at most once', async t => {
  const calls = [];
  const gateway = createGateway({ midnight: signer, providerId: 'gemini', apiKey: 'synthetic', model: 'test-model', fetcher: async (url, options) => { calls.push({ url, body: options.body }); return providerResponse(); } });
  t.after(() => gateway.close());
  const user = await register(gateway), stranger = await register(gateway);
  const job = await prepare(user);
  await assert.rejects(stranger.call('GET', `/api/jobs/${job.job.id}`), rejected('NOT_FOUND'));
  await assert.rejects(gateway.handle({ method: 'POST', path: `/api/jobs/${job.job.id}/send`, secret: user.cookie, csrf: 'forged', body: { payload: job.fields.payload } }), rejected('CSRF_REJECTED'));
  await assert.rejects(user.call('POST', `/api/jobs/${job.job.id}/send`, { payload: 'changed' }), rejected('PAYLOAD_CHANGED'));
  await assert.rejects(prepare(user, { payload: 'email jane@example.com' }), rejected('POLICY_BLOCKED'));
  const results = await Promise.all([user.call('POST', `/api/jobs/${job.job.id}/send`, { payload: job.fields.payload }), user.call('POST', `/api/jobs/${job.job.id}/send`, { payload: job.fields.payload })]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /generativelanguage.googleapis.com/);
  assert.equal(results.filter(r => r.response).length, 1);
  assert.equal((await user.call('GET', `/api/jobs/${job.job.id}`)).job.state, 'delivered');
});

test('strict mode requires ledger verification; a caller submission hint never authorizes delivery', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'midnight-gateway-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const file = join(temp, 'gateway.sqlite');
  let gateway = createGateway({ filename: file });
  const user = await register(gateway);
  gateway.close();
  let confirmed = false, offline = false, delivered = 0;
  const midnight = {
    authority: 'a'.repeat(64), sign: () => ({ signature: 'synthetic signature' }),
    prepareDeploy: async () => ({ contractAddress: 'b'.repeat(64), transactionId: 'c'.repeat(64), tx: 'abcd' }),
    prepareReceipt: async () => ({ transactionId: 'd'.repeat(64), tx: 'abcd' }),
    verify: async (_, commitment) => { if (offline) throw new Error('offline'); return { confirmed: !commitment || confirmed, finalizedBlock: 'e'.repeat(64) }; },
  };
  gateway = createGateway({ filename: file, midnight, operatorUserId: user.user.id, providerId: 'gemini', apiKey: 'synthetic', model: 'test-model', fetcher: async () => { delivered++; return providerResponse(); } });
  t.after(() => gateway.close());
  user.call = (method, path, body = {}) => gateway.handle({ method, path, body, secret: user.cookie, csrf: user.csrf });
  const stranger = await register(gateway);
  await assert.rejects(stranger.call('POST', '/api/midnight/deploy', { wallet: {} }), rejected('FORBIDDEN'));
  await user.call('POST', '/api/midnight/deploy', { wallet: {} });
  assert.equal((await user.call('GET', '/api/midnight/contract')).deployment.state, 'queued');
  await user.call('POST', '/api/midnight/confirm');
  const { id, version, ...policy } = user.policy;
  user.policy = (await user.call('POST', '/api/policies', { ...policy, baseVersion: version, evidenceMode: 'strict' })).policy;
  const job = await prepare(user), path = `/api/jobs/${job.job.id}`;
  assert.equal(job.job.evidenceState, 'signed');
  await assert.rejects(user.call('POST', `${path}/send`, { payload: job.fields.payload }), rejected('EVIDENCE_PENDING'));
  await user.call('POST', `${path}/evidence`, { wallet: {} });
  await user.call('POST', `${path}/evidence/submitted`);
  assert.equal((await user.call('GET', path)).job.evidenceState, 'submitted');
  await assert.rejects(user.call('POST', `${path}/send`, { payload: job.fields.payload }), rejected('EVIDENCE_PENDING'));
  assert.equal(delivered, 0);
  confirmed = true;
  assert.equal((await user.call('POST', `${path}/evidence/confirm`)).job.evidenceState, 'confirmed');
  offline = true;
  await assert.rejects(user.call('POST', `${path}/send`, { payload: job.fields.payload }), rejected('EVIDENCE_UNAVAILABLE'));
  assert.equal(delivered, 0);
  offline = false;
  assert.equal((await user.call('POST', `${path}/send`, { payload: job.fields.payload })).job.state, 'delivered');
  assert.equal(delivered, 1);
});

test('delivery uncertainty survives restart, and stored metadata contains no prompt or response', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'midnight-recovery-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const file = join(temp, 'gateway.sqlite');
  let calls = 0;
  const options = { filename: file, midnight: signer, providerId: 'gemini', apiKey: 'synthetic', model: 'test-model', fetcher: async () => { calls++; throw new Error('timeout after possible dispatch'); } };
  let gateway = createGateway(options);
  const user = await register(gateway);
  const job = await prepare(user, { payload: 'UNIQUE_SYNTHETIC_PROMPT_8675309' });
  assert.equal((await user.call('POST', `/api/jobs/${job.job.id}/send`, { payload: job.fields.payload })).job.state, 'unknown');
  gateway.close();
  gateway = createGateway(options); t.after(() => gateway.close());
  const replay = await gateway.handle({ method: 'POST', path: `/api/jobs/${job.job.id}/send`, secret: user.cookie, csrf: user.csrf, body: { payload: job.fields.payload } });
  assert.equal(replay.job.state, 'unknown'); assert.equal(calls, 1);
  assert.equal(readFileSync(file).includes(Buffer.from(job.fields.payload)), false);
});

test('operator attestations verify and keep the same identity after restart', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'midnight-key-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const options = { keyFile: join(temp, 'key.json') }, commitment = 'a'.repeat(64);
  const first = await createMidnight(options), second = await createMidnight(options);
  assert.equal(first.authority, second.authority);
  const receipt = first.sign(commitment), key = createPublicKey({ key: Buffer.from(receipt.publicKey, 'hex'), format: 'der', type: 'spki' });
  assert.equal(verify(null, Buffer.from(`private-ai:receipt:v1:preprod:${commitment}`), key, Buffer.from(receipt.signature, 'hex')), true);
  assert.equal(verify(null, Buffer.from(`private-ai:receipt:v1:preprod:${'b'.repeat(64)}`), key, Buffer.from(receipt.signature, 'hex')), false);
  assert.deepEqual(first.sign(commitment), second.sign(commitment));
});

test('verification pins finality, authority, verifier key and exact commitment', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'midnight-verification-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const keyFile = join(temp, 'key.json'), address = '1'.repeat(64), commitment = '2'.repeat(64);
  let state, chain = 'Midnight Preprod';
  const queries = [];
  const midnight = await createMidnight({ keyFile,
    publicDataProvider: { queryContractState: async (contractAddress, config) => { queries.push({ contractAddress, config }); return state; } },
    fetcher: async () => Response.json([{ jsonrpc: '2.0', id: 1, result: chain }, { jsonrpc: '2.0', id: 2, result: `0x${'3'.repeat(64)}` }]),
  });
  const secret = new Uint8Array(Buffer.from(JSON.parse(readFileSync(keyFile, 'utf8')).secret, 'hex'));
  const contract = new Contract({ operatorSecret: ({ privateState }) => [privateState, secret] });
  state = contract.initialState(RT.createConstructorContext(undefined, '0'.repeat(64)), pureCircuits.publicKey(secret)).currentContractState;
  const operation = new RT.ContractOperation(); operation.verifierKey = readFileSync('contracts/managed/receipts/keys/record.verifier');
  state.setOperation('record', operation);
  assert.equal((await midnight.verify(address, commitment)).confirmed, false);
  const ctx = RT.createCircuitContext(address, '0'.repeat(64), state, undefined);
  state.data = contract.impureCircuits.record(ctx, new Uint8Array(Buffer.from(commitment, 'hex'))).context.currentQueryContext.state;
  assert.equal((await midnight.verify(address, commitment)).confirmed, true);
  assert.deepEqual(queries.at(-1), { contractAddress: address, config: { type: 'blockHash', blockHash: '3'.repeat(64) } });
  assert.equal((await midnight.verify(address, '4'.repeat(64))).confirmed, false);
  chain = 'Midnight Mainnet'; await assert.rejects(midnight.verify(address, commitment), /Invalid Preprod/); chain = 'Midnight Preprod';
  const valid = state;
  state = contract.initialState(RT.createConstructorContext(undefined, '0'.repeat(64)), new Uint8Array(32)).currentContractState;
  state.setOperation('record', operation);
  await assert.rejects(midnight.verify(address, commitment), /authority or schema/);
  state = new RT.ContractState(); state.data = valid.data;
  await assert.rejects(midnight.verify(address, commitment), /record|contract type/i);
});
