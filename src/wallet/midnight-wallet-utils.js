/**
 * Midnight wallet utilities — pure, side-effect-free helpers.
 *
 * Nothing in this module touches `window` at import time, so it is safe to
 * import during SSR, in tests, and in workers. All functions that read the
 * injected scope accept an explicit `scope` parameter defaulting to the live
 * `window.midnight` object.
 */
import {
  SUPPORTED_CONNECTOR_RANGE,
  WALLET_ERROR_MESSAGES,
  WalletError,
  WalletErrorCode,
} from './midnight-wallet-types.js';

/** @returns {boolean} True only in a browser-like environment. */
export function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * @param {unknown} [scope] Defaults to the live injected scope.
 * @returns {Record<string, unknown>} The `window.midnight` object or `{}`.
 */
export function getInjectedScope(scope) {
  if (scope !== undefined) return scope !== null && typeof scope === 'object' ? scope : {};
  if (!isBrowser() || !window.midnight || typeof window.midnight !== 'object') return {};
  return window.midnight;
}

/**
 * @param {unknown} value Candidate injected connector.
 * @returns {boolean} True when the value has the InitialAPI shape we need.
 */
export function isConnectorShape(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof value.connect === 'function' &&
    typeof value.name === 'string' &&
    typeof value.apiVersion === 'string'
  );
}

/**
 * Discover all compatible injected Midnight wallets. No wallet ids are
 * hard-coded: every entry of `window.midnight` with the connector shape is
 * returned, so future standards-compatible wallets work with zero changes.
 * The injection key becomes the wallet id; `rdns`/`name` come from metadata.
 *
 * @param {unknown} [scope] Optional scope override (tests, SSR).
 * @returns {import('./midnight-wallet-types.js').MidnightWalletInfo[]} Compatible entries.
 */
export function discoverWallets(scope) {
  const injected = getInjectedScope(scope);
  const wallets = [];
  for (const id of Object.keys(injected)) {
    const connector = injected[id];
    if (!isConnectorShape(connector)) continue;
    wallets.push({
      id,
      rdns: typeof connector.rdns === 'string' ? connector.rdns : id,
      name: connector.name,
      icon: typeof connector.icon === 'string' ? connector.icon : undefined,
      apiVersion: connector.apiVersion,
      compatible: isCompatibleVersion(connector.apiVersion, SUPPORTED_CONNECTOR_RANGE),
    });
  }
  return wallets;
}

/**
 * Parse `major.minor.patch` (tolerates leading `v` and prerelease suffixes).
 * @param {string} version
 * @returns {{ major: number, minor: number, patch: number } | null}
 */
