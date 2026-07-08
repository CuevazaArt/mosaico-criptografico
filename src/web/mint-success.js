/**
 * Persists the last successful mint so Done / first-use can recover the address
 * after Xaman opens a return tab with empty in-memory wizard state.
 */
const MINT_SUCCESS_KEY = 'mosaico_mint_success';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function saveMintSuccess({ address, hash } = {}) {
  if (!address) return;
  try {
    localStorage.setItem(MINT_SUCCESS_KEY, JSON.stringify({
      address: String(address).trim(),
      hash: hash || null,
      at: Date.now()
    }));
  } catch {
    /* ignore */
  }
}

export function readMintSuccess() {
  try {
    const raw = localStorage.getItem(MINT_SUCCESS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.address || !data?.at || Date.now() - data.at > TTL_MS) {
      localStorage.removeItem(MINT_SUCCESS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function resolveMintAddress(fallbacks = {}) {
  const fromDom = typeof document !== 'undefined'
    ? document.getElementById('wizard-success-address')?.textContent?.trim()
    : '';
  const domAddr = fromDom && fromDom !== '—' ? fromDom : '';
  return (
    fallbacks.connected
    || fallbacks.wizard
    || domAddr
    || readMintSuccess()?.address
    || ''
  );
}

export async function fetchAccountFromXummPayload(uuid) {
  if (!uuid) return null;
  try {
    const response = await fetch(`/api/xumm/payload?uuid=${encodeURIComponent(uuid)}`);
    if (!response.ok) return null;
    const status = await response.json();
    const body = status.response || {};
    return body.account || body.Account || null;
  } catch {
    return null;
  }
}
