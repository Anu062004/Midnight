import test from 'node:test';
import assert from 'node:assert/strict';
import { ErrorCodes } from '@midnight-ntwrk/dapp-connector-api';
import {
  getNetworkId as officialGetNetworkId,
  setNetworkId as officialSetNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightWalletAdapter } from '../src/wallet/midnight-wallet-adapter.js';
import {
  DEFAULT_NETWORK_ID,
  SUPPORTED_CONNECTOR_RANGE,
  WalletError,
  WalletErrorCode,
} from '../src/wallet/midnight-wallet-types.js';
import {
  configureNetwork,
  getNetworkId,
  resetNetworkForTests,
  setNetworkId,
} from '../src/wallet/midnight-network.js';
import {
  discoverWallets,
  formatTokenAmount,
  isCompatibleVersion,
  isSafeIconUrl,
  normalizeWalletError,
  truncateAddress,
} from '../src/wallet/midnight-wallet-utils.js';

const memoryStorage = () => {
  const data = {};
  return {
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: key => {
      delete data[key];
    },
    data,
  };
};

function mockConnected(overrides = {}) {
  return {
    hintUsage: async () => {},
    getConnectionStatus: async () => ({ status: 'connected', networkId: 'preprod' }),
    getConfiguration: async () => ({
      indexerUri: 'https://indexer.preprod.midnight.network/api/v4/graphql',
      indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
      substrateNodeUri: 'wss://rpc.preprod.midnight.network',
      networkId: 'preprod',
    }),
    getShieldedAddresses: async () => ({
      shieldedAddress: 'mn_shield-addr-test-1234567890',
      shieldedCoinPublicKey: 'mn_shield-coin-key-test-1234567890',
      shieldedEncryptionPublicKey: 'mn_shield-enc-key-test-1234567890',
    }),
    getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_unshield-addr-test-1234567890' }),
    getDustAddress: async () => ({ dustAddress: 'mn_dust-addr-test-1234567890' }),
    getShieldedBalances: async () => ({ NIGHT: 1000n }),
    getUnshieldedBalances: async () => ({ NIGHT: 2000n }),
    getDustBalance: async () => ({ balance: 3000n, cap: 9000n }),
    balanceUnsealedTransaction: async tx => ({ tx }),
    submitTransaction: async () => {},
    getProvingProvider: async () => ({ check: async () => [], prove: async () => new Uint8Array() }),
    ...overrides,
  };
}

function mockConnector({ name = 'Test Wallet', rdns = 'com.test.wallet', apiVersion = '4.0.1', connectImpl } = {}) {
  const calls = [];
  return {
    calls,
    connector: {
      rdns,
      name,
      icon: 'data:image/png;base64,AAA',
      apiVersion,
      connect: async networkId => {
        calls.push(networkId);
        if (connectImpl) return connectImpl(networkId);
        return mockConnected();
      },
    },
  };
}

const adapterWith = (scope, options = {}) =>
  new MidnightWalletAdapter({ storage: memoryStorage(), scope, networkId: 'preprod', ...options });

// --- discovery ---

test('no window.midnight resolves to an empty wallet list', () => {
  assert.deepEqual(discoverWallets(), []);
  assert.deepEqual(discoverWallets({}), []);
  assert.deepEqual(discoverWallets(null), []);
});

test('entries without the connector shape are ignored', () => {
  const scope = {
    broken: { name: 'Broken' },
    noConnect: { name: 'No connect', apiVersion: '4.0.1' },
    nullish: null,
    good: { rdns: 'com.good.wallet', name: 'Good', icon: '', apiVersion: '4.0.1', connect: async () => ({}) },
  };
  const wallets = discoverWallets(scope);
  assert.equal(wallets.length, 1);
  assert.equal(wallets[0].id, 'good');
});

test('one wallet is discovered with metadata and compatibility flag', () => {
  const { connector } = mockConnector({ name: 'Lace-like' });
  const [wallet] = discoverWallets({ someKey: connector });
  assert.equal(wallet.id, 'someKey');
  assert.equal(wallet.name, 'Lace-like');
  assert.equal(wallet.apiVersion, '4.0.1');
  assert.equal(wallet.compatible, true);
});

