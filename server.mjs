import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createGateway, ApiError } from './gateway.mjs';

export const PREPROD_RPC = 'https://rpc.preprod.midnight.network/';
export async function checkMidnight(fetcher = fetch) {
  const controller = AbortSignal.timeout(8000);
  async function rpc(method, id) {
    const response = await fetcher(PREPROD_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method, params: [], id }), signal: controller, redirect: 'error' });
    if (!response.ok) throw new Error('RPC_UNAVAILABLE');
    const data = await response.json();
    if (data.jsonrpc !== '2.0' || data.id !== id || data.error || typeof data.result !== 'string') throw new Error('INVALID_RPC_RESPONSE');
    return data.result;
  }
  const [chain, finalizedHead] = await Promise.all([rpc('system_chain', 1), rpc('chain_getFinalizedHead', 2)]);
  if (chain !== 'Midnight Preprod' || !/^0x[0-9a-fA-F]{64}$/.test(finalizedHead)) throw new Error('WRONG_NETWORK');
  return { network: 'preprod', chain, finalizedHead, checkedAt: new Date().toISOString(), anchoring: 'not_configured' };
}
const files = new Map([
  ['/', ['index.html', 'text/html']], ['/tokens.css', ['tokens.css', 'text/css']],
  ...['space-grotesk', 'inter'].map(name => [`/assets/fonts/${name}-latin.woff2`, [`assets/fonts/${name}-latin.woff2`, 'font/woff2']]),
  ...['app.js', 'privacy.js', 'envelope.js', 'scan-worker.js', 'styles.css'].map(name => [`/src/${name}`, [`src/${name}`, name.endsWith('.css') ? 'text/css' : 'text/javascript']]),
  ...['midnight-wallet-types.js', 'midnight-wallet-utils.js', 'midnight-network.js', 'midnight-wallet-adapter.js', 'midnight-wallet-context.js'].map(name => [`/src/wallet/${name}`, [`src/wallet/${name}`, 'text/javascript']]),
  ...['ConnectWalletButton.js', 'WalletModal.js', 'WalletAccount.js'].map(name => [`/src/wallet/components/${name}`, [`src/wallet/components/${name}`, 'text/javascript']]),
]);
export function makeServer({ midnight = checkMidnight, gateway = createGateway() } = {}) {
  let lastCheck = 0;
  const server = createServer(async (request, response) => {
    const security = {
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
    const send = (status, body, type = 'application/json') => { response.writeHead(status, { ...security, 'Content-Type': type.startsWith('font/') ? type : `${type}; charset=utf-8` }); response.end(body); };
    const expectedHost = `127.0.0.1:${request.socket.localPort}`;
    if (![expectedHost, `localhost:${request.socket.localPort}`].includes(request.headers.host)) return send(403, '{"code":"FORBIDDEN"}');
    if (request.headers.origin && ![`http://${expectedHost}`, `http://localhost:${request.socket.localPort}`].includes(request.headers.origin)) return send(403, '{"code":"FORBIDDEN"}');
    if (!['GET','POST'].includes(request.method)) return send(405, '{"code":"METHOD_NOT_ALLOWED"}');
    if (request.method === 'POST' && !request.headers.origin) return send(403, '{"code":"ORIGIN_REQUIRED"}');
    if (request.url === '/api/midnight/status' && request.method === 'GET') {
      if (Date.now() - lastCheck < 5000) return send(429, '{"code":"RATE_LIMITED"}');
      lastCheck = Date.now();
      try { return send(200, JSON.stringify(await midnight())); }
      catch { return send(503, '{"code":"MIDNIGHT_UNAVAILABLE","anchoring":"not_configured"}'); }
    }
    if (request.url.startsWith('/api/')) {
      try {
        let body = {};
        if (request.method === 'POST') {
          if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) throw new ApiError(415, 'INVALID_REQUEST', 'Send JSON requests only.');
          let size = 0, chunks = [];
          for await (const chunk of request) {
            size += chunk.length;
            if (size > 200000) throw new ApiError(413, 'INPUT_TOO_LARGE', 'The request exceeds the gateway size limit.');
            chunks.push(chunk);
          }
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
          catch { throw new ApiError(400, 'INVALID_REQUEST', 'Send a valid JSON object.'); }
        }
        const secret = request.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('private_ai_session='))?.slice('private_ai_session='.length);
        const result = await gateway.handle({ method: request.method, path: request.url, body, secret, csrf: request.headers['x-csrf-token'], remote: request.socket.remoteAddress });
        if (result.cookie) {
          response.setHeader('Set-Cookie', `private_ai_session=${result.cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
          delete result.cookie;
        }
        if (result.logout) response.setHeader('Set-Cookie', 'private_ai_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return send(200, JSON.stringify(result));
      } catch (error) {
        return send(error instanceof ApiError ? error.status : 500, JSON.stringify({ code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR', message: error instanceof ApiError ? error.message : 'The gateway could not complete the request. Check job status before trying again.' }));
      }
    }
    if (request.method !== 'GET') return send(405, '{"code":"METHOD_NOT_ALLOWED"}');
    const file = files.get(request.url);
    if (!file) return send(404, '{"code":"NOT_FOUND"}');
    try { send(200, await readFile(new URL(file[0], import.meta.url)), file[1]); }
    catch { send(500, '{"code":"ASSET_UNAVAILABLE"}'); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('close', () => gateway.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  const geminiKey = (process.env.GEMINI_API_KEY ?? '').trim();
  const geminiModel = (process.env.GEMINI_MODEL ?? '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY ?? '').trim();
  const openaiModel = (process.env.OPENAI_MODEL ?? '').trim();
  const useGemini = Boolean(geminiKey);
  const server = makeServer({ gateway: createGateway({ filename: process.env.DATABASE_PATH ?? './data/workspace.sqlite', providerId: useGemini ? 'gemini' : 'openai', apiKey: useGemini ? geminiKey : openaiKey, model: useGemini ? geminiModel : openaiModel }) });
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Stop the other server (lsof -i :${port}) or use another port: PORT=${port === 3000 ? 3001 : port + 1} npm run dev`);
    else console.error(`Server failed: ${error.code}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log(`Private AI Workspace: http://127.0.0.1:${server.address().port}`));
}
