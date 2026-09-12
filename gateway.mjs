import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, openSync, closeSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { scan, DEFAULT_POLICY, validatePolicy, LIMIT } from './src/privacy.js';
import { envelopeBytes } from './src/envelope.js';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('hex');
const hour = 3600000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ApiError extends Error {
  constructor(status, code, message) { super(message); Object.assign(this, { status, code }); }
}
const fail = (status, code, message) => { throw new ApiError(status, code, message); };
function shape(body, keys) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) fail(400, 'INVALID_REQUEST', 'The request contains unsupported fields.');
}
function string(value, min, max) { return typeof value === 'string' && value.length >= min && value.length <= max; }
function email(value) {
  if (!string(value, 3, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(400, 'INVALID_REQUEST', 'Enter a valid email address.');
  return value.toLowerCase();
}
function password(value) {
  if (!string(value, 12, 128)) fail(400, 'INVALID_REQUEST', 'Use a password of 12–128 characters.');
}
async function passwordHash(value, salt = token()) {
  const key = await derive(value, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `${salt}:${key.toString('hex')}`;
}
export function createGateway({ filename = ':memory:', apiKey = '', model = '', providerId = 'openai', fetcher = fetch, now = Date.now, providerTimeout = 45000, dailyLimit = 100 } = {}) {
  if (!['openai', 'gemini'].includes(providerId)) throw new Error('Unsupported providerId: use openai or gemini');
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
    closeSync(openSync(filename, 'a', 0o600)); chmodSync(filename, 0o600);
  }
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS members(org TEXT NOT NULL, user TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','member')), active INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(org,user), FOREIGN KEY(org) REFERENCES organizations(id), FOREIGN KEY(user) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, csrf TEXT NOT NULL, user TEXT NOT NULL, org TEXT NOT NULL, expires INTEGER NOT NULL, FOREIGN KEY(org,user) REFERENCES members(org,user));
    CREATE TABLE IF NOT EXISTS invitations(token TEXT PRIMARY KEY, org TEXT NOT NULL, email TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(org) REFERENCES organizations(id));
    CREATE TABLE IF NOT EXISTS policies(org TEXT NOT NULL, version INTEGER NOT NULL, body TEXT NOT NULL, commitment TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(org,version), FOREIGN KEY(org) REFERENCES organizations(id));
    CREATE TRIGGER IF NOT EXISTS policy_immutable BEFORE UPDATE ON policies BEGIN SELECT RAISE(ABORT,'immutable policy'); END;
    CREATE TABLE IF NOT EXISTS jobs(org TEXT NOT NULL, id TEXT NOT NULL, actor TEXT NOT NULL, version INTEGER NOT NULL, model TEXT NOT NULL, nonce TEXT NOT NULL, commitment TEXT NOT NULL, state TEXT NOT NULL, code TEXT, provider_id TEXT, created INTEGER NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(org,id), FOREIGN KEY(org,actor) REFERENCES members(org,user));
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, org TEXT NOT NULL, actor TEXT NOT NULL, event TEXT NOT NULL, reference TEXT, created INTEGER NOT NULL, FOREIGN KEY(org) REFERENCES organizations(id));
    CREATE TABLE IF NOT EXISTS consumed_jobs(org TEXT NOT NULL,id TEXT NOT NULL,PRIMARY KEY(org,id));
    CREATE INDEX IF NOT EXISTS jobs_actor ON jobs(org,actor,created);
    CREATE INDEX IF NOT EXISTS audit_tenant ON audit(org,created);`);
  // ponytail: one server process owns this database. Multiple replicas need a lease
  // before startup recovery can distinguish an active sender from a crashed one.
  db.prepare("UPDATE jobs SET state='unknown', code='DELIVERY_UNKNOWN', updated=? WHERE state='sending'").run(now());
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function audit(ctx, event, reference = null) { run('INSERT INTO audit(org,actor,event,reference,created) VALUES(?,?,?,?,?)', ctx.org, ctx.user, event, reference, now()); }
  const provider = () => ({ id: providerId, model, configured: Boolean(apiKey && /^[A-Za-z0-9._:-]{1,100}$/.test(model)), evidence: 'not_configured' });
  const effective = org => JSON.parse(get('SELECT body FROM policies WHERE org=? ORDER BY version DESC LIMIT 1', org).body);
  function publish(org, value) {
    const body = JSON.stringify(value);
    run('INSERT INTO policies VALUES(?,?,?,?,?)', org, value.version, body, hash(body), now());
  }
  function session(user, org) {
    run('DELETE FROM sessions WHERE expires<=?', now());
    const secret = token(), csrf = token();
    run('INSERT INTO sessions VALUES(?,?,?,?,?)', hash(secret), csrf, user, org, now() + 8 * hour);
    return { secret, csrf };
  }
  function auth(secret) {
    if (!string(secret, 64, 64)) fail(401, 'UNAUTHENTICATED', 'Sign in to use your organization workspace.');
    const ctx = get(`SELECT s.user,s.org,s.csrf,m.role,u.email,o.name FROM sessions s
      JOIN members m ON m.org=s.org AND m.user=s.user JOIN users u ON u.id=s.user JOIN organizations o ON o.id=s.org
      WHERE s.token=? AND s.expires>? AND m.active=1`, hash(secret), now());
    if (!ctx) fail(401, 'UNAUTHENTICATED', 'Your session expired or your membership was revoked. Sign in again.');
    return ctx;
  }
  function owner(ctx) { if (ctx.role !== 'owner') fail(403, 'FORBIDDEN', 'Only organization owners can do this.'); }
  function viewSession(ctx) {
    return { user: { id: ctx.user, email: ctx.email }, organization: { id: ctx.org, name: ctx.name }, role: ctx.role, csrf: ctx.csrf, policy: effective(ctx.org), provider: provider() };
  }
  function inviteFor(value, address) {
    if (!string(value, 64, 64)) fail(400, 'INVALID_INVITATION', 'Enter a valid invitation token.');
    const invite = get('SELECT * FROM invitations WHERE token=? AND email=? AND used=0 AND expires>?', hash(value), address, now());
    if (!invite) fail(400, 'INVALID_INVITATION', 'The invitation is invalid, expired, or intended for another account.');
    return invite;
  }
  function join(invite, user) {
    run('INSERT INTO members(org,user,role,active) VALUES(?,?,?,1) ON CONFLICT(org,user) DO UPDATE SET active=1', invite.org, user, 'member');
    run('UPDATE invitations SET used=1 WHERE token=?', invite.token);
  }
  function publicJob(row) {
    return { id: row.id, actorId: row.actor, policyVersion: row.version, model: row.model, commitment: row.commitment, state: row.state, code: row.code, providerRequestId: row.provider_id, createdAt: new Date(row.created).toISOString(), updatedAt: new Date(row.updated).toISOString(), evidenceState: 'not_configured', verification: 'Unsigned gateway metadata; no blockchain confirmation.' };
  }
  function findJob(ctx, id) {
    const row = get('SELECT * FROM jobs WHERE org=? AND id=? AND actor=?', ctx.org, id, ctx.user);
    if (!row) fail(404, 'NOT_FOUND', 'That request is not available in your workspace.');
    return row;
  }
  function checkPayload(payload, p) {
    if (!string(payload, 1, p.maxLength)) fail(400, 'INVALID_REQUEST', 'The outgoing text exceeds the policy limit or is empty.');
    try {
      const result = scan(payload, p, { allowPlaceholders: true });
      if (result.findings.some(f => f.action !== 'allow')) fail(403, 'POLICY_BLOCKED', 'Supported sensitive content remains in the outgoing text. Scan and review again.');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      fail(403, error.code ?? 'POLICY_BLOCKED', error.message);
    }
  }
  function ready(p) {
    if (p.evidenceMode === 'strict') fail(409, 'EVIDENCE_PENDING', 'Strict mode requires verified evidence. Anchoring is not configured, so delivery is blocked.');
    if (!provider().configured) fail(503, 'PROVIDER_UNAVAILABLE', 'The operator must configure a provider key and model on the server.');
  }
  function bound(ctx, row, payload) { return hash(envelopeBytes({ organizationId: ctx.org, userId: ctx.user, jobId: row.id, policyVersion: row.version, model: row.model, nonce: row.nonce, payload })); }
  function checkJob(ctx, row, payload) {
    if (bound(ctx, row, payload) !== row.commitment) fail(409, 'PAYLOAD_CHANGED', 'The approved text changed. Create and review a new job.');
    const p = effective(ctx.org);
    if (row.version !== p.version || row.model !== model) fail(409, 'POLICY_CHANGED', 'The effective policy or model changed. Scan and review again.');
    ready(p); checkPayload(payload, p);
    return p;
  }
  async function deliver(ctx, row, payload, secret) {
    if (row.state !== 'prepared') return { job: publicJob(row), replay: true };
    auth(secret); // Membership/session and policy are rechecked immediately before dispatch.
    checkJob(ctx, row, payload);
    if (now() - row.created > 15 * 60000) fail(409, 'JOB_EXPIRED', 'The approval expired. Scan and review again.');
    transaction(() => {
      const used = get("SELECT count(*) AS n FROM jobs WHERE org=? AND state<>'prepared' AND created>?", ctx.org, now() - 24 * hour).n;
      if (used >= dailyLimit) fail(429, 'QUOTA_EXCEEDED', 'Your organization reached its daily request limit.');
      const result = run("UPDATE jobs SET state='sending',updated=? WHERE org=? AND id=? AND state='prepared'", now(), ctx.org, row.id);
      if (result.changes !== 1) fail(409, 'DELIVERY_UNKNOWN', 'This request was already claimed for delivery. Check its status.');
      audit(ctx, 'delivery_started', row.id);
    });
    let text;
    try {
      if (providerId === 'gemini') {
        // Gemini: key travels in x-goog-api-key header, never in URL/logs.
        // row.model is always the server-configured model (see checkJob), so URL interpolation is allowlisted.
        const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(row.model)}:generateContent`, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(providerTimeout),
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: payload }] }], generationConfig: { maxOutputTokens: 2048 } }),
        });
        if (!response.ok) {
          await response.body?.cancel();
          run("UPDATE jobs SET state='rejected',code='PROVIDER_REJECTED',updated=? WHERE org=? AND id=?", now(), ctx.org, row.id);
        } else {
          let bytes = 0, chunks = [];
          for await (const chunk of response.body) {
            bytes += chunk.length;
            if (bytes > 256000) throw new Error('RESPONSE_TOO_LARGE');
            chunks.push(chunk);
          }
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const candidates = Array.isArray(data.candidates) ? data.candidates : null;
          if (!candidates) throw new Error('INVALID_PROVIDER_RESPONSE');
          text = candidates.flatMap(candidate => Array.isArray(candidate?.content?.parts) ? candidate.content.parts.filter(part => typeof part?.text === 'string').map(part => part.text) : []).join('\n');
          if (typeof text !== 'string' || !text || text.length > LIMIT) throw new Error('INVALID_PROVIDER_RESPONSE');
          const finish = candidates[0]?.finishReason;
          run("UPDATE jobs SET state='delivered',code=?,provider_id=?,updated=? WHERE org=? AND id=?", finish === 'STOP' ? null : 'RESPONSE_INCOMPLETE', null, now(), ctx.org, row.id);
        }
      } else {
        const response = await fetcher('https://api.openai.com/v1/responses', {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(providerTimeout),
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: row.model, input: payload, store: false, stream: false, max_output_tokens: 2048 }),
        });
        if (!response.ok) {
          // An HTTP error confirms a response, not that the provider never saw the input.
          await response.body?.cancel();
          run("UPDATE jobs SET state='rejected',code='PROVIDER_REJECTED',updated=? WHERE org=? AND id=?", now(), ctx.org, row.id);
        } else {
          let bytes = 0, chunks = [];
          for await (const chunk of response.body) {
            bytes += chunk.length;
            if (bytes > 256000) throw new Error('RESPONSE_TOO_LARGE');
            chunks.push(chunk);
          }
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!Array.isArray(data.output)) throw new Error('INVALID_PROVIDER_RESPONSE');
          text = data.output.flatMap(item => item.type === 'message' && Array.isArray(item.content) ? item.content.filter(part => part.type === 'output_text').map(part => part.text) : []).join('\n');
          if (typeof text !== 'string' || text.length > LIMIT) throw new Error('INVALID_PROVIDER_RESPONSE');
          const providerRequestId = string(data.id, 1, 160) && /^resp_[A-Za-z0-9_-]+$/.test(data.id) ? data.id : null;
          run("UPDATE jobs SET state='delivered',code=?,provider_id=?,updated=? WHERE org=? AND id=?", data.status === 'completed' ? null : 'RESPONSE_INCOMPLETE', providerRequestId, now(), ctx.org, row.id);
        }
      }
    } catch {
      run("UPDATE jobs SET state='unknown',code='DELIVERY_UNKNOWN',updated=? WHERE org=? AND id=?", now(), ctx.org, row.id);
    }
    audit(ctx, 'delivery_finished', row.id);
    // Do not return a response after a session/membership has been revoked in flight.
    auth(secret);
    return { job: publicJob(findJob(ctx, row.id)), ...(text !== undefined ? { response: text } : {}) };
  }
  const attempts = new Map();
  let passwordWork = 0;
  async function credentials(work) {
    if (passwordWork >= 4) fail(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again shortly.');
    passwordWork++;
    try { return await work(); } finally { passwordWork--; }
  }
  function throttle(key) {
    const time = now();
    for (const [k, v] of attempts) if (v.until <= time) attempts.delete(k);
    const current = attempts.get(key) ?? { count: 0, until: time + 15 * 60000 };
    if (++current.count > 20) fail(429, 'RATE_LIMITED', 'Too many authentication attempts. Try again in 15 minutes.');
    attempts.set(key, current);
  }
  return {
    close: () => db.close(),
    async handle({ method, path, body = {}, secret, csrf, remote = 'local' }) {
      if (method === 'POST' && ['/api/register', '/api/login'].includes(path)) {
        throttle(remote);
        return credentials(async () => {
          shape(body, path === '/api/register' ? ['email','password','organizationName','invitation'] : ['email','password']);
          const address = email(body.email); password(body.password);
          if (path === '/api/register') {
            if (!body.invitation && (!string(body.organizationName, 1, 80) || !body.organizationName.trim())) fail(400, 'INVALID_REQUEST', 'Name your organization.');
            const encoded = await passwordHash(body.password);
            return transaction(() => {
              if (get('SELECT id FROM users WHERE email=?', address)) fail(409, 'ACCOUNT_EXISTS', 'An account already exists. Sign in instead.');
              const user = randomUUID();
              const invite = body.invitation ? inviteFor(body.invitation, address) : null;
              const org = invite?.org ?? randomUUID();
              run('INSERT INTO users VALUES(?,?,?)', user, address, encoded);
              if (invite) join(invite, user);
              else {
                run('INSERT INTO organizations VALUES(?,?)', org, body.organizationName.trim());
                run('INSERT INTO members(org,user,role) VALUES(?,?,?)', org, user, 'owner');
                publish(org, { ...structuredClone(DEFAULT_POLICY), evidenceMode: 'standard', retentionDays: 30 });
              }
              const result = session(user, org); audit({ org, user }, 'account_created');
              return { ...viewSession(auth(result.secret)), cookie: result.secret };
            });
          }
          const user = get('SELECT * FROM users WHERE email=?', address);
          const [salt, expected] = (user?.password ?? `${'0'.repeat(64)}:${'0'.repeat(128)}`).split(':');
          const actual = (await passwordHash(body.password, salt)).split(':')[1];
          if (!user || !timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))) fail(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
          const membership = get('SELECT org FROM members WHERE user=? AND active=1 ORDER BY role DESC LIMIT 1', user.id);
          if (!membership) fail(403, 'FORBIDDEN', 'This account has no active organization membership.');
          const result = session(user.id, membership.org);
          return { ...viewSession(auth(result.secret)), cookie: result.secret };
        });
      }
      if (method === 'GET' && path === '/api/session') {
        try { return viewSession(auth(secret)); }
        catch (error) { if (error.status === 401) return { user: null, provider: provider() }; throw error; }
      }
      const ctx = auth(secret);
      if (method !== 'GET' && csrf !== ctx.csrf) fail(403, 'CSRF_REJECTED', 'Your session token changed. Reload the workspace.');
      transaction(() => {
        const cutoff = now() - effective(ctx.org).retentionDays * 24 * hour;
        run("INSERT OR IGNORE INTO consumed_jobs SELECT org,id FROM jobs WHERE org=? AND created<? AND state<>'sending'", ctx.org, cutoff);
        run("DELETE FROM jobs WHERE org=? AND created<? AND state<>'sending'", ctx.org, cutoff);
        run('DELETE FROM audit WHERE org=? AND created<?', ctx.org, cutoff);
        run('DELETE FROM invitations WHERE expires<?', now());
      });
      if (method === 'POST' && path === '/api/logout') { run('DELETE FROM sessions WHERE token=?', hash(secret)); return { logout: true }; }
      if (method === 'GET' && path === '/api/policy/effective') return { policy: effective(ctx.org), provider: provider() };
      if (method === 'GET' && path === '/api/policies') return { policies: all('SELECT version,body,commitment,created FROM policies WHERE org=? ORDER BY version DESC', ctx.org).map(p => ({ ...JSON.parse(p.body), commitment: p.commitment, createdAt: new Date(p.created).toISOString() })) };
      if (method === 'POST' && path === '/api/policies') {
        owner(ctx); shape(body, ['baseVersion','actions','customTerms','requiredDetectors','maxLength','evidenceMode','retentionDays']);
        const current = effective(ctx.org);
        if (body.baseVersion !== current.version) fail(409, 'POLICY_CHANGED', 'Another policy was published. Reload before editing.');
        const p = { id: 'local-starter', version: current.version + 1, actions: body.actions, customTerms: body.customTerms, requiredDetectors: body.requiredDetectors, maxLength: body.maxLength, evidenceMode: body.evidenceMode, retentionDays: body.retentionDays };
        try { validatePolicy(p); } catch { fail(400, 'INVALID_POLICY', 'Use supported policy actions and detector settings.'); }
        if (!['standard','strict'].includes(p.evidenceMode) || !Number.isInteger(p.retentionDays) || p.retentionDays < 1 || p.retentionDays > 365) fail(400, 'INVALID_POLICY', 'Select an evidence mode and retention period of 1–365 days.');
        transaction(() => { publish(ctx.org, p); audit(ctx, 'policy_published', String(p.version)); });
        return { policy: p };
      }
      if (method === 'GET' && path === '/api/members') return { members: all('SELECT u.id,u.email,m.role,m.active FROM members m JOIN users u ON u.id=m.user WHERE m.org=?', ctx.org), organizations: all('SELECT o.id,o.name FROM members m JOIN organizations o ON o.id=m.org WHERE m.user=? AND m.active=1', ctx.user) };
      if (method === 'POST' && path === '/api/invitations') {
        owner(ctx); shape(body, ['email']); const address = email(body.email), value = token();
        run('INSERT INTO invitations VALUES(?,?,?,?,0)', hash(value), ctx.org, address, now() + 24 * hour); audit(ctx, 'invitation_created');
        return { token: value, expiresAt: new Date(now() + 24 * hour).toISOString() };
      }
      if (method === 'POST' && path === '/api/invitations/accept') {
        shape(body, ['token']);
        const result = transaction(() => { const invite = inviteFor(body.token, ctx.email); join(invite, ctx.user); return session(ctx.user, invite.org); });
        run('DELETE FROM sessions WHERE token=?', hash(secret));
        return { ...viewSession(auth(result.secret)), cookie: result.secret };
      }
      if (method === 'POST' && path === '/api/organization/switch') {
        shape(body, ['organizationId']);
        if (!get('SELECT 1 FROM members WHERE org=? AND user=? AND active=1', String(body.organizationId), ctx.user)) fail(403, 'FORBIDDEN', 'You are not a member of that organization.');
        const result = session(ctx.user, body.organizationId); run('DELETE FROM sessions WHERE token=?', hash(secret));
        return { ...viewSession(auth(result.secret)), cookie: result.secret };
      }
      const revoke = path.match(/^\/api\/members\/([^/]+)\/revoke$/);
      if (method === 'POST' && revoke) {
        owner(ctx);
        const member = get('SELECT role FROM members WHERE org=? AND user=?', ctx.org, revoke[1]);
        if (!member || member.role === 'owner') fail(403, 'FORBIDDEN', 'Only member accounts can be revoked here.');
        transaction(() => { run('UPDATE members SET active=0 WHERE org=? AND user=?', ctx.org, revoke[1]); run('DELETE FROM sessions WHERE org=? AND user=?', ctx.org, revoke[1]); audit(ctx, 'membership_revoked', revoke[1]); });
        return { revoked: true };
      }
      if (method === 'POST' && path === '/api/jobs') {
        shape(body, ['jobId','policyVersion','model','nonce','payload','commitment','mode']);
        if (!uuid.test(body.jobId) || !/^[0-9a-f]{64}$/.test(body.nonce) || !/^[0-9a-f]{64}$/.test(body.commitment) || body.mode !== 'live' || typeof body.payload !== 'string') fail(400, 'INVALID_REQUEST', 'Use a fresh reviewed live request envelope.');
        const row = { id: body.jobId, version: body.policyVersion, model: body.model, nonce: body.nonce, commitment: body.commitment };
        checkJob(ctx, row, body.payload);
        const previous = get('SELECT * FROM jobs WHERE org=? AND id=?', ctx.org, row.id);
        if (get('SELECT 1 FROM consumed_jobs WHERE org=? AND id=?', ctx.org, row.id)) fail(409, 'JOB_CONSUMED', 'This job has expired from retained activity and cannot be sent again.');
        if (previous) {
          if (previous.actor !== ctx.user || previous.commitment !== row.commitment) fail(409, 'JOB_CONFLICT', 'That job ID is already in use.');
          return { job: publicJob(previous), replay: true };
        }
        if (get('SELECT count(*) AS n FROM jobs WHERE org=? AND created>?', ctx.org, now() - 24 * hour).n >= dailyLimit * 2) fail(429, 'QUOTA_EXCEEDED', 'Too many jobs were created today.');
        run("INSERT INTO jobs(org,id,actor,version,model,nonce,commitment,state,created,updated) VALUES(?,?,?,?,?,?,?,'prepared',?,?)", ctx.org, row.id, ctx.user, row.version, row.model, row.nonce, row.commitment, now(), now());
        audit(ctx, 'job_prepared', row.id);
        return { job: publicJob(findJob(ctx, row.id)) };
      }
      const send = path.match(/^\/api\/jobs\/([^/]+)\/send$/);
      if (method === 'POST' && send) {
        shape(body, ['payload']); if (!string(body.payload, 1, LIMIT)) fail(400, 'INVALID_REQUEST', 'Send the exact approved text.');
        const row = findJob(ctx, send[1]);
        if (bound(ctx, row, body.payload) !== row.commitment) fail(409, 'PAYLOAD_CHANGED', 'The approved text changed. Scan and review again.');
        return deliver(ctx, row, body.payload, secret);
      }
      const detail = path.match(/^\/api\/jobs\/([^/]+)$/);
      if (method === 'GET' && detail) return { job: publicJob(findJob(ctx, detail[1])) };
      if (method === 'GET' && ['/api/activity','/api/activity/export'].includes(path)) {
        const p = effective(ctx.org), cutoff = now() - p.retentionDays * 24 * hour;
        if (path.endsWith('/export')) audit(ctx, 'metadata_exported');
        const clause = ctx.role === 'owner' ? '' : ' AND actor=?';
        const args = ctx.role === 'owner' ? [ctx.org, cutoff] : [ctx.org, cutoff, ctx.user];
        return { jobs: all(`SELECT * FROM jobs WHERE org=? AND created>?${clause} ORDER BY created DESC LIMIT 500`, ...args).map(publicJob), events: all(`SELECT event,reference,actor,created FROM audit WHERE org=? AND created>?${clause} ORDER BY created DESC LIMIT 500`, ...args) };
      }
      fail(404, 'NOT_FOUND', 'The API route is unavailable.');
    },
  };
}
