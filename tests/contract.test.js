import test from 'node:test';
import assert from 'node:assert/strict';
import * as RT from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from '../contracts/managed/receipts/contract/index.js';
import { requestCommitment } from '../src/envelope.js';

test('compiled contract authorizes its operator, records opaque commitments and rejects replays', () => {
  const secret = new Uint8Array(32).fill(7), receipt = new Uint8Array(32).fill(3);
  assert.equal(Buffer.from(pureCircuits.publicKey(secret)).toString('hex'), '6d20731082e2d532e2e1b4498f460cc862542cb7635a0bf559c73f576ac0a5d7');
  const contract = new Contract({ operatorSecret: ({ privateState }) => [privateState, privateState.secret] });
  const initial = contract.initialState(RT.createConstructorContext({ secret }, '0'.repeat(64)), pureCircuits.publicKey(secret));
  const context = RT.createCircuitContext('1'.repeat(64), '0'.repeat(64), initial.currentContractState, { secret });
  assert.equal(ledger(context.currentQueryContext.state).schemaVersion, 1n);
  assert.throws(() => contract.impureCircuits.record({ ...context, currentPrivateState: { secret: new Uint8Array(32).fill(8) } }, receipt), /Unauthorized submitter/);
  const result = contract.impureCircuits.record(context, receipt);
  const view = ledger(result.context.currentQueryContext.state);
  assert.equal(view.receipts.member(receipt), true);
  assert.equal(view.receipts.size(), 1n);
  assert.throws(() => contract.impureCircuits.record(result.context, receipt), /Receipt already recorded/);
  const next = contract.impureCircuits.record(result.context, new Uint8Array(32).fill(4));
  assert.equal(ledger(next.context.currentQueryContext.state).receipts.size(), 2n);
  assert.throws(() => contract.impureCircuits.record(context, new Uint8Array(31)), /Bytes<32>/);
});

test('request commitments bind every envelope field and fresh randomness', async () => {
  const fields = { organizationId: 'org', userId: 'user', jobId: 'job', policyVersion: 1, providerId: 'gemini', model: 'model', nonce: 'a'.repeat(64), payload: 'Safe [EMAIL_1]' };
  const original = await requestCommitment(fields);
  assert.equal(original, await requestCommitment({ ...fields }));
  for (const key of Object.keys(fields)) {
    assert.notEqual(original, await requestCommitment({ ...fields, [key]: key === 'policyVersion' ? 2 : `${fields[key]}x` }), key);
  }
});
