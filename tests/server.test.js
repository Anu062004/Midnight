import test from 'node:test';
import assert from 'node:assert/strict';
import { get } from 'node:http';
import { checkMidnight, makeServer, PREPROD_RPC } from '../server.mjs';

test('Midnight check only calls fixed read-only methods and never establishes anchoring', async () => {
  const calls = [];
  const result = await checkMidnight(async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    const { method, id } = JSON.parse(options.body);
    return Response.json({ jsonrpc: '2.0', id, result: method === 'system_chain' ? 'Midnight Preprod' : `0x${'a'.repeat(64)}` });
  });
  assert.equal(result.anchoring, 'not_configured');
  assert.deepEqual(calls.map(c => c[0]), [PREPROD_RPC, PREPROD_RPC]);
  assert.deepEqual(calls.map(c => c[1].method), ['system_chain', 'chain_getFinalizedHead']);
  await assert.rejects(checkMidnight(async (_, options) => Response.json({ jsonrpc: '2.0', id: JSON.parse(options.body).id, result: 'Midnight Mainnet' })), /WRONG_NETWORK/);
  await assert.rejects(checkMidnight(async () => Response.json({ error: 'unavailable' })), /INVALID_RPC_RESPONSE/);
});
test('local server serves only app assets; rejects writes, cross-origin and wrong-host requests', async t => {
  const server = makeServer({ midnight: async () => { throw new Error('offline'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(url);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.equal((await fetch(`${url}/PRIVATE_AI_PRODUCT_REFERENCE.md`)).status, 404);
  assert.equal((await fetch(`${url}/src/privacy.js`)).status, 200);
  assert.equal((await fetch(`${url}/api/jobs`, { method: 'POST', body: '{}' })).status, 403);
  assert.equal((await fetch(url, { headers: { Origin: 'https://example.org' } })).status, 403);
  const wrongHostStatus = await new Promise((resolve, reject) => {
    get(url, { headers: { Host: 'attacker.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
  });
  assert.equal(wrongHostStatus, 403);
  const status = await fetch(`${url}/api/midnight/status`);
  assert.equal(status.status, 503);
  assert.deepEqual(await status.json(), { code: 'MIDNIGHT_UNAVAILABLE', anchoring: 'not_configured' });
  assert.equal((await fetch(`${url}/api/midnight/status`)).status, 429);
});
