/**
 * Guided step-by-step wizard for novice users: address → mosaic → wallet → mint NFT.
 */
import { sha256 } from '../core/crypto.js';
import { generateSvg } from '../core/generator.js';
import { playMnemonicAudio } from '../core/audio.js';
import {
  connectWallet,
  registerMnemonicNftNonCustodial,
  setXrplNetwork,
  getXrplNetwork
} from '../core/xrpl.js';
import { hasAcceptedTerms, showToast, openRegisterTab } from './onboarding.js';

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const TOTAL_STEPS = 5;

let currentStep = 1;
let wizardAddress = '';
let wizardHash = null;
let connectedAddress = '';

function $(id) {
  return document.getElementById(id);
}

function wizardLog(message) {
  const el = $('wizard-console');
  if (!el) return;
  const line = `[${new Date().toLocaleTimeString()}] ${message}\n`;
  el.textContent += line;
  el.scrollTop = el.scrollHeight;
}

function setStep(step) {
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

  setXrplNetwork('mainnet');
  const netSelect = $('xrpl-network-select');
  if (netSelect) netSelect.value = 'mainnet';
  const walletSelect = $('xrpl-wallet-select');
  if (walletSelect) walletSelect.value = 'xaman';

  try {
    connectedAddress = await connectWallet('xaman', wizardLog);
    if (status) {
      status.textContent = `🟢 Connected: ${connectedAddress.slice(0, 8)}…${connectedAddress.slice(-4)}`;
      status.className = 'wizard-status connected';
    }
    showToast('Wallet connected. You can mint your keychain NFT.', 'success', 4000);
    setStep(4);
  } catch (err) {
    if (status) {
      status.textContent = '🔴 Connection failed — try again';
      status.className = 'wizard-status failed';
    }
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Could not connect Xaman.', 'warn', 5000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleMint() {
  if (!requireTerms()) return;
  const btn = $('wizard-mint-btn');
  if (btn) btn.disabled = true;
  wizardLog(`Minting Soulbound NFT on ${getXrplNetwork()}…`);

  const address = connectedAddress || wizardAddress;
  try {
    const res = await registerMnemonicNftNonCustodial(address, 'xaman', wizardLog);
    if (res?.success) {
      $('wizard-tx-hash').textContent = res.hash || 'Confirmed on ledger';
      $('wizard-success-address').textContent = address;
      showToast('Keychain registered on XRPL!', 'success', 5000);
      setStep(5);
    }
  } catch (err) {
    wizardLog(`Error: ${err.message}`);
    showToast(err.message || 'Mint failed.', 'warn', 6000);
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

export function initKeychainWizard() {
  $('wizard-next-btn')?.addEventListener('click', goNext);
  $('wizard-back-btn')?.addEventListener('click', goBack);
  $('wizard-connect-btn')?.addEventListener('click', handleConnect);
  $('wizard-mint-btn')?.addEventListener('click', handleMint);
  $('open-wizard-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openRegisterTab();
  });

  $('wizard-audio-btn')?.addEventListener('click', async () => {
    if (!wizardHash) await renderWizardMosaic();
    if (wizardHash) playMnemonicAudio(wizardHash, { gridSize: 3, chaoticMode: false });
  });

  $('wizard-finish-btn')?.addEventListener('click', () => {
    document.querySelector('.nav-btn[data-tab="comparator-tab"]')?.click();
  });

  $('wizard-address-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goNext();
  });

  setStep(1);
}
