/**
 * ConnectWalletButton — top-level entry point for the wallet flow.
 * Renders a `Connect Midnight Wallet` button when idle, a progress label
 * while discovering/connecting, and a connected chip (`● mn_addr…7fa2`)
 * afterwards. All labels are set via `textContent`.
 */
import { truncateAddress } from '../midnight-wallet-utils.js';

/**
 * @param {HTMLElement} mount Element to render into (emptied on each render).
 * @param {import('../midnight-wallet-adapter.js').MidnightWalletAdapter} store
 * @param {object} [handlers]
 * @param {() => void} [handlers.onOpen] Called when the user clicks (opens the modal).
 * @param {boolean} [handlers.compact] Short labels for tight spaces (top bar).
 * @returns {() => void} Unmount function.
 */
export function mountConnectButton(mount, store, { onOpen, compact = false } = {}) {
  const render = () => {
    mount.replaceChildren();
    const state = store.getState();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = state.status === 'connected' ? 'button secondary wallet-chip' : 'button primary';
    if (state.status === 'connected') {
      const dot = document.createElement('span');
      dot.className = 'wallet-dot';
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      const primary = state.addresses.unshielded ?? state.addresses.shielded ?? state.addresses.dust ?? '';
      label.textContent = primary ? truncateAddress(primary) : 'Connected';
      button.append(dot, label);
      if (!compact) {
        const status = document.createElement('span');
        status.className = 'badge success';
        status.textContent = 'Connected';
        button.append(status);
      }
      button.setAttribute('aria-label', primary ? `Midnight wallet connected: ${primary}. Open wallet details.` : 'Midnight wallet connected. Open wallet details.');
    } else if (state.status === 'connecting' || state.status === 'discovering') {
      button.disabled = true;
      button.textContent = state.status === 'connecting' ? 'Connecting…' : 'Looking for wallets…';
      if (compact) button.textContent = 'Connecting…';
    } else {
      button.textContent = compact ? 'Connect' : 'Connect Midnight Wallet';
      if (compact) button.setAttribute('aria-label', 'Connect Midnight Wallet');
    }
    button.addEventListener('click', () => onOpen?.());
    mount.append(button);
  };
  render();
  store.addEventListener('change', render);
  return () => store.removeEventListener('change', render);
}
