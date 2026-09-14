import { randomBytes, createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { sampleSigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { createUnprovenDeployTx, createUnprovenCallTx, verifyContractState } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { parseCoinPublicKeyToHex, parseEncPublicKeyToHex } from '@midnight-ntwrk/midnight-js-utils';

const hex = value => Buffer.from(value).toString('hex');
const bytes = value => {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error('Expected a 32-byte hexadecimal value');
  return new Uint8Array(Buffer.from(value, 'hex'));
};
const assets = resolve('contracts/managed/receipts');

// The operator key stays on the gateway. The wallet receives only PROVEN transactions.
export async function createMidnight({ keyFile = './data/midnight-operator.json', publicDataProvider: suppliedPublicData, fetcher = fetch } = {}) {
  if (!existsSync(`${assets}/keys/record.prover`)) return null;
  const { Contract, pureCircuits, ledger } = await import('./contracts/managed/receipts/contract/index.js');
  setNetworkId('preprod');
  mkdirSync(dirname(keyFile), { recursive: true, mode: 0o700 });
  try { writeFileSync(keyFile, JSON.stringify({ secret: hex(randomBytes(32)), maintenanceKey: sampleSigningKey() }), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  chmodSync(keyFile, 0o600);
  const keys = JSON.parse(readFileSync(keyFile, 'utf8'));
  const secret = bytes(keys.secret);
  const authority = pureCircuits.publicKey(secret);
  const signingSeed = createHash('sha256').update('private-ai:attestation:v1').update(secret).digest();
  const signingKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), signingSeed]), format: 'der', type: 'pkcs8' });
  const publicKey = createPublicKey(signingKey).export({ format: 'der', type: 'spki' }).toString('hex');
  const compiledContract = CompiledContract.withCompiledFileAssets(
    CompiledContract.withWitnesses(CompiledContract.make('receipts', Contract), {
      operatorSecret: ({ privateState }) => [privateState, secret],
    }), assets);
  const zkConfigProvider = new NodeZkConfigProvider(assets);
  const proofProvider = httpClientProofProvider('http://127.0.0.1:6300', zkConfigProvider, { timeout: 120000 });
  const publicDataProvider = suppliedPublicData ?? indexerPublicDataProvider('https://indexer.preprod.midnight.network/api/v4/graphql', 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws');
  const verifierKey = await zkConfigProvider.getVerifierKey('record');
  let busy = false;
  function validate(state) {
    if (!state) throw new Error('Contract not found in finalized ledger state');
    verifyContractState([['record', verifierKey]], state);
    const view = ledger(state.data);
    if (view.schemaVersion !== 1n || hex(view.authority) !== hex(authority)) throw new Error('Unexpected contract authority or schema');
    return view;
  }
  function providers(wallet) {
    const coin = parseCoinPublicKeyToHex(wallet?.shieldedCoinPublicKey, 'preprod');
    const enc = parseEncPublicKeyToHex(wallet?.shieldedEncryptionPublicKey, 'preprod');
    bytes(coin); bytes(enc);
    return { zkConfigProvider, publicDataProvider, walletProvider: { getCoinPublicKey: () => coin, getEncryptionPublicKey: () => enc } };
  }
  async function prove(build) {
    if (busy) throw new Error('The prover is busy; retry after the current request');
    busy = true;
    try {
      const result = await build();
      const proven = await proofProvider.proveTx(result.private.unprovenTx);
      return { tx: hex(proven.serialize()), transactionId: proven.identifiers()[0], contractAddress: result.public.contractAddress };
    } finally { busy = false; }
  }
  return {
    authority: hex(authority),
    attestationKey: publicKey,
    sign(commitment) {
      const message = Buffer.from(`private-ai:receipt:v1:preprod:${commitment}`, 'utf8');
      bytes(commitment);
      return { algorithm: 'Ed25519', publicKey, signature: sign(null, message, signingKey).toString('hex') };
    },
    async prepareDeploy(wallet) {
      return prove(() => createUnprovenDeployTx(providers(wallet), { compiledContract, args: [authority], signingKey: keys.maintenanceKey }));
    },
    async prepareReceipt(address, commitment, wallet) {
      bytes(address); bytes(commitment);
      validate(await publicDataProvider.queryContractState(address));
      return prove(() => createUnprovenCallTx(providers(wallet), { compiledContract, contractAddress: address, circuitId: 'record', args: [bytes(commitment)] }));
    },
    async verify(address, commitment) {
      bytes(address); if (commitment) bytes(commitment);
      // Pin the indexer read to the node's finalized head, not its newest state.
      const response = await fetcher('https://rpc.preprod.midnight.network/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(10000),
        body: JSON.stringify([{ jsonrpc: '2.0', id: 1, method: 'system_chain', params: [] }, { jsonrpc: '2.0', id: 2, method: 'chain_getFinalizedHead', params: [] }]),
      });
      if (!response.ok) throw new Error('Midnight node unavailable');
      const results = await response.json();
      if (!Array.isArray(results) || results.length !== 2 || results.some(r => r.jsonrpc !== '2.0' || r.error)) throw new Error('Invalid Preprod finality response');
      const block = results.find(r => r.id === 2)?.result;
      if (results.find(r => r.id === 1)?.result !== 'Midnight Preprod' || !/^0x[0-9a-f]{64}$/.test(block)) throw new Error('Invalid Preprod finality response');
      const state = await publicDataProvider.queryContractState(address, { type: 'blockHash', blockHash: block.slice(2) });
      const view = validate(state);
      return { confirmed: !commitment || view.receipts.member(bytes(commitment)), network: 'preprod', contractAddress: address, finalizedBlock: block, checkedAt: new Date().toISOString() };
    },
  };
}
