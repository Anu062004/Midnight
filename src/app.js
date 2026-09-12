import { CATEGORIES, DEFAULT_POLICY, LIMIT, TTL, createLocalSession, validatePolicy } from './privacy.js';
import { initWalletStore } from './wallet/midnight-wallet-context.js';
import { mountConnectButton } from './wallet/components/ConnectWalletButton.js';
import { mountWalletModal } from './wallet/components/WalletModal.js';
import { mountWalletAccount } from './wallet/components/WalletAccount.js';

const $ = id => document.getElementById(id);
const session = createLocalSession();
let policy = structuredClone(DEFAULT_POLICY);
let job = null, worker = null, scanTimer = null, expiryTimer = null, generation = 0, sample = '', records = [];
let sessionExpires = Date.now() + TTL;
const example = 'Draft a short project update for Northstar Studio.\n\nContact Mira at mira@example.com or +1 415 555 0136. Send the update to mira@example.com when the design review is complete.\n\nTest payment card: 4242 4242 4242 4242\nSandbox credential: sk-test_1234567890abcdefghijklmnop\n\nKeep the tone clear and professional. Mention that the next review is on Tuesday.';
const labels = { workspace: 'Workspace', policies: 'Local policy', activity: 'Activity', integrations: 'Connections' };

function node(tag, content, className) {
  const el = document.createElement(tag);
  if (content !== undefined) el.textContent = content;
  if (className) el.className = className;
  return el;
}
function message(text, error = false, target = 'message') {
  $(target).textContent = text;
  $(target).className = `status-message${error ? ' error' : ''}`;
}
function navigate() {
  const view = Object.hasOwn(labels, location.hash.slice(1)) ? location.hash.slice(1) : 'workspace';
  document.querySelectorAll('.view').forEach(el => { el.hidden = el.id !== `view-${view}`; });
  document.querySelectorAll('[data-view]').forEach(el => {
    if (el.dataset.view === view) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  $('current-page').textContent = labels[view];
  document.title = `Private AI — ${labels[view]}`;
}
window.addEventListener('hashchange', navigate);
navigate();

function count() { $('character-count').textContent = `${$('composer').value.length.toLocaleString()} / ${LIMIT.toLocaleString()}`; }
function invalidate(text = 'Your input changed. Scan again to review a new preview.') {
  generation++;
  worker?.terminate(); worker = null;
  clearTimeout(scanTimer);
  session.clear(); job = null; sample = '';
  $('scan').disabled = false;
  $('scan').textContent = 'Scan text →';
  $('scan').removeAttribute('aria-busy');
  $('outgoing').textContent = '';
  $('outgoing').hidden = true;
  $('preview-empty').hidden = false;
  $('preview-state').textContent = 'Awaiting scan';
  $('preview-state').className = 'badge';
  $('preview-caption').textContent = 'Original values stay in a temporary local map.';
  $('findings-count').textContent = '—';
  $('findings').replaceChildren(node('p', 'Your supported findings will appear here after a scan.', 'muted empty-line'));
  for (const id of ['reviewed', 'try-response', 'copy-preview']) $(id).disabled = true;
  $('reviewed').checked = false;
  $('restore').checked = false;
  $('response-section').hidden = true;
  $('response-output').textContent = '';
  $('composer').removeAttribute('aria-invalid');
  message(text);
}
function resetSession(text = 'Session cleared. Your text, mappings, custom terms, and local activity were removed.') {
  invalidate(text);
  $('composer').value = '';
  records = [];
  policy = structuredClone(DEFAULT_POLICY);
  sessionExpires = Date.now() + TTL;
  renderPolicy(); renderActivity(); count();
  message('', false, 'policy-message');
  scheduleExpiry();
}
function scheduleExpiry() {
  clearTimeout(expiryTimer);
  expiryTimer = setTimeout(() => resetSession('Session expired after 15 minutes. Text, mappings, local rules, and activity were cleared.'), Math.max(0, sessionExpires - Date.now()));
}
function ensureFresh() {
  if (Date.now() < sessionExpires) return true;
  resetSession('Session expired. Start a new scan.'); return false;
}
scheduleExpiry();
document.addEventListener('visibilitychange', ensureFresh);
window.addEventListener('pagehide', () => resetSession());
window.addEventListener('pageshow', event => { if (event.persisted) resetSession(); });
$('clear-session').addEventListener('click', () => resetSession());
$('composer').addEventListener('input', () => { ensureFresh(); invalidate(); count(); });
$('composer').addEventListener('paste', event => {
  if ([...event.clipboardData.items].some(item => item.kind === 'file')) {
    event.preventDefault(); invalidate('Attachments are unsupported. Paste plain text only.');
  }
});
$('composer').addEventListener('drop', event => {
  if (event.dataTransfer.files.length) { event.preventDefault(); invalidate('Attachments are unsupported. Paste plain text only.'); }
});
$('load-example').addEventListener('click', () => {
  ensureFresh(); invalidate('Synthetic example loaded. Scan the text to see the proposed redactions.');
  $('composer').value = example; count(); $('composer').focus();
});

function renderFindings(findings) {
  $('findings-count').textContent = findings.length;
  $('findings').replaceChildren();
  const groups = new Map();
  for (const f of findings) {
    const key = `${f.category}:${f.action}`;
    const group = groups.get(key) ?? { category: f.category, action: f.action, count: 0 };
    group.count++; groups.set(key, group);
  }
  for (const f of groups.values()) {
    const row = node('div', undefined, 'finding-row');
    const summary = node('div', undefined, 'finding-summary');
    summary.append(node('strong', CATEGORIES[f.category]), node('span', `${f.count} ${f.count === 1 ? 'match' : 'matches'}`));
    row.append(summary, node('span', { allow: 'Allowed by local rule', redact: 'Redacted', block: 'Blocked' }[f.action], `badge${f.action === 'block' ? ' error' : ''}`));
    $('findings').append(row);
  }
  if (!findings.length) $('findings').append(node('p', 'No supported patterns found. Review the preview for anything the scanner may have missed.', 'muted empty-line'));
}
function record(outcome) {
  const entry = { jobId: job.id, time: new Date().toISOString(), outcome, policyId: policy.id, policyVersion: job.policyVersion, scannerVersion: job.scannerVersion, findingCount: job.findings.length, redactedCount: job.findings.filter(f => f.action !== 'allow').length, evidenceState: 'local_only', delivery: 'not_sent', mode: 'local_demo' };
  records.unshift(entry);
  records = records.slice(0, 100);
  renderActivity();
}
$('scan').addEventListener('click', () => {
  if (!ensureFresh()) return;
  invalidate('Scanning supported patterns on this device…');
  const scanGeneration = generation;
  const original = $('composer').value;
  $('scan').disabled = true; $('scan').textContent = 'Scanning…'; $('scan').setAttribute('aria-busy', 'true');
  const fail = text => { invalidate(); $('composer').setAttribute('aria-invalid', 'true'); message(text, true); };
  try { worker = new Worker('/src/scan-worker.js', { type: 'module' }); }
  catch { fail('The local scanner could not start. Reload this page in a browser with Web Worker support.'); return; }
  scanTimer = setTimeout(() => fail('The scan exceeded its 2-second limit. Nothing was approved. Shorten the input and try again.'), 2000);
  worker.onerror = () => fail('The local scanner failed. No scan was approved. Reload this page and try again.');
  worker.onmessage = ({ data }) => {
    if (scanGeneration !== generation || !ensureFresh()) return;
    clearTimeout(scanTimer); worker.terminate(); worker = null;
    if (data.error) { fail(data.error.message); return; }
    try {
      job = session.prepare(original, policy, data.result);
      $('outgoing').textContent = job.outgoing;
      $('outgoing').hidden = false; $('preview-empty').hidden = true;
      const blocked = job.decision === 'blocked';
      $('preview-state').textContent = blocked ? 'Blocked by local rule' : 'Ready for review';
      $('preview-state').className = `badge ${blocked ? 'error' : 'success'}`;
      $('preview-caption').textContent = `${job.findings.filter(f => f.action !== 'allow').length} supported findings redacted · local policy v${job.policyVersion}`;
      $('reviewed').disabled = blocked;
      // Copy only after explicit review, same as the response exercise.
      $('copy-preview').disabled = true;
      renderFindings(job.findings); record(job.decision);
      message(blocked ? 'A local policy rule blocks this request. Edit the original text or local rules, then scan again.' : 'Scan complete. Review the exact preview and check the review box to continue.', blocked);
    } catch (error) { fail(error.message); }
    $('scan').disabled = false; $('scan').textContent = 'Scan text →'; $('scan').removeAttribute('aria-busy');
  };
  worker.postMessage({ text: original, policy });
});
$('reviewed').addEventListener('change', () => {
  if (!ensureFresh()) return;
  const enabled = job && job.decision !== 'blocked' && $('reviewed').checked;
  $('try-response').disabled = !enabled || Boolean(sample);
  $('copy-preview').disabled = !enabled;
});
function approve() {
  if (!ensureFresh() || !job || !$('reviewed').checked) throw new Error('Review a fresh outgoing preview before continuing.');
  return session.approve(job.id, $('outgoing').textContent, policy.version);
}
async function copy(text, target = 'message') {
  try { await navigator.clipboard.writeText(text); message('Copied masked text to your clipboard.', false, target); }
  catch { message('Clipboard access was denied. Select and copy the masked preview manually.', true, target); }
}
$('copy-preview').addEventListener('click', () => {
  try { const envelope = approve(); void copy(envelope.payload); }
  catch (error) { invalidate(error.message); }
});
function renderResponse() {
  if (!ensureFresh() || !job) return;
  try { $('response-output').textContent = session.response(job.id, sample, $('restore').checked).display; }
  catch (error) { invalidate(error.message); }
}
$('try-response').addEventListener('click', () => {
  if (sample) return;
  try {
    const envelope = approve();
    sample = envelope.payload;
    // Validate before marking the exercise as complete.
    session.response(job.id, sample);
    $('try-response').disabled = true;
    $('response-section').hidden = false;
    renderResponse(); record('sample');
    message('Sample response ready. No provider request was made; evidence remains local only.');
  } catch (error) { sample = ''; message(error.message, true); }
});
$('restore').addEventListener('change', renderResponse);
$('copy-response').addEventListener('click', () => {
  try { if (ensureFresh() && job) void copy(session.response(job.id, sample, false).sanitized); }
  catch (error) { invalidate(error.message); }
});

function renderPolicy() {
  $('policy-rules').replaceChildren();
  for (const [category, label] of Object.entries(CATEGORIES)) {
    const row = node('div', undefined, 'policy-rule');
    const name = node('label', label); name.htmlFor = `rule-${category}`;
    const select = node('select'); select.id = `rule-${category}`;
    for (const value of (category === 'credential' ? ['redact', 'block'] : ['redact', 'block', 'allow'])) {
      const option = node('option', { redact: 'Redact', block: 'Block', allow: 'Allow' }[value]); option.value = value; select.append(option);
    }
    select.value = policy.actions[category]; row.append(name, select); $('policy-rules').append(row);
  }
  $('custom-terms').value = policy.customTerms.join('\n');
  $('require-semantic').checked = policy.requiredDetectors.includes('semantic');
  $('policy-version').textContent = `Local policy · v${policy.version}`;
}
$('policy-form').addEventListener('submit', event => {
  event.preventDefault(); if (!ensureFresh()) return;
  const next = { ...policy, version: policy.version + 1, customTerms: $('custom-terms').value.split('\n').map(t => t.trim()).filter(Boolean), requiredDetectors: $('require-semantic').checked ? ['patterns', 'semantic'] : ['patterns'], actions: Object.fromEntries(Object.keys(CATEGORIES).map(c => [c, $(`rule-${c}`).value])) };
  try {
    validatePolicy(next); policy = next; invalidate('Local policy changed. Scan and review again.'); renderPolicy();
    message(`Local rules v${policy.version} applied. Previous previews were invalidated.${next.requiredDetectors.includes('semantic') ? ' Scanning is blocked until the unavailable detector is no longer required.' : ''}`, false, 'policy-message');
  } catch (error) { message(error.message, true, 'policy-message'); }
});
renderPolicy();

function renderActivity() {
  $('activity-count').textContent = records.length;
  $('export-activity').disabled = records.length === 0;
  const filtered = records.filter(r => $('activity-filter').value === 'all' || r.outcome === $('activity-filter').value);
  $('activity-list').replaceChildren();
  for (const entry of filtered) {
    const details = node('details', undefined, 'activity-item');
    const summary = node('summary');
    summary.append(node('strong', { review: 'Scan ready for review', blocked: 'Blocked by local rule', sample: 'Sample response created' }[entry.outcome]), node('span', new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'muted'), node('span', 'Local only', 'badge'));
    details.append(summary, node('code', JSON.stringify(entry, null, 2)), node('p', 'Meaning: this browser reports local activity. No signer, verifier, provider delivery, or ledger settlement is established.', 'fine-print'));
    $('activity-list').append(details);
  }
  if (!filtered.length) $('activity-list').append(node('p', records.length ? 'No activity matches this filter.' : 'No local activity yet. Scan an example to create your first record.', 'empty-line muted'));
}
$('activity-filter').addEventListener('change', renderActivity);
$('export-activity').addEventListener('click', () => {
  if (!ensureFresh()) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ schema: 'private-ai/local-activity/v1', records }, null, 2)], { type: 'application/json' }));
  const link = node('a'); link.href = url; link.download = 'private-ai-local-activity.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('check-midnight').addEventListener('click', async () => {
  const button = $('check-midnight'); button.disabled = true; button.textContent = 'Checking node…'; button.setAttribute('aria-busy', 'true');
  $('midnight-state').textContent = 'Checking'; $('midnight-state').className = 'badge'; $('midnight-head').hidden = true;
  message('Checking the configured Preprod node. No text is sent.', false, 'midnight-message');
  try {
    const response = await fetch('/api/midnight/status', { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(response.status === 429 ? 'Wait five seconds before checking again.' : 'The Preprod node could not be verified. Check your network connection and try again.');
    const status = await response.json();
    $('midnight-state').textContent = 'Node reachable'; $('midnight-state').className = 'badge success';
    message(`${status.chain} responded at ${new Date(status.checkedAt).toLocaleTimeString()}. Evidence anchoring is still not configured.`, false, 'midnight-message');
    $('midnight-head').textContent = `Finalized head: ${status.finalizedHead}`; $('midnight-head').hidden = false;
  } catch (error) {
    $('midnight-state').textContent = 'Unavailable'; $('midnight-state').className = 'badge error';
    message(error.name === 'TimeoutError' ? 'The node check timed out. Try again later; anchoring remains unconfigured.' : error.message, true, 'midnight-message');
  } finally { button.disabled = false; button.textContent = 'Check node connection ↗'; button.removeAttribute('aria-busy'); }
});

