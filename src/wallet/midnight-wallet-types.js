/**
 * Midnight multi-wallet adapter — shared types and constants.
 *
 * This project is vanilla ESM with no bundler, so the browser runtime stays
 * dependency-free. The JSDoc `import()` types below resolve through the
 * installed `@midnight-ntwrk/dapp-connector-api` package (exact version pinned
 * in package.json) for editor support; the runtime code only relies on the
 * documented connector shape, verified against v4.0.1:
 *
 *   window.midnight = { [injectionKey]: InitialAPI }
 *   InitialAPI = { rdns, name, icon, apiVersion, connect(networkId) }
 *
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').InitialAPI} ConnectorInitialAPI
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').ConnectedAPI} ConnectorConnectedAPI
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').Configuration} ConnectorConfiguration
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').ConnectionStatus} ConnectorConnectionStatus
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').KeyMaterialProvider} ConnectorKeyMaterialProvider
 * @typedef {import('@midnight-ntwrk/dapp-connector-api').ProvingProvider} ConnectorProvingProvider
 */

/**
 * Application-level view of one discovered wallet. The `id` is the key under
 * which the wallet injected itself into `window.midnight` (v4 uses UUID keys,
 * older wallets use friendly keys such as `mnLace`). Never hard-code ids —
 * always discover.
 *
 * @typedef {object} MidnightWalletInfo
 * @property {string} id Injection key in `window.midnight`.
 * @property {string} rdns Reverse-DNS wallet identifier from the connector.
 * @property {string} name Display name from the connector (untrusted input).
 * @property {string} [icon] Icon URL or data URL from the connector (untrusted input).
 * @property {string} apiVersion Connector API version implemented by the wallet.
 * @property {boolean} compatible Whether `apiVersion` satisfies SUPPORTED_CONNECTOR_RANGE.
 */

/** @typedef {'idle' | 'discovering' | 'connecting' | 'connected' | 'error'} WalletStatus */

/**
 * @typedef {object} WalletAddresses
 * @property {string} [shielded]
 * @property {string} [shieldedCoinPublicKey]
 * @property {string} [shieldedEncryptionPublicKey]
 * @property {string} [unshielded]
 * @property {string} [dust]
 */

/**
 * Token balances keyed by token type. Values stay `bigint` — never convert to
 * `number` (precision loss on large blockchain values).
 *
 * @typedef {object} WalletBalances
 * @property {Record<string, bigint>} [shielded]
 * @property {Record<string, bigint>} [unshielded]
 * @property {{ balance: bigint, cap: bigint }} [dust]
 */

/**
 * Normalized application error codes. Wallet connector rejections are mapped
 * here so UI copy stays stable regardless of which wallet produced the error.
 */
export const WalletErrorCode = Object.freeze({
  NO_WALLET: 'NO_WALLET',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  UNSUPPORTED_CONNECTOR_VERSION: 'UNSUPPORTED_CONNECTOR_VERSION',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  CONNECT_FAILED: 'CONNECT_FAILED',
  CONFIGURATION_FAILED: 'CONFIGURATION_FAILED',
  PROVING_FAILED: 'PROVING_FAILED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  DISCONNECTED: 'DISCONNECTED',
});

/**
 * Application error thrown by the adapter. `details` carries machine-readable
 * context (e.g. `{ expected, actual }` for NETWORK_MISMATCH); `message` is
 * safe, human-readable UI copy.
 */
export class WalletError extends Error {
  /**
   * @param {string} code One of {@link WalletErrorCode}.
   * @param {string} message Human-readable message, safe to render as text.
   * @param {Record<string, unknown>} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Connector API versions this adapter speaks. Caret semantics on the major
 * version the adapter was verified against (`4.x`). Wallet-specific branches
 * are intentionally absent: any injected connector satisfying this range
 * works with zero application changes.
 */
export const SUPPORTED_CONNECTOR_RANGE = '^4.0.0';

/** Default Midnight network. Matches the server's Preprod probe. */
export const DEFAULT_NETWORK_ID = 'preprod';

/** localStorage key holding the selected wallet injection key only. Never secrets. */
export const SELECTED_WALLET_STORAGE_KEY = 'midnight.wallet.selectedId.v1';

/** Methods hinted to the wallet after connect (best-effort, helps permission UX). */
export const CONNECT_HINT_METHODS = Object.freeze([
  'getConfiguration',
  'getConnectionStatus',
  'getUnshieldedAddress',
  'getShieldedAddresses',
  'getDustAddress',
  'getShieldedBalances',
  'getUnshieldedBalances',
  'getDustBalance',
]);

/** Friendly UI copy per error code. */
export const WALLET_ERROR_MESSAGES = Object.freeze({
  [WalletErrorCode.NO_WALLET]: 'No compatible Midnight wallet detected.',
  [WalletErrorCode.WALLET_NOT_FOUND]: 'The selected wallet is no longer available.',
  [WalletErrorCode.UNSUPPORTED_CONNECTOR_VERSION]:
    'Wallet detected but connector API version is unsupported.',
  [WalletErrorCode.USER_REJECTED]: 'Connection request was rejected in your wallet.',
  [WalletErrorCode.NETWORK_MISMATCH]: 'Wrong Midnight network.',
  [WalletErrorCode.CONNECT_FAILED]: 'Could not connect to the wallet.',
  [WalletErrorCode.CONFIGURATION_FAILED]: 'Could not read wallet configuration.',
  [WalletErrorCode.PROVING_FAILED]: 'Wallet proving failed.',
  [WalletErrorCode.TRANSACTION_REJECTED]: 'Transaction was rejected in your wallet.',
  [WalletErrorCode.TRANSACTION_FAILED]: 'Transaction submission failed.',
  [WalletErrorCode.DISCONNECTED]: 'The wallet connection was lost.',
});