test('multiple wallets are discovered without hardcoded ids', () => {
  const lace = mockConnector({ name: 'Lace', rdns: 'io.iog.wallet' });
  const oneam = mockConnector({ name: '1AM', rdns: 'one.am.wallet' });
  const future = mockConnector({ name: 'Future Wallet', rdns: 'org.future.wallet', apiVersion: '4.2.0' });
  const wallets = discoverWallets({
    mnLace: lace.connector,
    '1am': oneam.connector,
    'a3f1c9e2-1111-4222-8333-abcdef123456': future.connector,
  });
  assert.deepEqual(
    wallets.map(w => w.name).sort(),
    ['1AM', 'Future Wallet', 'Lace'],
  );
  assert.ok(wallets.every(w => w.compatible));
});

test('default discovery reads the live window.midnight object', t => {
  const { connector } = mockConnector();
  globalThis.window = { midnight: { live: connector } };
  t.after(() => {
    // @ts-ignore cleanup test double
    delete globalThis.window;
  });
  assert.equal(discoverWallets()[0].id, 'live');
  assert.equal(new MidnightWalletAdapter({ storage: memoryStorage() }).discover()[0].id, 'live');
});

// --- version compatibility ---

test('connector version compatibility follows the supported range', () => {
  assert.equal(SUPPORTED_CONNECTOR_RANGE, '^4.0.0');
  for (const version of ['4.0.0', '4.0.1', '4.9.9', 'v4.2.0']) assert.equal(isCompatibleVersion(version), true, version);
  for (const version of ['3.9.9', '5.0.0', '1.0.0', 'not-a-version', '', '4.0', '4']) assert.equal(isCompatibleVersion(version), false, version);
});

test('incompatible wallets are flagged and refuse to connect', async () => {
  const { connector } = mockConnector({ apiVersion: '3.1.5' });
  const adapter = adapterWith({ old: connector });
  const [wallet] = adapter.discover();
  assert.equal(wallet.compatible, false);
  await assert.rejects(adapter.connect('old'), error => error instanceof WalletError && error.code === WalletErrorCode.UNSUPPORTED_CONNECTOR_VERSION);
  assert.equal(adapter.getState().status, 'error');
});

// --- connection ---

test('successful connection validates network and loads wallet state', async () => {
  const { connector, calls } = mockConnector();
  const storage = memoryStorage();
  const adapter = new MidnightWalletAdapter({ storage, scope: { w: connector }, networkId: 'preprod' });
  const state = await adapter.connect('w');
  assert.deepEqual(calls, ['preprod']);
  assert.equal(state.status, 'connected');
  assert.equal(state.selectedWallet.name, 'Test Wallet');
  assert.equal(state.addresses.unshielded, 'mn_unshield-addr-test-1234567890');
  assert.equal(state.addresses.shielded, 'mn_shield-addr-test-1234567890');
  assert.equal(state.addresses.dust, 'mn_dust-addr-test-1234567890');
  assert.equal(state.balances.dust.balance, 3000n);
  assert.equal(state.configuration.indexerUri, 'https://indexer.preprod.midnight.network/api/v4/graphql');
  assert.equal(storage.data['midnight.wallet.selectedId.v1'], 'w');
  assert.ok(state.connectedApi);
});

test('balances stay bigint and never become number', async () => {
  const { connector } = mockConnector();
  const adapter = adapterWith({ w: connector });
  const state = await adapter.connect('w');
  assert.equal(typeof state.balances.shielded.NIGHT, 'bigint');
  assert.equal(formatTokenAmount(state.balances.shielded.NIGHT), '1000');
  assert.equal(formatTokenAmount(undefined), '');
});

test('rejected connection maps to USER_REJECTED with safe copy', async () => {
  const rejection = { type: 'DAppConnectorAPIError', code: 'Rejected', reason: 'user said no', message: 'rejected' };
  const { connector } = mockConnector({ connectImpl: async () => { throw rejection; } });
  const adapter = adapterWith({ w: connector });
  const error = await adapter.connect('w').then(() => assert.fail('should throw'), e => e);
  assert.ok(error instanceof WalletError);
  assert.equal(error.code, WalletErrorCode.USER_REJECTED);
  assert.equal(error.message, 'Connection request was rejected in your wallet.');
  assert.equal(adapter.getState().status, 'error');
  assert.equal(adapter.getState().connectedApi, null);
});

test('permission rejection and popup dismissal also map to USER_REJECTED', () => {
  for (const cause of [
    { type: 'DAppConnectorAPIError', code: 'PermissionRejected', reason: 'denied', message: 'denied' },
    new Error('User closed the popup'),
  ]) {
    assert.equal(normalizeWalletError(cause).code, WalletErrorCode.USER_REJECTED);
  }
});

