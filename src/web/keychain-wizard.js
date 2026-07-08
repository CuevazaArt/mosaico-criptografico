/**
 * Guided step-by-step wizard for novice users: address → mosaic → wallet → mint NFT.
 * Persists progress in sessionStorage so Xaman OAuth / return URLs do not reset the flow.
 */
import { sha256 } from '../core/crypto.js';
import { generateSvg } from '../core/generator.js';
import { playMnemonicAudio, playRegistrationSuccessFanfare } from '../core/audio.js';
import {
  connectWallet,
  registerMnemonicNftNonCustodial,
  setXrplNetwork,
  getXrplNetwork,
  getConnectedXamanAccount,
  waitForXamanPayloadSignature
} from '../core/xrpl.js';
import { burnKeychainWithSelection } from './burn-flow.js';
import { buildNftPackageSummary } from '../core/nft-package.js';
import { getAppConfig } from '../app-config.js';
import { hasAcceptedTerms, showToast, openRegisterTab } from './onboarding.js';
import { confirmMintCosts, confirmBurnCosts } from './cost-confirm.js';
import { openFirstUseGuide, hasCompletedFirstUseGuide, authorizeMintTour, scheduleFirstUseTour, clearFirstUseBurnBlock } from './first-use-guide.js';
import {
  saveMintSuccess,
  resolveMintAddress,
  fetchAccountFromXummPayload,
  readMintSuccess
} from './mint-success.js';

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const TOTAL_STEPS = 5;
const WIZARD_SESSION_KEY = 'mosaico_wizard_session';
const SESSION_TTL_MS = 30 * 60 * 1000;
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const WIZARD_BC = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('mosaico-wizard')
  : null;

let currentStep = 1;
let wizardAddress = '';
let wizardHash = null;
let connectedAddress = '';
let pendingAction = null;
let activePayloadUuid = null;
let mintListenerCleanup = null;

function $(id) {
  return document.getElementById(id);
}

