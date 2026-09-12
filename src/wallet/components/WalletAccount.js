/**
 * WalletAccount — connected-state panel (network, addresses, DUST balance,
 * wallet configuration, warnings, actions). Rendered inline in the Connections
 * view. Values are the user's own; amounts render via `String(bigint)` so no
 * precision is lost.
 */
import { formatTokenAmount, truncateAddress } from '../midnight-wallet-utils.js';

/**
 * @param {HTMLElement} mount Element to render into.
 * @param {import('../midnight-wallet-adapter.js').MidnightWalletAdapter} store
 * @returns {() => void} Unmount function.
 */
export function mountWalletAccount(mount, store) {
  const render = () => {
    mount.replaceChildren();
    const state = store.getState();
    if (state.status !== 'connected' || !state.selectedWallet) {
      const idle = document.createElement('p');
      idle.className = 'muted empty-line';
      idle.textContent = 'Not connected. Choose a wallet to connect on the Midnight Preprod network.';
      mount.append(idle);
      return;
    }

    const list = document.createElement('dl');
    list.className = 'details-list';
    const addRow = (term, value) => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      if (typeof value === 'string') {
        const code = document.createElement('code');
        code.textContent = value;
        code.title = value;
        dd.append(code);
      } else {
        dd.append(value);
      }
      wrap.append(dt, dd);
      list.append(wrap);
    };

    const network = document.createElement('span');
    network.className = 'badge success';
    network.textContent = state.networkId;
    addRow('Wallet', state.selectedWallet.name);
    addRow('Network', network);
    if (state.addresses.unshielded) addRow('Unshielded', truncateAddress(state.addresses.unshielded));
    if (state.addresses.shielded) addRow('Shielded', truncateAddress(state.addresses.shielded));
    if (state.addresses.dust) addRow('DUST address', truncateAddress(state.addresses.dust));
    if (state.balances.dust) {
      addRow('DUST balance', `${formatTokenAmount(state.balances.dust.balance)} (cap ${formatTokenAmount(state.balances.dust.cap)})`);
    }
    if (state.configuration?.indexerUri) addRow('Indexer', state.configuration.indexerUri);
    mount.append(list);

    for (const warning of state.loadWarnings) {
      const note = document.createElement('p');
      note.className = 'fine-print';
      note.textContent = `Partial load (${warning.section}): ${warning.message}`;
      mount.append(note);
    }

    const actions = document.createElement('div');
    actions.className = 'action-row';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'text-button';
    refresh.textContent = 'Refresh balances';
    refresh.addEventListener('click', () => {
      void store.refreshBalances().catch(() => {});
    });
    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'text-button';
    check.textContent = 'Check connection';
    check.addEventListener('click', () => {
      void store.checkConnection().catch(() => {});
    });
    const disconnect = document.createElement('button');
    disconnect.type = 'button';
    disconnect.className = 'button secondary';
    disconnect.textContent = 'Disconnect';
    disconnect.addEventListener('click', () => {
      void store.disconnect().catch(() => {});
    });
    actions.append(refresh, check, disconnect);
    mount.append(actions);

    if (state.status === 'error' && state.error) {
      const error = document.createElement('p');
      error.className = 'status-message error';
      error.setAttribute('role', 'alert');
      error.textContent = state.error.message;
      mount.append(error);
    }
  };
  render();
  store.addEventListener('change', render);
  return () => store.removeEventListener('change', render);
}