test('network mismatch aborts with expected vs actual ids', async () => {
  const { connector } = mockConnector({
    connectImpl: async () =>
      mockConnected({ getConnectionStatus: async () => ({ status: 'connected', networkId: 'mainnet' }) }),
  });
  const adapter = adapterWith({ w: connector });
  const error = await adapter.connect('w').then(() => assert.fail('should throw'), e => e);
  assert.equal(error.code, WalletErrorCode.NETWORK_MISMATCH);
  assert.match(error.message, /Expected: preprod/);
  assert.match(error.message, /Connected: mainnet/);
  assert.deepEqual(error.details, { walletId: 'w', expected: 'preprod', actual: 'mainnet' });
  assert.equal(adapter.getState().status, 'error');
  assert.equal(adapter.getState().connectedApi, null);
});

test('connecting to an unknown wallet id fails cleanly', async () => {
  const { connector } = mockConnector();
  const adapter = adapterWith({ w: connector });
  await assert.rejects(adapter.connect('ghost'), error => error instanceof WalletError && error.code === WalletErrorCode.WALLET_NOT_FOUND);
});

// --- wallet disappearing ---

test('lost connections are reported without destroying metadata silently', async () => {
  let alive = true;
  const { connector } = mockConnector({
    connectImpl: async () =>
      mockConnected({ getConnectionStatus: async () => (alive ? { status: 'connected', networkId: 'preprod' } : { status: 'disconnected' }) }),
  });
  const adapter = adapterWith({ w: connector });
  await adapter.connect('w');
  alive = false;
  const state = await adapter.checkConnection();
  assert.equal(state.status, 'error');
  assert.equal(state.error.code, WalletErrorCode.DISCONNECTED);
  assert.deepEqual(state.addresses, {});
  // Selection survives so the user can reconnect with one click.
  assert.equal(state.selectedWallet.id, 'w');
});

// --- configuration ---

test('configuration failure becomes a warning; connection survives', async () => {
  const { connector } = mockConnector({
    connectImpl: async () =>
      mockConnected({
        getConfiguration: async () => {
          throw new Error('indexer down');
        },
      }),
  });
  const adapter = adapterWith({ w: connector });
  const state = await adapter.connect('w');
  assert.equal(state.status, 'connected');
  assert.equal(state.configuration, null);
  assert.equal(state.loadWarnings[0].section, 'configuration');
  assert.ok(state.addresses.unshielded);
});

test('balance failure becomes a warning; connection survives', async () => {
  const { connector } = mockConnector({
    connectImpl: async () =>
      mockConnected({
        getShieldedBalances: async () => {
          throw new Error('syncing');
        },
      }),
  });
  const adapter = adapterWith({ w: connector });
  const state = await adapter.connect('w');
  assert.equal(state.status, 'connected');
  assert.ok(state.loadWarnings.some(warning => warning.section === 'shielded-balances'));
  assert.equal(state.balances.dust.balance, 3000n);
});

// --- disconnect ---

test('application disconnect clears state without a wallet-level method', async () => {
  const { connector } = mockConnector();
  assert.equal(typeof connector.disconnect, 'undefined');
  const storage = memoryStorage();
  const adapter = new MidnightWalletAdapter({ storage, scope: { w: connector }, networkId: 'preprod' });
  await adapter.connect('w');
  const state = await adapter.disconnect();
  assert.equal(state.status, 'idle');
  assert.equal(state.selectedWallet, null);
  assert.equal(state.connectedApi, null);
  assert.deepEqual(state.addresses, {});
  assert.deepEqual(state.balances, {});
  assert.equal(state.configuration, null);
  assert.equal(storage.data['midnight.wallet.selectedId.v1'], undefined);
});

// --- persistence ---

test('stored wallet id is restored without connecting (no popup)', async () => {
  const { connector } = mockConnector();
  const storage = memoryStorage();
  const first = new MidnightWalletAdapter({ storage, scope: { w: connector }, networkId: 'preprod' });
  await first.connect('w');
  const second = new MidnightWalletAdapter({ storage, scope: { w: connector }, networkId: 'preprod' });
  assert.equal(second.restoreSelection(), true);
  assert.equal(second.getState().selectedWallet.id, 'w');
  assert.equal(second.getState().status, 'idle');
  assert.equal(second.getState().connectedApi, null);
});

test('restore fails gracefully when the wallet is gone', () => {
  const storage = memoryStorage();
  storage.setItem('midnight.wallet.selectedId.v1', 'ghost');
  const adapter = new MidnightWalletAdapter({ storage, scope: {}, networkId: 'preprod' });
  assert.equal(adapter.restoreSelection(), false);
  assert.equal(adapter.getState().selectedWallet, null);
});