function readStoredSession(storage) {
  try {
    const raw = storage.getItem(WIZARD_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.updatedAt || Date.now() - data.updatedAt > SESSION_TTL_MS) {
      storage.removeItem(WIZARD_SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function loadWizardSession() {
  return readStoredSession(sessionStorage) || readStoredSession(localStorage);
}

function saveWizardSession(partial = {}) {
  const prev = loadWizardSession() || {};
  const next = {
    ...prev,
    ...partial,
    wizardAddress: partial.wizardAddress ?? wizardAddress ?? prev.wizardAddress ?? '',
    connectedAddress: partial.connectedAddress ?? connectedAddress ?? prev.connectedAddress ?? '',
    step: partial.step ?? currentStep ?? prev.step ?? 1,
    pendingAction: partial.pendingAction !== undefined ? partial.pendingAction : (pendingAction ?? prev.pendingAction ?? null),
    payloadUuid: partial.payloadUuid !== undefined ? partial.payloadUuid : (activePayloadUuid ?? prev.payloadUuid ?? null),
    ownerTabId: partial.ownerTabId ?? prev.ownerTabId ?? TAB_ID,
    updatedAt: Date.now()
  };
  const encoded = JSON.stringify(next);
  try {
    sessionStorage.setItem(WIZARD_SESSION_KEY, encoded);
  } catch {
    /* ignore */
  }
  // localStorage survives Xaman deep-link / return_url opening a new tab.
  try {
    localStorage.setItem(WIZARD_SESSION_KEY, encoded);
  } catch {
    /* ignore */
  }
}

function clearWizardSession() {
  try {
    sessionStorage.removeItem(WIZARD_SESSION_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(WIZARD_SESSION_KEY);
  } catch {
    /* ignore */
  }
  pendingAction = null;
  activePayloadUuid = null;
}

function readXamanReturnParams() {
  try {
    const url = new URL(window.location.href);
    const payloadUuid = url.searchParams.get('xumm_payload')
      || url.searchParams.get('payload')
      || url.searchParams.get('id');
    const txid = url.searchParams.get('txid') || url.searchParams.get('txhash');
    const wizard = url.searchParams.get('wizard');
    return {
      payloadUuid: payloadUuid || null,
      txid: txid || null,
      wizard: wizard || null,
      hasReturn: Boolean(payloadUuid || txid || wizard)
    };
  } catch {
    return { payloadUuid: null, txid: null, wizard: null, hasReturn: false };
  }
}

function stripXamanReturnParams() {
  if (!window.history.replaceState) return;
  const url = new URL(window.location.href);
  if (!url.search) return;
  const isReturn = [...url.searchParams.keys()].some(k => /xumm|payload|txid|account|wizard/i.test(k));
  if (isReturn) {
    window.history.replaceState({}, document.title, url.pathname);
  }
}

function wizardLog(message) {
  const el = $('wizard-console');
  if (!el) return;
  const line = `[${new Date().toLocaleTimeString()}] ${message}\n`;
  el.textContent += line;
  el.scrollTop = el.scrollHeight;
}

function updateWalletStatusUI() {
  const status = $('wizard-wallet-status');
  if (!status) return;
  if (connectedAddress) {
    status.textContent = `🟢 Connected: ${connectedAddress.slice(0, 8)}…${connectedAddress.slice(-4)}`;
    status.className = 'wizard-status connected';
  }
}

function setStep(step, { persist = true } = {}) {
  currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
  document.querySelectorAll('.wizard-step').forEach(panel => {
    panel.classList.toggle('active', Number(panel.dataset.step) === currentStep);
  });
  document.querySelectorAll('.wizard-progress-step').forEach(dot => {
    const n = Number(dot.dataset.step);
    dot.classList.toggle('active', n === currentStep);
    dot.classList.toggle('done', n < currentStep);
  });
  $('wizard-back-btn')?.toggleAttribute('disabled', currentStep <= 1);
  $('wizard-next-btn')?.classList.toggle('hidden', currentStep >= TOTAL_STEPS);
  $('wizard-finish-btn')?.classList.toggle('hidden', currentStep < TOTAL_STEPS);

  const nextBtn = $('wizard-next-btn');
  if (nextBtn) {
    const labels = { 1: 'Next →', 2: 'Next →', 3: 'Connect Xaman →', 4: 'Mint NFT →' };
    nextBtn.textContent = labels[currentStep] || 'Next →';
    nextBtn.classList.toggle('btn-register', currentStep === 4);
    nextBtn.classList.toggle('btn-primary', currentStep !== 4);
    nextBtn.classList.toggle('wizard-mint-cta', currentStep === 4);
  }

  if (persist) {
    saveWizardSession({ step: currentStep, pendingAction });
  }
}

function validateAddress(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Paste your public XRPL address (starts with r).';
  if (!XRPL_ADDRESS_RE.test(trimmed)) return 'Invalid format. Use a public address only — never your secret key.';
  return null;
}

async function renderWizardMosaic() {
  const preview = $('wizard-mosaic-preview');
  if (!preview || !wizardAddress) return;
  wizardHash = await sha256(wizardAddress);
  preview.innerHTML = generateSvg(wizardHash, wizardAddress, {
    chaoticMode: false,
    showOverlay: true,
    showAnchors: true,
    gridSize: 3
  });
}

function syncAddressToApp() {
  const gen = $('address-input');
  const compareA = $('compare-a-input');
  const compareB = $('compare-b-input');
  if (gen) gen.value = wizardAddress;
  if (compareA) compareA.value = wizardAddress;
  if (compareB && compareB.value.startsWith('r')) compareB.value = wizardAddress;
  gen?.dispatchEvent(new Event('input', { bubbles: true }));
  compareA?.dispatchEvent(new Event('input', { bubbles: true }));
}

function requireTerms() {
  if (hasAcceptedTerms()) return true;
  showToast('Accept the Terms of Use before connecting your wallet.', 'warn', 6000);
  return false;
}

function postMintComplete(data) {
  WIZARD_BC?.postMessage({ type: 'mint-complete', ...data });
}

function showReturnOverlay() {
  const overlay = $('wizard-return-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideReturnOverlay() {
  $('wizard-return-overlay')?.classList.add('hidden');
}

function probeForOwnerTab(payloadUuid) {
  return new Promise((resolve) => {
    if (!WIZARD_BC) {
      resolve(false);
      return;
    }
    let answered = false;
    const handler = (event) => {
      if (event.data?.type === 'pong' && event.data.payloadUuid === payloadUuid) {
        answered = true;
        WIZARD_BC.removeEventListener('message', handler);
        resolve(true);
      }
    };
    WIZARD_BC.addEventListener('message', handler);
    WIZARD_BC.postMessage({ type: 'ping', payloadUuid, from: TAB_ID });
    setTimeout(() => {
      WIZARD_BC.removeEventListener('message', handler);
      resolve(answered);
    }, 450);
  });
}

function startMintBroadcastListener(payloadUuid) {
  mintListenerCleanup?.();
  if (!WIZARD_BC) return;

  const handler = (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'ping' && data.payloadUuid === payloadUuid) {
      WIZARD_BC.postMessage({ type: 'pong', payloadUuid, from: TAB_ID });
    }

    if (data.type === 'mint-complete' && data.hash) {
      void completeWizardSuccess(data, { broadcast: false, showTour: true });
    }
  };

  WIZARD_BC.addEventListener('message', handler);
  mintListenerCleanup = () => WIZARD_BC.removeEventListener('message', handler);
}

function launchCelebration() {
  const banner = $('wizard-success-banner');
  banner?.classList.add('wizard-celebrate-active');
  const container = $('wizard-celebrate-confetti');
  if (container) {
    container.innerHTML = '';
    container.setAttribute('aria-hidden', 'false');
    const colors = ['#38bdf8', '#10b981', '#a78bfa', '#fbbf24', '#f472b6'];
    for (let i = 0; i < 52; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.setProperty('--x', `${Math.random() * 100}%`);
      piece.style.setProperty('--delay', `${Math.random() * 0.55}s`);
      piece.style.setProperty('--color', colors[i % colors.length]);
      container.appendChild(piece);
    }
    setTimeout(() => {
      container.innerHTML = '';
      container.setAttribute('aria-hidden', 'true');
    }, 2200);
  }
  playRegistrationSuccessFanfare();
}

async function completeWizardSuccess({ hash, address }, { broadcast = true, showTour = false } = {}) {
  let resolvedAddress = address
    || connectedAddress
    || wizardAddress
    || resolveMintAddress({ connected: connectedAddress, wizard: wizardAddress });

  if (!resolvedAddress) {
    const session = loadWizardSession();
    resolvedAddress = session?.connectedAddress || session?.wizardAddress || '';
  }

  if (!resolvedAddress && activePayloadUuid) {
    resolvedAddress = await fetchAccountFromXummPayload(activePayloadUuid) || '';
  }

  if (resolvedAddress) {
    connectedAddress = connectedAddress || resolvedAddress;
    wizardAddress = wizardAddress || resolvedAddress;
  }

  if ($('wizard-tx-hash')) $('wizard-tx-hash').textContent = hash || 'Confirmed on ledger';
  if ($('wizard-success-address')) {
    $('wizard-success-address').textContent = resolvedAddress || '—';
  }

  const verifyLink = $('wizard-verify-link');
  if (verifyLink && resolvedAddress) {
    verifyLink.href = `/verify?address=${encodeURIComponent(resolvedAddress)}`;
  }

  saveMintSuccess({ address: resolvedAddress, hash });
  pendingAction = null;
  activePayloadUuid = null;
  clearWizardSession();
  hideReturnOverlay();
  setStep(5, { persist: false });
  wizardLog('Registration confirmed on XRPL Mainnet.');
  launchCelebration();
  showToast('🎉 Congratulations! Your keychain is registered on XRPL Mainnet.', 'success', 8000);
  if (broadcast) {
    postMintComplete({ hash, address: resolvedAddress });
  }
  // First-use real tour is mint-only, after Done.
  if (showTour && resolvedAddress && !hasCompletedFirstUseGuide()) {
    clearFirstUseBurnBlock();
    authorizeMintTour(resolvedAddress);
    scheduleFirstUseTour(resolvedAddress);
  }
}

async function resumeMintPolling(session, returnParams = {}) {
  const uuid = returnParams.payloadUuid || session.payloadUuid;
  let address = session.connectedAddress || session.wizardAddress || '';
  const returnedTxid = returnParams.txid || null;
  if (!uuid && !returnedTxid) return;

  activePayloadUuid = uuid || null;
  pendingAction = 'mint';
  openRegisterTab();
  setStep(4);
  wizardLog('Waiting for Xaman signature confirmation…');

  if (!address && uuid) {
    address = await fetchAccountFromXummPayload(uuid) || '';
  }

  // Deep-link return may already include a ledger hash — finish immediately.
  if (returnedTxid && returnedTxid !== '{txid}') {
    clearFirstUseBurnBlock();
    await completeWizardSuccess({ hash: returnedTxid, address }, { broadcast: true, showTour: true });
    return;
  }

  if (!uuid) {
    wizardLog('Missing Xaman payload id — open the original tab or mint again.');
    return;
  }

  const ownerExists = await probeForOwnerTab(uuid);
  if (ownerExists && session.ownerTabId && session.ownerTabId !== TAB_ID) {
    showReturnOverlay();
    wizardLog('Original tab is still open — closing this window…');
    try {
      const response = await fetch(`/api/xumm/payload?uuid=${encodeURIComponent(uuid)}`);
      if (response.ok) {
        const status = await response.json();
        if (status.signed) {
          postMintComplete({ hash: status.txHash || `signed:${uuid}`, address });
        }
      }
    } catch {
      // Original tab will finish polling.
    }
    setTimeout(() => window.close(), 1200);
    return;
  }

  startMintBroadcastListener(uuid);
  saveWizardSession({ ownerTabId: TAB_ID, pendingAction: 'mint', payloadUuid: uuid });

  try {
    const txHash = await waitForXamanPayloadSignature(uuid, wizardLog);
    clearFirstUseBurnBlock();
    await completeWizardSuccess({ hash: txHash, address }, { broadcast: true, showTour: true });
  } catch (err) {
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Mint confirmation failed.', 'warn', 6000);
    saveWizardSession({ pendingAction: 'mint', payloadUuid: uuid });
  } finally {
    mintListenerCleanup?.();
    mintListenerCleanup = null;
  }
}

async function tryCompletePendingConnect() {
  try {
    const account = await getConnectedXamanAccount();
    if (!account) return false;

    connectedAddress = account;
    pendingAction = null;
    updateWalletStatusUI();
    saveWizardSession({ connectedAddress, pendingAction: null, step: 4 });
    setStep(4);
    wizardLog(`Xaman connected: ${account}`);
    showToast('Wallet connected. You can mint your keychain NFT.', 'success', 4000);
    return true;
  } catch {
    return false;
  }
}

async function restoreWizardSession() {
  const returnParams = readXamanReturnParams();
  // Burn returns are handled by burn-result.js (fresh confirmation session).
  if (returnParams.wizard === 'burn') {
    stripXamanReturnParams();
    return false;
  }
  stripXamanReturnParams();

  let session = loadWizardSession();

  // Xaman opened a fresh tab: hydrate from URL + localStorage (or minimal mint resume).
  if (returnParams.hasReturn) {
    session = session || {};
    if (returnParams.payloadUuid) {
      session.payloadUuid = returnParams.payloadUuid;
      session.pendingAction = session.pendingAction || 'mint';
    }
    if (returnParams.wizard === 'mint') {
      session.pendingAction = 'mint';
      session.step = session.step || 4;
    }
  }

  if (!session || (!session.wizardAddress && !session.payloadUuid && !returnParams.txid)) {
    return false;
  }

  wizardAddress = session.wizardAddress || '';
  connectedAddress = session.connectedAddress || '';
  pendingAction = session.pendingAction || null;
  activePayloadUuid = session.payloadUuid || null;

  if (wizardAddress) {
    const input = $('wizard-address-input');
    if (input) input.value = wizardAddress;
    syncAddressToApp();
    await renderWizardMosaic();
  }
  updateWalletStatusUI();
  openRegisterTab();

  if ((session.pendingAction === 'mint' || returnParams.wizard === 'mint' || (returnParams.hasReturn && !returnParams.wizard))
    && (session.payloadUuid || returnParams.txid)) {
    await resumeMintPolling(session, returnParams);
    return true;
  }

  if (session.pendingAction === 'connect') {
    setStep(3);
    const completed = await tryCompletePendingConnect();
    if (completed) return true;
    wizardLog('Finish connecting Xaman on your phone, then return here.');
    return true;
  }

  if (session.step && session.step > 1) {
    setStep(session.step);
    return true;
  }

  return false;
}

async function handleConnect() {
  if (!requireTerms()) return;
  const btn = $('wizard-connect-btn');
  const status = $('wizard-wallet-status');
  if (btn) btn.disabled = true;
  if (status) {
    status.textContent = '🟡 Connecting to Xaman…';
    status.className = 'wizard-status connecting';
  }
  wizardLog('Opening Xaman — approve on your phone.');

  saveWizardSession({
    step: 3,
    wizardAddress,
    connectedAddress: '',
    pendingAction: 'connect',
    payloadUuid: null,
    ownerTabId: TAB_ID
  });

  setXrplNetwork('mainnet');
  const netSelect = $('xrpl-network-select');
  if (netSelect) netSelect.value = 'mainnet';
  const walletSelect = $('xrpl-wallet-select');
  if (walletSelect) walletSelect.value = 'xaman';

  try {
    connectedAddress = await connectWallet('xaman', wizardLog);
    pendingAction = null;
    if (status) {
      status.textContent = `🟢 Connected: ${connectedAddress.slice(0, 8)}…${connectedAddress.slice(-4)}`;
      status.className = 'wizard-status connected';
    }
    saveWizardSession({ connectedAddress, pendingAction: null, step: 4 });
    showToast('Wallet connected. You can mint your keychain NFT.', 'success', 4000);
    setStep(4);
  } catch (err) {
    if (status) {
      status.textContent = '🔴 Connection failed — try again';
      status.className = 'wizard-status failed';
    }
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Could not connect Xaman.', 'warn', 5000);
    saveWizardSession({ pendingAction: 'connect' });
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleMint() {
  if (!requireTerms()) return;
  const address = connectedAddress || wizardAddress;
  if (!address) {
    showToast('Connect your wallet or enter an address first.', 'warn', 5000);
    return;
  }

  setXrplNetwork('mainnet');
  const netSelect = $('xrpl-network-select');
  if (netSelect) netSelect.value = 'mainnet';

  const accepted = await confirmMintCosts(address, wizardLog);
  if (!accepted) {
    wizardLog('Mint cancelled — you did not accept the ledger costs.');
    return;
  }

  const pkg = buildNftPackageSummary(address, getAppConfig().appUrl);
  wizardLog(`Minting keychain package: mosaic + acoustic WAV via ${pkg.mintUri}`);

  const btn = $('wizard-next-btn');
  if (btn) btn.disabled = true;

  saveWizardSession({
    step: 4,
    wizardAddress,
    connectedAddress,
    pendingAction: 'mint',
    payloadUuid: null,
    ownerTabId: TAB_ID
  });
  pendingAction = 'mint';
  // A new mint clears any prior burn block so Done can offer first-use again.
  clearFirstUseBurnBlock();

  wizardLog(`Minting Soulbound NFT on ${getXrplNetwork()}…`);

  try {
    const res = await registerMnemonicNftNonCustodial(address, 'xaman', wizardLog, {
      onPayloadCreated: (uuid) => {
        activePayloadUuid = uuid;
        saveWizardSession({ payloadUuid: uuid, pendingAction: 'mint' });
        startMintBroadcastListener(uuid);
      }
    });

    if (res?.success) {
      await completeWizardSuccess({ hash: res.hash, address }, { broadcast: true, showTour: true });
    }
  } catch (err) {
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Mint failed.', 'warn', 6000);
    saveWizardSession({ pendingAction: 'mint', payloadUuid: activePayloadUuid });
  } finally {
    if (btn) btn.disabled = false;
    mintListenerCleanup?.();
    mintListenerCleanup = null;
  }
}

async function handleUnmint() {
  if (!requireTerms()) return;
  const address = connectedAddress || wizardAddress;
  if (!address) {
    showToast('No address available for burn.', 'warn', 5000);
    return;
  }

  const btn = $('wizard-unmint-btn');
  if (btn) btn.disabled = true;

  try {
    const result = await burnKeychainWithSelection(address, 'xaman', wizardLog);
    if (result.cancelled) {
      wizardLog('Burn cancelled.');
      return;
    }
    if (result?.success) {
      wizardLog(`Burn confirmed. Tx: ${result.hash}`);
      // Burn success UI is shown by burn-result (fresh session / confirmation panel).
      btn?.classList.add('hidden');
    }
  } catch (err) {
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Burn failed.', 'warn', 6000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function goNext() {
  if (currentStep === 1) {
    const input = $('wizard-address-input');
    const err = validateAddress(input?.value || '');
    const errEl = $('wizard-address-error');
    if (err) {
      if (errEl) errEl.textContent = err;
      input?.focus();
      return;
    }
    if (errEl) errEl.textContent = '';
    wizardAddress = input.value.trim();
    syncAddressToApp();
    renderWizardMosaic();
    saveWizardSession({ wizardAddress, pendingAction: null, payloadUuid: null });
    setStep(2);
    return;
  }
  if (currentStep === 2) {
    setStep(3);
    return;
  }
  if (currentStep === 3) {
    handleConnect();
    return;
  }
  if (currentStep === 4) {
    handleMint();
  }
}

function goBack() {
  if (currentStep > 1) setStep(currentStep - 1);
}

export async function initKeychainWizard() {
  $('wizard-next-btn')?.addEventListener('click', (event) => {
    if (currentStep === 4) {
      event.preventDefault();
      event.stopPropagation();
    }
    goNext();
  });
  $('wizard-back-btn')?.addEventListener('click', goBack);
  $('wizard-connect-btn')?.addEventListener('click', handleConnect);
  $('wizard-unmint-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleUnmint();
  });

  $('wizard-audio-btn')?.addEventListener('click', async () => {
    if (!wizardHash) await renderWizardMosaic();
    if (wizardHash) playMnemonicAudio(wizardHash, { gridSize: 3, chaoticMode: false });
  });

  $('wizard-finish-btn')?.addEventListener('click', async () => {
    let addr = resolveMintAddress({ connected: connectedAddress, wizard: wizardAddress });
    if (!addr) {
      addr = await getConnectedXamanAccount().catch(() => null);
    }
    if (!addr) {
      showToast('Could not find your XRPL address. Reconnect Xaman or start a new registration.', 'warn', 6000);
      return;
    }
    if (hasCompletedFirstUseGuide()) {
      showToast('You already completed the first-use tour.', 'info', 5000);
      return;
    }
    clearFirstUseBurnBlock();
    openFirstUseGuide(addr, { manual: true });
  });

  $('wizard-address-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goNext();
  });

  const restored = await restoreWizardSession();
  if (!restored) {
    setStep(1);
  }
  hydrateDoneScreenFromMintRecord();
}

function hydrateDoneScreenFromMintRecord() {
  if (currentStep !== 5) return;
  const record = readMintSuccess();
  if (!record?.address) return;
  const el = $('wizard-success-address');
  if (el && (!el.textContent?.trim() || el.textContent.trim() === '—')) {
    el.textContent = record.address;
  }
  if (!connectedAddress) connectedAddress = record.address;
  if (!wizardAddress) wizardAddress = record.address;
}