// Midnight multi-wallet adapter: optional enhancement, never blocks the local workflow.
try {
  const walletStore = initWalletStore();
  const walletModal = mountWalletModal($('wallet-modal-root'), walletStore);
  const openWalletModal = () => walletModal.open();
  if ($('wallet-chip-mount')) mountConnectButton($('wallet-chip-mount'), walletStore, { onOpen: openWalletModal, compact: true });
  if ($('wallet-connect-mount')) mountConnectButton($('wallet-connect-mount'), walletStore, { onOpen: openWalletModal });
  if ($('wallet-account')) mountWalletAccount($('wallet-account'), walletStore);
  const syncWalletBadge = () => {
    const badge = $('wallet-state');
    if (!badge) return;
    const state = walletStore.getState();
    if (state.status === 'connected' && state.selectedWallet) {
      badge.textContent = `${state.selectedWallet.name} · ${state.networkId}`;
      badge.className = 'badge success';
    } else if (state.status === 'connecting' || state.status === 'discovering') {
      badge.textContent = 'Connecting…';
      badge.className = 'badge';
    } else if (state.status === 'error') {
      badge.textContent = 'Connection failed';
      badge.className = 'badge error';
    } else {
      badge.textContent = 'Not connected';
      badge.className = 'badge';
    }
  };
  walletStore.addEventListener('change', syncWalletBadge);
  syncWalletBadge();
} catch {
  const badge = $('wallet-state');
  if (badge) { badge.textContent = 'Unavailable'; badge.className = 'badge error'; }
}
