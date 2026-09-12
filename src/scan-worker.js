import { scan } from './privacy.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ result: scan(data.text, data.policy) }); }
  catch (error) { self.postMessage({ error: { code: error.code ?? 'SCAN_FAILED', message: error.message } }); }
};
