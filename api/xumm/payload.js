/**
 * Vercel serverless: secure Xaman (Xumm) payload creation & status polling.
 * XUMM_API_SECRET stays server-side only.
 */

const XUMM_API = 'https://xumm.app/api/v1/platform/payload';

function getCredentials() {
  const apiKey = process.env.XUMM_API_KEY;
  const apiSecret = process.env.XUMM_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('XUMM_API_KEY and XUMM_API_SECRET must be set in Vercel environment variables.');
  }
  return { apiKey, apiSecret };
}

function resolveAppUrl() {
  return String(process.env.APP_URL || 'https://mosaico-criptografico.vercel.app').replace(/\/$/, '');
}

/**
 * Xaman substitutes {id} / {txid} after signing so the return tab can restore state.
 * @param {string} appUrl
 * @param {'mint'|'burn'|'connect'} action
 */
function buildReturnUrl(appUrl, action = 'mint') {
  const safeAction = ['mint', 'burn', 'connect'].includes(action) ? action : 'mint';
  return `${appUrl}/?xumm_payload={id}&txid={txid}&wizard=${safeAction}`;
}

async function xummFetch(path, options = {}) {
  const { apiKey, apiSecret } = getCredentials();
  const response = await fetch(`${XUMM_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Xumm API error (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'POST') {
      const { txjson, returnAction } = req.body || {};
      if (!txjson || typeof txjson !== 'object') {
        return res.status(400).json({ error: 'Missing txjson in request body.' });
      }

      const appUrl = resolveAppUrl();
      const returnTarget = buildReturnUrl(appUrl, returnAction || 'mint');
      const payload = await xummFetch('', {
        method: 'POST',
        body: JSON.stringify({
          txjson,
          options: {
            submit: true,
            expire: 5,
            return_url: { app: returnTarget, web: returnTarget }
          }
        })
      });

      return res.status(200).json({
        uuid: payload.uuid,
        next: payload.next,
        refs: payload.refs,
        pushed: payload.pushed
      });
    }

    if (req.method === 'GET') {
      const uuid = req.query?.uuid;
      if (!uuid) {
        return res.status(400).json({ error: 'Missing uuid query parameter.' });
      }

      const status = await xummFetch(`/${uuid}`);
      const meta = status.meta || {};
      const responseBody = status.response || {};
      // Xumm puts the ledger hash in response.txid (not meta.txid).
      const txHash = responseBody.txid
        || responseBody.hash
        || meta.txid
        || meta.hash
        || null;
      const signed = Boolean(meta.signed);
      const cancelled = Boolean(meta.cancelled);
      const expired = Boolean(meta.expired);

      return res.status(200).json({
        uuid,
        signed,
        cancelled,
        expired,
        resolved: signed || cancelled || expired,
        txHash,
        account: responseBody.account || responseBody.Account || null,
        meta,
        response: responseBody
      });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
