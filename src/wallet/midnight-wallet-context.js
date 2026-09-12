/**
 * Wallet store — the vanilla-JS equivalent of the React context + hook pair.
 *
 * Architecture (mirrors the requested React shape without a framework):
 *
 *   UI components
 *        ↓  useMidnightWallet()
 *   wallet store (this module, singleton)
 *        ↓
 *   MidnightWalletAdapter
 *        ↓  DApp Connector API
 *   installed wallet
 *
 * Components subscribe to `change` events and re-render from
 * `useMidnightWallet()`, which returns a live snapshot plus bound actions —
 * the same surface the React hook would expose.
 */
import { MidnightWalletAdapter } from './midnight-wallet-adapter.js';
import { DEFAULT_NETWORK_ID } from './midnight-wallet-types.js';
import { configureNetwork } from './midnight-network.js';

let singleton = null;

/**
 * @param {object} [options] Adapter options (`networkId`, `storage`, `scope`).
 * @returns {MidnightWalletAdapter} The shared adapter instance.
 */
export function getWalletStore(options) {
  if (options && singleton) {
    throw new Error('Wallet store already initialized. Pass options only on first call.');
  }
  if (!singleton) singleton = new MidnightWalletAdapter(options);
  return singleton;
}

/** Reset the singleton. Used by tests only. */
export function resetWalletStoreForTests() {
  singleton = null;
}

/**
 * Initialize once at application startup (client-side only): configures the
 * Midnight network id a single time, then starts background wallet discovery
 * so late-injecting extensions are picked up without blocking first paint.
 *
 * @param {object} [options]
 * @param {string} [options.networkId]
 * @param {unknown} [options.scope]
 * @returns {MidnightWalletAdapter}
 */
export function initWalletStore({ networkId = DEFAULT_NETWORK_ID, scope } = {}) {
  const store = getWalletStore({ networkId, scope });
  configureNetwork(networkId);
  if (typeof window !== 'undefined') {
    store.restoreSelection(scope);
    void store.watchForWallets({ timeoutMs: 3000, scope }).catch(() => {});
  }
  return store;
}

/**
 * Application entry point for UI code — the `useMidnightWallet()` equivalent.
 * Returns the current snapshot plus bound actions; re-call after each
 * `change` event for fresh state.
 *
 * @example
 *   const { wallets, status, connect } = useMidnightWallet();
 *   if (status !== 'connected') return renderConnectButton(connect);
 */
export function useMidnightWallet() {
  const store = getWalletStore();
  const state = store.getState();
  return {
    wallets: state.wallets,
    selectedWallet: state.selectedWallet,
    wallet: state.selectedWallet,
    connectedApi: state.connectedApi,
    status: state.status,
    error: state.error,
    addresses: state.addresses,
    balances: state.balances,
    configuration: state.configuration,
    networkId: state.networkId,
    loadWarnings: state.loadWarnings,
    connect: (walletId, options) => store.connect(walletId, options),
    disconnect: () => store.disconnect(),
    reconnect: options => store.reconnect(options),
    refreshBalances: () => store.refreshBalances(),
    checkConnection: () => store.checkConnection(),
    discover: options => store.discover(options),
    subscribe: listener => {
      store.addEventListener('change', listener);
      return () => store.removeEventListener('change', listener);
    },
  };
}
