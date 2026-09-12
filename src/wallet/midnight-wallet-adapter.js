/**
 * Midnight multi-wallet adapter.
 *
 * Single choke point between the application and every injected Midnight
 * wallet. The rest of the app must NOT touch `window.midnight` directly.
 *
 * Verified against `@midnight-ntwrk/dapp-connector-api` v4.0.1:
 * - discovery scans `Object.values(window.midnight)` (UUID keys in v4,
 *   friendly keys like `mnLace` in older wallets) — no hardcoded wallet ids.
 * - `connect(networkId)` is called with NO awaits before it inside the user
 *   gesture handler, so the wallet authorization popup is never blocked.
 * - network is validated via `getConnectionStatus()` after connect.
 * - the v4 API exposes no wallet-level `disconnect()`; disconnect is
 *   application-level (clear refs/state), with feature-detection in case a
 *   future connector adds one.
 */
import {
  CONNECT_HINT_METHODS,
  DEFAULT_NETWORK_ID,
  SELECTED_WALLET_STORAGE_KEY,
  WALLET_ERROR_MESSAGES,
  WalletError,
  WalletErrorCode,
} from './midnight-wallet-types.js';
import {
  discoverWallets,
  getInjectedScope,
  isConnectorShape,
  isPlausibleAddress,
  normalizeWalletError,
} from './midnight-wallet-utils.js';

/**
 * @param {unknown} storage Candidate storage.
 * @returns {{ getItem: Function, setItem: Function, removeItem: Function } | null}
 */
function asStorage(storage) {
  try {
    if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  } catch {
    /* storage unavailable (SSR, private mode) */
  }
  return null;
}

function liveLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return asStorage(window.localStorage);
  } catch {
    /* ignored */
  }
  return null;
}

/** @param {unknown} tx @returns {boolean} Non-empty hex string. */
function isTxHex(tx) {
  return typeof tx === 'string' && tx.length >= 2 && tx.length <= 2_000_000 && /^[0-9a-fA-F]+$/.test(tx);
}

export class MidnightWalletAdapter extends EventTarget {
  #expectedNetworkId;
  #storage;
  #defaultScope;
  #connectedApi = null;
  #state;

