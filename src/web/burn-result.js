/**
 * Post-burn confirmation UI — shown when Xaman returns after NFTokenBurn,
 * or when burn completes in the original tab.
 */
import { showToast, openRegisterTab } from './onboarding.js';
import { blockFirstUseAfterBurn } from './first-use-guide.js';

const BURN_SESSION_KEY = 'mosaico_burn_session';
const SESSION_TTL_MS = 30 * 60 * 1000;
const DEFAULT_RESERVE_HINT = '~2';

function $(id) {
  return document.getElementById(id);
}

function readBurnSession() {
  try {
    const raw = localStorage.getItem(BURN_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.updatedAt || Date.now() - data.updatedAt > SESSION_TTL_MS) {
      localStorage.removeItem(BURN_SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveBurnSession(partial = {}) {
  const prev = readBurnSession() || {};
  const next = {
    ...prev,
    ...partial,
    updatedAt: Date.now()
  };
  try {
    localStorage.setItem(BURN_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearBurnSession() {
  try {
    localStorage.removeItem(BURN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getBurnSession() {
  return readBurnSession();
}

function truncateAddress(address) {
  if (!address || address.length < 12) return address || '—';
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

/**
 * Show a fresh confirmation panel: NFT burned, XRP reserve released to the account.
 */
export function showBurnSuccessScreen({
  address = '',
  hash = '',
  reserveXrp = DEFAULT_RESERVE_HINT,
  nftTokenId = ''
} = {}) {
  const overlay = $('burn-success-overlay');
  if (!overlay) {
    showToast('Keychain burned — XRP reserve reclaimed to your account.', 'success', 8000);
    return;
  }

  const addrEl = $('burn-success-address');
  const hashEl = $('burn-success-hash');
  const reserveEl = $('burn-success-reserve');
  const nftEl = $('burn-success-nft');

  if (addrEl) addrEl.textContent = address || '—';
  if (hashEl) hashEl.textContent = hash || 'Confirmed on ledger';
  if (reserveEl) {
    const amount = reserveXrp && reserveXrp !== '—' ? reserveXrp : DEFAULT_RESERVE_HINT;
    reserveEl.textContent = `${amount} XRP`;
  }
  if (nftEl) {
    nftEl.textContent = nftTokenId
      ? `${nftTokenId.slice(0, 12)}…${nftTokenId.slice(-8)}`
      : 'Mosaic keychain NFT';
  }

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('burn-success-open');
  openRegisterTab();
  showToast('🔥 NFT burned — owner reserve released back to your account.', 'success', 9000);
}

export function hideBurnSuccessScreen() {
  const overlay = $('burn-success-overlay');
  overlay?.classList.remove('is-open');
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('burn-success-open');
  clearBurnSession();
}

function suppressFirstUseAfterBurn() {
  // First-use tour is mint-only. Never prep or open it after a burn.
  blockFirstUseAfterBurn();
}

export function completeBurnSuccess(result = {}) {
  suppressFirstUseAfterBurn();

  const session = readBurnSession() || {};
  const payload = {
    address: result.address || session.address || '',
    hash: result.hash || session.hash || '',
    reserveXrp: result.reserveXrp || session.reserveXrp || DEFAULT_RESERVE_HINT,
    nftTokenId: result.burnedTokenId || result.nftTokenId || session.nftTokenId || ''
  };
  // Keep a completed snapshot until the user dismisses the panel so a
  // delayed Xaman return tab can still open a fresh confirmation session.
  saveBurnSession({
    ...payload,
    pendingAction: null,
    completed: true,
    payloadUuid: session.payloadUuid || null
  });
  showBurnSuccessScreen(payload);
}

/**
 * Resume burn after Xaman return_url opens a new tab.
 */
export async function resumeBurnFromReturn(returnParams = {}) {
  const session = readBurnSession() || {};
  const uuid = returnParams.payloadUuid || session.payloadUuid;
  const returnedTxid = returnParams.txid && returnParams.txid !== '{txid}'
    ? returnParams.txid
    : null;
  const address = session.address || '';

  if (session.completed) {
    completeBurnSuccess({
      address: session.address,
      hash: returnedTxid || session.hash,
      reserveXrp: session.reserveXrp,
      nftTokenId: session.nftTokenId
    });
    return true;
  }

  if (!uuid && !returnedTxid && returnParams.wizard !== 'burn') {
    return false;
  }

  // Prefer txid from return URL for a clean new-session confirmation.
  if (returnedTxid) {
    completeBurnSuccess({
      address,
      hash: returnedTxid,
      reserveXrp: session.reserveXrp,
      nftTokenId: session.nftTokenId
    });
    return true;
  }

  if (!uuid) {
    // Marked as burn return but no uuid/txid — still show confirmation if we had local state.
    if (session.address || returnParams.wizard === 'burn') {
      completeBurnSuccess({
        address: session.address,
        hash: session.hash || 'Confirmed on ledger',
        reserveXrp: session.reserveXrp,
        nftTokenId: session.nftTokenId
      });
      return true;
    }
    return false;
  }

  try {
    const response = await fetch(`/api/xumm/payload?uuid=${encodeURIComponent(uuid)}`);
    if (!response.ok) {
      throw new Error('Could not confirm burn status.');
    }
    const status = await response.json();
    if (status.signed) {
      completeBurnSuccess({
        address,
        hash: status.txHash || `signed:${uuid}`,
        reserveXrp: session.reserveXrp,
        nftTokenId: session.nftTokenId
      });
      return true;
    }
    if (status.cancelled) {
      clearBurnSession();
      showToast('Burn cancelled in Xaman.', 'warn', 5000);
      return true;
    }
    if (status.expired) {
      clearBurnSession();
      showToast('Burn signing request expired. Try again.', 'warn', 5000);
      return true;
    }

    // Still pending — keep panel intent via toast; session retained for retry.
    showToast('Waiting for burn confirmation from Xaman…', 'info', 5000);
    return true;
  } catch (err) {
    showToast(err.message || 'Could not confirm burn.', 'warn', 6000);
    return true;
  }
}

export function initBurnResultUi() {
  $('burn-success-close-btn')?.addEventListener('click', () => {
    hideBurnSuccessScreen();
  });
  $('burn-success-done-btn')?.addEventListener('click', () => {
    hideBurnSuccessScreen();
  });
  $('burn-success-overlay')?.addEventListener('click', (event) => {
    if (event.target?.id === 'burn-success-overlay') {
      hideBurnSuccessScreen();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('burn-success-overlay')?.classList.contains('is-open')) {
      hideBurnSuccessScreen();
    }
  });
}