export function parseVersion(version) {
  if (typeof version !== 'string') return null;
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/**
 * Minimal semver check for the ranges this adapter uses (`^4.0.0`, `4.x`,
 * `>=4.0.0`, exact pins). Implemented locally to keep the browser runtime
 * dependency-free.
 *
 * @param {string} version Wallet-reported `apiVersion`.
 * @param {string} range Supported range (defaults to the adapter range).
 * @returns {boolean}
 */
export function isCompatibleVersion(version, range = SUPPORTED_CONNECTOR_RANGE) {
  const parsed = parseVersion(version);
  if (!parsed) return false;
  const wanted = String(range).trim();
  let caret = wanted.match(/^\^v?(\d+)\.(\d+)\.(\d+)$/);
  if (caret) {
    const [major, minor, patch] = [Number(caret[1]), Number(caret[2]), Number(caret[3])];
    if (major > 0) return parsed.major === major && (parsed.minor > minor || (parsed.minor === minor && parsed.patch >= patch));
    if (minor > 0) return parsed.major === 0 && parsed.minor === minor && parsed.patch >= patch;
    return parsed.major === 0 && parsed.minor === 0 && parsed.patch === patch;
  }
  const xRange = wanted.match(/^v?(\d+)\.(x|\*)(?:\.(x|\*))?$/i);
  if (xRange) return parsed.major === Number(xRange[1]);
  const gte = wanted.match(/^>=v?(\d+)\.(\d+)\.(\d+)$/);
  if (gte) {
    const [major, minor, patch] = [Number(gte[1]), Number(gte[2]), Number(gte[3])];
    return (
      parsed.major > major ||
      (parsed.major === major && (parsed.minor > minor || (parsed.minor === minor && parsed.patch >= patch)))
    );
  }
  const exact = parseVersion(wanted);
  if (exact) return parsed.major === exact.major && parsed.minor === exact.minor && parsed.patch === exact.patch;
  return false;
}

/**
 * @param {unknown} error
 * @returns {boolean} True for official DApp Connector API errors.
 */
export function isConnectorApiError(error) {
  return !!error && typeof error === 'object' && error.type === 'DAppConnectorAPIError';
}

/** @param {unknown} error @returns {string} Lower-cased message fragment. */
function errorText(error) {
  if (typeof error === 'string') return error.toLowerCase();
  if (error && typeof error === 'object') {
    const parts = [error.reason, error.message].filter(part => typeof part === 'string');
    if (parts.length) return parts.join(' ').toLowerCase();
  }
  return '';
}

/**
 * Normalize any thrown value into a {@link WalletError} with stable,
 * wallet-independent UI copy. Detailed originals stay on `details.cause` for
 * development logs only — never render those.
 *
 * @param {unknown} error Thrown value.
 * @param {string} [fallbackCode] Used when nothing matches.
 * @returns {WalletError}
 */
export function normalizeWalletError(error, fallbackCode = WalletErrorCode.CONNECT_FAILED) {
  if (error instanceof WalletError) return error;
  if (isConnectorApiError(error)) {
    if (error.code === 'Rejected' || error.code === 'PermissionRejected') {
      return new WalletError(WalletErrorCode.USER_REJECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.USER_REJECTED], { cause: error });
    }
    if (error.code === 'Disconnected') {
      return new WalletError(WalletErrorCode.DISCONNECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.DISCONNECTED], { cause: error });
    }
    return new WalletError(fallbackCode, WALLET_ERROR_MESSAGES[fallbackCode] ?? 'Wallet request failed.', { cause: error });
  }
  const text = errorText(error);
  if (
    error instanceof DOMException
      ? error.name === 'AbortError'
      : /reject|denied|cancelled|canceled|dismiss|closed by user|user closed/.test(text)
  ) {
    return new WalletError(WalletErrorCode.USER_REJECTED, WALLET_ERROR_MESSAGES[WalletErrorCode.USER_REJECTED], { cause: error });
  }
  if (error instanceof Error && error.message) {
    return new WalletError(fallbackCode, WALLET_ERROR_MESSAGES[fallbackCode] ?? 'Wallet request failed.', { cause: error });
  }
  return new WalletError(fallbackCode, WALLET_ERROR_MESSAGES[fallbackCode] ?? 'Wallet request failed.', { cause: error });
}

/**
 * Wallet metadata is untrusted input. Only `data:image/*` URLs and same-origin
 * `http(s)` URLs are rendered; anything else (including remote hosts, which
 * the app Content-Security-Policy would block anyway) falls back to a glyph.
 *
 * @param {string} [url]
 * @returns {boolean}
 */
export function isSafeIconUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(url)) return url.length <= 100000;
  if (!isBrowser()) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * @param {string} [address]
 * @returns {string} Truncated `mn_addr…7fa2`-style label (pure text).
 */
export function truncateAddress(address) {
  if (typeof address !== 'string' || !address) return '';
  return address.length <= 24 ? address : `${address.slice(0, 14)}…${address.slice(-8)}`;
}

/**
 * @param {unknown} value
 * @param {number} [maxLength]
 * @returns {boolean} Basic sanity check for wallet-provided address strings.
 */
export function isPlausibleAddress(value, maxLength = 512) {
  return typeof value === 'string' && value.length >= 8 && value.length <= maxLength && !/\s/.test(value);
}

/**
 * Format a token amount without precision loss.
 * @param {bigint} [value]
 * @returns {string}
 */
export function formatTokenAmount(value) {
  return typeof value === 'bigint' ? value.toString() : '';
}
