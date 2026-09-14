// Synthetic local proof check. Does not submit a transaction or need a wallet.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { Contract, pureCircuits, ledger } from '../contracts/managed/receipts/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { sampleSigningKey, ContractState as CompactContractState } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { LedgerParameters, ZswapChainState, Transaction, LedgerState, TransactionContext, WellFormedStrictness } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createUnprovenDeployTx, createUnprovenCallTxFromInitialStates } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

setNetworkId('preprod');
const secret = new Uint8Array(randomBytes(32));
const assets = resolve('contracts/managed/receipts');
const compiledContract = CompiledContract.withCompiledFileAssets(CompiledContract.withWitnesses(CompiledContract.make('receipts', Contract), { operatorSecret: ({ privateState }) => [privateState, secret] }), assets);
const zkConfigProvider = new NodeZkConfigProvider(assets);
const proofProvider = httpClientProofProvider('http://127.0.0.1:6300', zkConfigProvider, { timeout: 120000 });
const zero = '0'.repeat(64);
const deploy = await createUnprovenDeployTx({ zkConfigProvider, walletProvider: { getCoinPublicKey: () => zero, getEncryptionPublicKey: () => zero } }, { compiledContract, args: [pureCircuits.publicKey(secret)], signingKey: sampleSigningKey() });
const strictness = new WellFormedStrictness();
// Synthetic ledger has no funded wallet. All cryptographic checks stay enabled.
strictness.enforceBalancing = false;
strictness.verifyContractProofs = true; strictness.verifyNativeProofs = true; strictness.verifySignatures = true;
const now = new Date(), seconds = BigInt(Math.floor(now.getTime() / 1000));
const block = { secondsSinceEpoch: seconds, secondsSinceEpochErr: 0, parentBlockHash: zero, lastBlockTime: seconds - 6n };
let state = LedgerState.blank('preprod');
const deployProof = (await proofProvider.proveTx(deploy.private.unprovenTx)).bind();
const [deployed, deploymentResult] = state.apply(deployProof.wellFormed(state, strictness, now), new TransactionContext(state, block));
assert.equal(deploymentResult.type, 'success', deploymentResult.error);
state = deployed;
const receipt = new Uint8Array(randomBytes(32));
const call = await createUnprovenCallTxFromInitialStates(zkConfigProvider, {
  compiledContract, contractAddress: deploy.public.contractAddress, circuitId: 'record', args: [receipt],
  coinPublicKey: zero, initialContractState: deploy.public.initialContractState,
  initialZswapChainState: new ZswapChainState(), ledgerParameters: LedgerParameters.initialParameters(),
}, zero);
const proven = await proofProvider.proveTx(call.private.unprovenTx);
const serialized = proven.serialize();
assert.equal(Buffer.from(serialized).includes(Buffer.from(secret)), false, 'Private operator witness must not be in the proven transaction');
const decoded = Transaction.deserialize('signature', 'proof', 'pre-binding', serialized);
assert.deepEqual(decoded.identifiers(), proven.identifiers());
const bound = decoded.bind();
const [recorded, result] = state.apply(bound.wellFormed(state, strictness, now), new TransactionContext(state, block));
assert.equal(result.type, 'success', result.error);
const finalState = CompactContractState.deserialize(recorded.index(deploy.public.contractAddress).serialize());
assert.equal(ledger(finalState.data).receipts.member(receipt), true);
console.log(`Receipt ZK proof generated, cryptographically verified and applied to a synthetic ledger (${serialized.length} bytes). Fee balancing omitted; no network submission.`);
