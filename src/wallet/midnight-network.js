/**
 * Application network holder — equivalent of the official
 * `@midnight-ntwrk/midnight-js-network-id` global (`setNetworkId` throws-free
 * setter, `getNetworkId` throws when unconfigured). Implemented locally so the
 * dependency-free browser bundle keeps working; semantics are parity-tested
 * against the installed package in `tests/wallet-adapter.test.js`.
 *
 * Call {@link configureNetwork} once during application initialization, before
 * any wallet or contract operation.
 */
import { DEFAULT_NETWORK_ID } from './midnight-wallet-types.js';

let currentNetworkId;

/**
 * @param {string} id A valid named Midnight network id (e.g. `'preprod'`).
 */
export function setNetworkId(id) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('setNetworkId requires a non-empty network id.');
  currentNetworkId = id;
}

/**
 * @returns {string} The configured network id.
 * @throws {Error} When {@link setNetworkId} has not been called.
 */
export function getNetworkId() {
  if (currentNetworkId === undefined) {
    throw new Error('Network ID has not been configured. Call setNetworkId() before any wallet or contract operation.');
  }
  return currentNetworkId;
}

/** Reset holder state. Used by tests only. */
export function resetNetworkForTests() {
  currentNetworkId = undefined;
}

/**
 * Configure the network once at startup. Safe to call repeatedly with the
 * same id; throws on conflicting reconfiguration.
 *
 * @param {string} [id] Defaults to {@link DEFAULT_NETWORK_ID}.
 * @returns {string} The configured id.
 */
export function configureNetwork(id = DEFAULT_NETWORK_ID) {
  if (currentNetworkId !== undefined && currentNetworkId !== id) {
    throw new Error(`Network already configured as "${currentNetworkId}"; refusing "${id}".`);
  }
  setNetworkId(id);
  return id;
}