  /**
   * @param {object} [options]
   * @param {string} [options.networkId] Expected Midnight network (default `preprod`).
   * @param {unknown} [options.storage] localStorage-compatible store (wallet id only).
   * @param {unknown} [options.scope] Default injected scope override (tests).
   */
  constructor({ networkId = DEFAULT_NETWORK_ID, storage, scope } = {}) {
    super();
    this.#expectedNetworkId = networkId;
    this.#storage = asStorage(storage) ?? liveLocalStorage();
    this.#defaultScope = scope;
    this.#state = {
      status: 'idle',
      wallets: [],
      selectedWallet: null,
      error: null,
      addresses: {},
      balances: {},
      configuration: null,
      networkId,
      loadWarnings: [],
    };
  }

  /** @returns {object} Frozen snapshot of the current state. */
  getState() {
    const state = this.#state;
    return Object.freeze({
      ...state,
      wallets: [...state.wallets],
      addresses: { ...state.addresses },
      balances: { ...state.balances },
      configuration: state.configuration ? { ...state.configuration } : null,
      loadWarnings: [...state.loadWarnings],
      connectedApi: this.#connectedApi,
    });
  }

  #update(patch) {
    this.#state = { ...this.#state, ...patch };
    this.dispatchEvent(new Event('change'));
  }

  #scopeFor(scope) {
    return scope !== undefined ? scope : (this.#defaultScope ?? getInjectedScope());
  }

  /**
   * Re-scan the injected scope for compatible wallets. Preserves the selected
   * wallet when it is still present.
   * @param {unknown} [scope]
   * @returns {import('./midnight-wallet-types.js').MidnightWalletInfo[]}
   */
  discover(scope) {
    const wallets = discoverWallets(this.#scopeFor(scope));
    const selectedStillThere = this.#state.selectedWallet && wallets.some(w => w.id === this.#state.selectedWallet.id);
    this.#update({
      wallets,
      selectedWallet: selectedStillThere ? wallets.find(w => w.id === this.#state.selectedWallet.id) : this.#state.selectedWallet,
    });
    return [...wallets];
  }

  /**
   * Poll for late-injecting wallets (extensions inject after
   * `DOMContentLoaded`). Resolves with whatever was found by the deadline —
   * possibly an empty list.
   * @param {object} [options]
   * @param {number} [options.timeoutMs]
   * @param {number} [options.intervalMs]
   * @param {AbortSignal} [options.signal]
   * @param {unknown} [options.scope]
   */
  async watchForWallets({ timeoutMs = 3000, intervalMs = 100, signal, scope } = {}) {
    this.#update({ status: this.#state.status === 'idle' ? 'discovering' : this.#state.status });
    const deadline = Date.now() + Math.max(0, timeoutMs);
    for (;;) {
      if (signal?.aborted) break;
      const wallets = this.discover(scope);
      if (wallets.length > 0 || Date.now() >= deadline) break;
      await new Promise(resolve => setTimeout(resolve, Math.max(10, intervalMs)));
    }
    if (this.#state.status === 'discovering') this.#update({ status: 'idle' });
    return [...this.#state.wallets];
  }

  /**
   * Connect to a discovered wallet. Call directly from a user-gesture
   * handler: no await happens before `connector.connect()`, preserving the
   * activation the wallet popup needs.
   * @param {string} walletId Injection key from discovery.
   * @param {object} [options]
   * @param {unknown} [options.scope]
   */
  async connect(walletId, { scope } = {}) {
    if (this.#state.status === 'connecting') return this.getState();
    const resolvedScope = this.#scopeFor(scope);
    const wallets = this.discover(resolvedScope);
    const wallet = wallets.find(entry => entry.id === walletId);
    if (!wallet) {
      const error = new WalletError(WalletErrorCode.WALLET_NOT_FOUND, WALLET_ERROR_MESSAGES[WalletErrorCode.WALLET_NOT_FOUND], { walletId });
      this.#update({ status: 'error', error });
      throw error;
    }
    if (!wallet.compatible) {
      const error = new WalletError(
        WalletErrorCode.UNSUPPORTED_CONNECTOR_VERSION,
        WALLET_ERROR_MESSAGES[WalletErrorCode.UNSUPPORTED_CONNECTOR_VERSION],
        { walletId, apiVersion: wallet.apiVersion },
      );
      this.#update({ status: 'error', selectedWallet: wallet, error });
      throw error;
    }
    const connector = resolvedScope[walletId];
    if (!isConnectorShape(connector)) {
      const error = new WalletError(WalletErrorCode.WALLET_NOT_FOUND, WALLET_ERROR_MESSAGES[WalletErrorCode.WALLET_NOT_FOUND], { walletId });
      this.#update({ status: 'error', error });
      throw error;
    }
    this.#update({ status: 'connecting', selectedWallet: wallet, error: null, loadWarnings: [] });

    let connected;
    try {
      connected = await connector.connect(this.#expectedNetworkId);
    } catch (cause) {
      const error = normalizeWalletError(cause, WalletErrorCode.CONNECT_FAILED);
      this.#update({ status: 'error', error });
      throw error;
    }
    if (!connected || typeof connected !== 'object') {
      const error = new WalletError(WalletErrorCode.CONNECT_FAILED, WALLET_ERROR_MESSAGES[WalletErrorCode.CONNECT_FAILED], { walletId });
      this.#update({ status: 'error', error });
      throw error;
    }

    let connectionStatus = null;
    try {
      connectionStatus = await connected.getConnectionStatus();
    } catch (cause) {
      const error = normalizeWalletError(cause, WalletErrorCode.CONNECT_FAILED);
      this.#update({ status: 'error', error });
      throw error;
    }
    if (!connectionStatus || connectionStatus.status !== 'connected') {
      const error = new WalletError(WalletErrorCode.DISCONNECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.DISCONNECTED], { walletId });
      this.#update({ status: 'error', error });
      throw error;
    }
    if (connectionStatus.networkId !== this.#expectedNetworkId) {
      const error = new WalletError(WalletErrorCode.NETWORK_MISMATCH,
        `${WALLET_ERROR_MESSAGES[WalletErrorCode.NETWORK_MISMATCH]} Expected: ${this.#expectedNetworkId}. Connected: ${connectionStatus.networkId}.`,
        { walletId, expected: this.#expectedNetworkId, actual: connectionStatus.networkId });
      this.#update({ status: 'error', error });
      throw error;
    }

    this.#connectedApi = connected;
    try {
      if (typeof connected.hintUsage === 'function') await connected.hintUsage([...CONNECT_HINT_METHODS]);
    } catch {
      /* best-effort only */
    }
    await this.#loadDetails();
    try {
      this.#storage?.setItem(SELECTED_WALLET_STORAGE_KEY, wallet.id);
    } catch {
      /* persistence is optional */
    }
    this.#update({ status: 'connected', error: null });
    return this.getState();
  }

  async #loadDetails() {
    const warnings = [];
    const connected = this.#connectedApi;
    if (!connected) return;
    let configuration = null;
    try {
      const raw = await connected.getConfiguration();
      if (raw && typeof raw === 'object') {
        configuration = {
          indexerUri: typeof raw.indexerUri === 'string' ? raw.indexerUri : undefined,
          indexerWsUri: typeof raw.indexerWsUri === 'string' ? raw.indexerWsUri : undefined,
          proverServerUri: typeof raw.proverServerUri === 'string' ? raw.proverServerUri : undefined,
          substrateNodeUri: typeof raw.substrateNodeUri === 'string' ? raw.substrateNodeUri : undefined,
          networkId: typeof raw.networkId === 'string' ? raw.networkId : undefined,
        };
      }
    } catch (cause) {
      warnings.push({ section: 'configuration', ...this.#warningOf(cause, WalletErrorCode.CONFIGURATION_FAILED) });
    }
    const addresses = await this.#loadAddresses(warnings);
    const balances = await this.#loadBalances(warnings);
    this.#update({ configuration, addresses, balances, loadWarnings: warnings });
  }

  async #loadAddresses(warnings) {
    const connected = this.#connectedApi;
    const addresses = {};
    const take = value => (isPlausibleAddress(value) ? value : undefined);
    try {
      const shielded = await connected.getShieldedAddresses();
      if (shielded && typeof shielded === 'object') {
        if (take(shielded.shieldedAddress)) addresses.shielded = shielded.shieldedAddress;
        if (take(shielded.shieldedCoinPublicKey)) addresses.shieldedCoinPublicKey = shielded.shieldedCoinPublicKey;
        if (take(shielded.shieldedEncryptionPublicKey)) addresses.shieldedEncryptionPublicKey = shielded.shieldedEncryptionPublicKey;
      }
    } catch (cause) {
      warnings.push({ section: 'shielded-address', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    try {
      const unshielded = await connected.getUnshieldedAddress();
      if (unshielded && typeof unshielded === 'object' && take(unshielded.unshieldedAddress)) {
        addresses.unshielded = unshielded.unshieldedAddress;
      }
    } catch (cause) {
      warnings.push({ section: 'unshielded-address', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    try {
      const dust = await connected.getDustAddress();
      if (dust && typeof dust === 'object' && take(dust.dustAddress)) addresses.dust = dust.dustAddress;
    } catch (cause) {
      warnings.push({ section: 'dust-address', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    return addresses;
  }

  async #loadBalances(warnings) {
    const connected = this.#connectedApi;
    const balances = {};
    try {
      const shielded = await connected.getShieldedBalances();
      if (shielded && typeof shielded === 'object') balances.shielded = { ...shielded };
    } catch (cause) {
      warnings.push({ section: 'shielded-balances', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    try {
      const unshielded = await connected.getUnshieldedBalances();
      if (unshielded && typeof unshielded === 'object') balances.unshielded = { ...unshielded };
    } catch (cause) {
      warnings.push({ section: 'unshielded-balances', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    try {
      const dust = await connected.getDustBalance();
      if (dust && typeof dust === 'object' && typeof dust.balance === 'bigint' && typeof dust.cap === 'bigint') {
        balances.dust = { balance: dust.balance, cap: dust.cap };
      }
    } catch (cause) {
      warnings.push({ section: 'dust-balance', ...this.#warningOf(cause, WalletErrorCode.CONNECT_FAILED) });
    }
    return balances;
  }

  #warningOf(cause, code) {
    const normalized = normalizeWalletError(cause, code);
    return { code: normalized.code, message: normalized.message };
  }

  /** Re-read balances without disturbing the connection. Failures become warnings. */
  async refreshBalances() {
    if (!this.#connectedApi || this.#state.status !== 'connected') return this.getState();
    const warnings = this.#state.loadWarnings.filter(warning => !warning.section.endsWith('balances') && warning.section !== 'dust-balance');
    const balances = await this.#loadBalances(warnings);
    this.#update({ balances, loadWarnings: warnings });
    return this.getState();
  }

  /** Re-check the wallet connection status (cheap liveness probe). */
  async checkConnection() {
    if (!this.#connectedApi) return this.getState();
    let connectionStatus = null;
    try {
      connectionStatus = await this.#connectedApi.getConnectionStatus();
    } catch (cause) {
      return this.#markLost(normalizeWalletError(cause, WalletErrorCode.DISCONNECTED));
    }
    if (!connectionStatus || connectionStatus.status !== 'connected' || connectionStatus.networkId !== this.#expectedNetworkId) {
      return this.#markLost(new WalletError(WalletErrorCode.DISCONNECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.DISCONNECTED], { connectionStatus }));
    }
    return this.getState();
  }

  #markLost(error) {
    this.#connectedApi = null;
    this.#update({ status: 'error', error, addresses: {}, balances: {}, configuration: null });
    return this.getState();
  }

  /**
   * Application-level disconnect. The v4 connector exposes no wallet-level
   * disconnect, so this clears our references and cached state. If a future
   * connector adds one, it is invoked best-effort.
   */
  async disconnect() {
    const connected = this.#connectedApi;
    if (connected && typeof connected.disconnect === 'function') {
      try {
        await connected.disconnect();
      } catch {
        /* application state is cleared regardless */
      }
    }
    this.#connectedApi = null;
    try {
      this.#storage?.removeItem(SELECTED_WALLET_STORAGE_KEY);
    } catch {
      /* ignored */
    }
    this.#update({
      status: 'idle',
      selectedWallet: null,
      error: null,
      addresses: {},
      balances: {},
      configuration: null,
      loadWarnings: [],
    });
    return this.getState();
  }

  /**
   * Restore a previously selected wallet id without connecting (no popup).
   * The user reconnects explicitly with one click.
   * @param {unknown} [scope]
   * @returns {boolean} True when a stored wallet is still injected.
   */
  restoreSelection(scope) {
    const wallets = this.discover(scope);
    let stored = null;
    try {
      stored = this.#storage?.getItem(SELECTED_WALLET_STORAGE_KEY) ?? null;
    } catch {
      stored = null;
    }
    if (typeof stored !== 'string' || !stored) return false;
    const wallet = wallets.find(entry => entry.id === stored);
    if (!wallet) return false;
    this.#update({ selectedWallet: wallet });
    return true;
  }

  /** Reconnect to the currently selected wallet. */
  async reconnect({ scope } = {}) {
    if (!this.#state.selectedWallet) {
      const error = new WalletError(WalletErrorCode.WALLET_NOT_FOUND, WALLET_ERROR_MESSAGES[WalletErrorCode.WALLET_NOT_FOUND], {});
      this.#update({ status: 'error', error });
      throw error;
    }
    return this.connect(this.#state.selectedWallet.id, { scope });
  }

  #requireConnected() {
    if (!this.#connectedApi || this.#state.status !== 'connected') {
      throw new WalletError(WalletErrorCode.DISCONNECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.DISCONNECTED], {});
    }
    return this.#connectedApi;
  }

  /**
   * Delegate ZK proving to the wallet (feature-detected). Wallets without
   * `getProvingProvider` (e.g. Lace) must use another proving modality.
   * @param {import('./midnight-wallet-types.js').ConnectorKeyMaterialProvider} keyMaterialProvider
   */
  async getWalletProvingProvider(keyMaterialProvider) {
    const connected = this.#requireConnected();
    if (typeof connected.getProvingProvider !== 'function') {
      throw new WalletError(WalletErrorCode.PROVING_FAILED, 'This wallet does not expose wallet-side proving.', { walletId: this.#state.selectedWallet?.id });
    }
    try {
      return await connected.getProvingProvider(keyMaterialProvider);
    } catch (cause) {
      throw normalizeWalletError(cause, WalletErrorCode.PROVING_FAILED);
    }
  }

  /**
   * Balance a sealed/unsealed serialized transaction via the wallet.
   * @param {string} tx Hex-serialized transaction.
   * @param {boolean} sealed True for `balanceSealedTransaction`.
   */
  async balanceTransaction(tx, sealed = false) {
    const connected = this.#requireConnected();
    if (!isTxHex(tx)) throw new WalletError(WalletErrorCode.TRANSACTION_FAILED, 'Refusing to balance an empty or malformed transaction.', {});
    const method = sealed ? 'balanceSealedTransaction' : 'balanceUnsealedTransaction';
    if (typeof connected[method] !== 'function') {
      throw new WalletError(WalletErrorCode.TRANSACTION_FAILED, 'This wallet does not support transaction balancing.', {});
    }
    try {
      return await connected[method](tx);
    } catch (cause) {
      throw normalizeWalletError(cause, WalletErrorCode.TRANSACTION_FAILED);
    }
  }

  /**
   * Submit a balanced, sealed transaction through the wallet relayer.
   * @param {string} tx Hex-serialized transaction.
   */
  async submitTransaction(tx) {
    const connected = this.#requireConnected();
    if (!isTxHex(tx)) throw new WalletError(WalletErrorCode.TRANSACTION_FAILED, 'Refusing to submit an empty or malformed transaction.', {});
    try {
      await connected.submitTransaction(tx);
    } catch (cause) {
      const normalized = normalizeWalletError(cause, WalletErrorCode.TRANSACTION_FAILED);
      if (normalized.code === WalletErrorCode.USER_REJECTED) {
        throw new WalletError(WalletErrorCode.TRANSACTION_REJECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.TRANSACTION_REJECTED], normalized.details);
      }
      throw normalized;
    }
  }
}
