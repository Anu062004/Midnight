/**
 * WalletModal — wallet-selection dialog.
 *
 * Lists every discovered connector using its own `name`/`icon` metadata
 * (rendered safely: names via `textContent`, icons via `<img>` only for safe
 * URLs, otherwise a fallback glyph). Incompatible versions appear disabled
 * with their version shown. Empty scope shows the no-wallet message — never a
 * redirect to third-party URLs.
 *
 * Popup-safety: the wallet row handler calls `store.connect(id)` with no
 * `await` before it, preserving the user activation the wallet popup needs.
 */
import { isSafeIconUrl } from '../midnight-wallet-utils.js';

/**
 * @param {HTMLElement} root Modal root (stays hidden until `open()`).
 * @param {import('../midnight-wallet-adapter.js').MidnightWalletAdapter} store
 * @returns {{ open: () => void, close: () => void }}
 */
export function mountWalletModal(root, store) {
  let opener = null;

  const overlay = document.createElement('div');
  overlay.className = 'wallet-overlay';
  overlay.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'wallet-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'wallet-modal-title');
  overlay.append(dialog);
  root.append(overlay);

  function close() {
    overlay.hidden = true;
    if (opener && typeof opener.focus === 'function') {
      try {
        opener.focus();
      } catch {
        /* ignored */
      }
      opener = null;
    }
  }

  function open() {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    store.discover();
    render();
    overlay.hidden = false;
    dialog.querySelector('[data-wallet-close]')?.focus();
  }

  function render() {
    dialog.replaceChildren();
    const state = store.getState();

    const heading = document.createElement('h2');
    heading.id = 'wallet-modal-title';
    heading.textContent = state.status === 'connected' ? 'Midnight Wallet' : 'Connect Midnight Wallet';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'text-button';
    closeButton.dataset.walletClose = 'true';
    closeButton.textContent = 'Close';
    closeButton.setAttribute('aria-label', 'Close wallet dialog');
    closeButton.addEventListener('click', close);

    const head = document.createElement('div');
    head.className = 'wallet-dialog-head';
    head.append(heading, closeButton);
    dialog.append(head);

    if (state.status === 'connected' && state.selectedWallet) {
      dialog.append(accountSummary(state));
    }

    const list = document.createElement('div');
    list.className = 'wallet-list';
    if (state.wallets.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted empty-line';
      empty.textContent = 'No compatible Midnight wallet detected. Install a compatible wallet, unlock it, then refresh this page.';
      list.append(empty);
    }
    for (const wallet of state.wallets) {
      list.append(walletRow(wallet, state));
    }
    dialog.append(list);

    if (state.status === 'error' && state.error) {
      const error = document.createElement('p');
      error.className = 'status-message error';
      error.setAttribute('role', 'alert');
      error.textContent = state.error.message;
      dialog.append(error);
    } else if (state.status === 'connecting') {
      const pending = document.createElement('p');
      pending.className = 'status-message';
      pending.setAttribute('role', 'status');
      pending.textContent = 'Approve the connection in your wallet…';
      dialog.append(pending);
    }

    if (state.status === 'connected') {
      const actions = document.createElement('div');
      actions.className = 'action-row';
      const disconnect = document.createElement('button');
      disconnect.type = 'button';
      disconnect.className = 'button secondary';
      disconnect.textContent = 'Disconnect';
      disconnect.addEventListener('click', () => {
        void store.disconnect().then(close).catch(close);
      });
      actions.append(disconnect);
      dialog.append(actions);
    }

    const hint = document.createElement('p');
    hint.className = 'fine-print';
    hint.textContent = `Network: ${state.networkId}. Any standards-compatible wallet appears here automatically.`;
    dialog.append(hint);
  }

  function accountSummary(state) {
    const wrap = document.createElement('div');
    wrap.className = 'wallet-account-summary';
    const badge = document.createElement('span');
    badge.className = 'badge success';
    badge.textContent = 'Connected';
    const name = document.createElement('strong');
    name.textContent = state.selectedWallet.name;
    wrap.append(badge, name);
    return wrap;
  }

  function walletRow(wallet, state) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'wallet-row';
    const isSelected = state.selectedWallet?.id === wallet.id && state.status === 'connected';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'wallet-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    if (wallet.icon && isSafeIconUrl(wallet.icon)) {
      const img = document.createElement('img');
      img.src = wallet.icon;
      img.alt = '';
      img.width = 28;
      img.height = 28;
      img.referrerPolicy = 'no-referrer';
      iconWrap.append(img);
    } else {
      iconWrap.textContent = '◈';
    }

    const name = document.createElement('span');
    name.className = 'wallet-name';
    name.textContent = wallet.name;

    const version = document.createElement('span');
    version.className = 'wallet-version muted';
    version.textContent = `v${wallet.apiVersion}`;

    row.append(iconWrap, name, version);

    if (!wallet.compatible) {
      row.disabled = true;
      row.title = 'Wallet detected but connector API version is unsupported.';
      const note = document.createElement('span');
      note.className = 'badge';
      note.textContent = 'Unsupported';
      row.append(note);
      return row;
    }
    if (isSelected) {
      row.disabled = true;
      const note = document.createElement('span');
      note.className = 'badge success';
      note.textContent = 'Selected';
      row.append(note);
      return row;
    }
    // No await before connect(): keeps the user activation for the wallet popup.
    row.addEventListener('click', () => {
      void store.connect(wallet.id).catch(() => render());
    });
    return row;
  }

  overlay.addEventListener('mousedown', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) close();
  });
  const onChange = () => {
    if (!overlay.hidden) render();
    if (store.getState().status === 'connected' && !overlay.hidden && document.activeElement?.closest('.wallet-row')) close();
  };
  store.addEventListener('change', onChange);

  return { open, close };
}