// --- proving and transactions ---

test('wallet proving provider is passed through when available', async () => {
  const { connector } = mockConnector();
  const adapter = adapterWith({ w: connector });
  await adapter.connect('w');
  const provider = await adapter.getWalletProvingProvider({ getZKIR: async () => new Uint8Array(), getProverKey: async () => new Uint8Array(), getVerifierKey: async () => new Uint8Array() });
  assert.equal(typeof provider.prove, 'function');
});

test('missing wallet proving support reports PROVING_FAILED', async () => {
  const { connector } = mockConnector({ connectImpl: async () => {
    const connected = mockConnected();
    // @ts-ignore simulate a wallet without wallet-side proving (e.g. Lace)
    delete connected.getProvingProvider;
    return connected;
  } });
  const adapter = adapterWith({ w: connector });
  await adapter.connect('w');
  await assert.rejects(
    adapter.getWalletProvingProvider({}),
    error => error instanceof WalletError && error.code === WalletErrorCode.PROVING_FAILED,
  );
});

test('malformed transactions are refused before reaching the wallet', async () => {
  let submitted = 0;
  const { connector } = mockConnector({
    connectImpl: async () => mockConnected({ submitTransaction: async () => { submitted++; } }),
  });
  const adapter = adapterWith({ w: connector });
  await adapter.connect('w');
  await assert.rejects(adapter.submitTransaction(''), error => error instanceof WalletError && error.code === WalletErrorCode.TRANSACTION_FAILED);
  await assert.rejects(adapter.submitTransaction('zz-top'), error => error instanceof WalletError && error.code === WalletErrorCode.TRANSACTION_FAILED);
  assert.equal(submitted, 0);
  await adapter.submitTransaction('ab12');
  assert.equal(submitted, 1);
});

// --- late injection ---

test('watchForWallets resolves late-injecting wallets', async () => {
  const adapter = adapterWith({});
  const scope = {};
  const pending = adapter.watchForWallets({ timeoutMs: 2000, intervalMs: 10, scope });
  const { connector } = mockConnector();
  scope.late = connector;
  const wallets = await pending;
  assert.equal(wallets.length, 1);
});

test('watchForWallets times out to idle with no wallets', async () => {
  const adapter = adapterWith({});
  const wallets = await adapter.watchForWallets({ timeoutMs: 30, intervalMs: 5 });
  assert.deepEqual(wallets, []);
  assert.equal(adapter.getState().status, 'idle');
});

// --- safety helpers ---

test('wallet icon urls are gated for safe rendering', () => {
  assert.equal(isSafeIconUrl('data:image/png;base64,AAA'), true);
  assert.equal(isSafeIconUrl(`data:image/svg+xml;base64,${'A'.repeat(200000)}`), false);
  assert.equal(isSafeIconUrl('javascript:alert(1)'), false);
  assert.equal(isSafeIconUrl('https://evil.example/icon.png'), false);
  assert.equal(isSafeIconUrl(undefined), false);
});

test('addresses truncate for display without mutation', () => {
  assert.equal(truncateAddress('mn_unshield-addr-test-1234567890'), 'mn_unshield-ad…34567890');
  assert.equal(truncateAddress('short'), 'short');
  assert.equal(truncateAddress(undefined), '');
});

// --- official package parity ---

test('connector error codes match the installed official package', () => {
  assert.deepEqual({ ...ErrorCodes }, {
    InternalError: 'InternalError',
    Rejected: 'Rejected',
    InvalidRequest: 'InvalidRequest',
    PermissionRejected: 'PermissionRejected',
    Disconnected: 'Disconnected',
  });
  assert.equal(normalizeWalletError({ type: 'DAppConnectorAPIError', code: 'Disconnected', reason: 'gone' }).code, WalletErrorCode.DISCONNECTED);
});

test('network holder mirrors the official network-id package semantics', t => {
  resetNetworkForTests();
  t.after(resetNetworkForTests);
  assert.throws(() => getNetworkId(), /has not been configured/);
  assert.throws(() => officialGetNetworkId(), /has not been configured/);
  officialSetNetworkId(DEFAULT_NETWORK_ID);
  assert.equal(officialGetNetworkId(), DEFAULT_NETWORK_ID);
  assert.equal(configureNetwork(), DEFAULT_NETWORK_ID);
  assert.equal(getNetworkId(), DEFAULT_NETWORK_ID);
  setNetworkId('preview');
  assert.equal(getNetworkId(), 'preview');
});
