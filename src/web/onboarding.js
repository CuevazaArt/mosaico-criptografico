/**
 * Onboarding, contextual help, and user feedback for new users.
 */

const STORAGE_WELCOME = 'mosaico_welcome_dismissed';
const STORAGE_TOUR = 'mosaico_tour_completed';
const STORAGE_WALLET_APPROACH = 'mosaico_wallet_approach_seen';
const STORAGE_TERMS = 'mosaico_terms_accepted';
const TERMS_VERSION = '1.0';

let switchToComparatorCallback = null;
let connectWalletCallback = null;
let setWalletTypeCallback = null;

const TAB_GUIDES = {
  'register-tab': {
    icon: '🔑',
    title: 'Register — Guided keychain setup',
    summary: 'Step-by-step: address → mosaic → Xaman → mint Soulbound NFT on Mainnet.',
    steps: [
      'Paste your public XRPL address (never your secret key).',
      'Preview and memorize your unique mosaic pattern.',
      'Connect Xaman on Mainnet (~2 XRP reserve for the NFT).',
      'Sign the mint transaction — your identity is anchored on-chain.'
    ]
  },
  'generator-tab': {
    icon: '⚡',
    title: 'Generator — Meet your visual keychain',
    summary: 'Paste any XRPL address and instantly get its unique mosaic and melody.',
    steps: [
      'Paste your address (starts with r) in the field on the left.',
      'Study the generated mosaic: colors, shapes, and central anchor position.',
      'Click 🔊 to hear the acoustic signature — another way to recognize the address.',
      'Memorize 2–3 simple details (e.g., "blue tones, star top-right").'
    ]
  },
  'comparator-tab': {
    icon: '⚖️',
    title: 'Comparator — Verify before signing',
    summary: 'Compare two addresses side by side. To register on-chain, start with Xaman (mobile) or Gem Wallet (alternative).',
    steps: [
      'Address A: the address you expect (trusted source).',
      'Address B: the one you just copied or pasted from your wallet.',
      'Green badge ✅ = safe · Red badge ⚠️ = possible phishing — do not sign.',
      'First approach: connect Xaman → mint Soulbound NFT → verify green badge.'
    ]
  },
  'testing-tab': {
    icon: '🎯',
    title: 'Simulator — Train your eye',
    summary: 'Six-option game: 5 are phishing traps. Can you spot the correct mosaic?',
    steps: [
      'Choose grid size and color mode.',
      'Click "Start Simulation" and memorize the target mosaic.',
      'Pick the option that matches visually among the six cards.',
      'Check your stats on the right: reaction time and streak.'
    ]
  }
};

const ELEMENT_TIPS = {
  'address-input': 'Your public XRPL address. Never paste your secret key (seed) here.',
  'random-address-btn': 'Generate a sample address to explore how the mosaic changes.',
  'play-audio-btn': 'Plays 4 unique notes derived from your address hash.',
  'compare-a-input': 'Trusted address — one you saved or know in advance.',
  'compare-b-input': 'Address to verify — the one you will use in the real transaction.',
  'simulate-phishing-btn': 'Demo: alters one character to show how the mosaic changes.',
  'force-match-btn': 'Copies Address A into B to show the green perfect-match badge.',
  'xrpl-register-mosaico-btn': 'Mint a Soulbound NFT on XRPL (~2 XRP recoverable reserve on Mainnet).',
  'xaman-connect-btn': 'Open Xaman on your phone, authorize, and sign the NFT via QR.',
  'gem-connect-btn': 'Alternative: Gem Wallet browser extension on Chrome or Brave.',
  'start-game-btn': 'Start the visual detection challenge against fake addresses.'
};

export function registerWalletApproachHandlers({ switchToComparator, setWalletType, connectWallet }) {
  switchToComparatorCallback = switchToComparator;
  setWalletTypeCallback = setWalletType;
  connectWalletCallback = connectWallet;
}

export function openRegisterTab() {
  document.querySelector('.nav-btn[data-tab="register-tab"]')?.click();
}

function scrollToWalletApproach() {
  document.getElementById('wallet-approach-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function readTermsAcceptance() {
  try {
    const raw = localStorage.getItem(STORAGE_TERMS);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version === TERMS_VERSION && data?.acceptedAt) return data;
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function saveTermsAcceptance() {
  localStorage.setItem(STORAGE_TERMS, JSON.stringify({
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString()
  }));
}

function setTermsUiState(state) {
  const modal = document.getElementById('terms-modal');
  const declined = document.getElementById('terms-declined-screen');
  const app = document.querySelector('.app-container');
  const root = document.documentElement;

  if (state === 'accepted') {
    root.dataset.termsAccepted = '1';
    document.body.classList.remove('terms-locked', 'terms-declined');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    declined?.classList.add('hidden');
    app?.removeAttribute('inert');
    return;
  }

  if (state === 'declined') {
    document.body.classList.add('terms-declined');
    document.body.classList.remove('terms-locked');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    declined?.classList.remove('hidden');
    app?.setAttribute('inert', '');
    return;
  }

  document.body.classList.add('terms-locked');
  document.body.classList.remove('terms-declined');
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
  declined?.classList.add('hidden');
  app?.setAttribute('inert', '');
}

function initTermsAcceptance() {
  if (readTermsAcceptance()) {
    setTermsUiState('accepted');
    return true;
  }

  setTermsUiState('pending');

  const checkbox = document.getElementById('terms-checkbox');
  const acceptBtn = document.getElementById('terms-accept-btn');
  const declineBtn = document.getElementById('terms-decline-btn');
  const reviewBtn = document.getElementById('terms-review-btn');

  checkbox?.addEventListener('change', () => {
    if (acceptBtn) acceptBtn.disabled = !checkbox.checked;
  });

  acceptBtn?.addEventListener('click', () => {
    if (!checkbox?.checked) return;
    saveTermsAcceptance();
    setTermsUiState('accepted');
    showToast('Terms accepted. Use this experimental tool at your own risk.', 'info', 5000);
  });

  declineBtn?.addEventListener('click', () => {
    setTermsUiState('declined');
  });

  reviewBtn?.addEventListener('click', () => {
    if (checkbox) checkbox.checked = false;
    if (acceptBtn) acceptBtn.disabled = true;
    setTermsUiState('pending');
  });

  return false;
}

export function hasAcceptedTerms() {
  return Boolean(readTermsAcceptance());
}

export function startXamanApproach(autoConnect = false) {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  openRegisterTab();
  showToast('Follow the steps: address → mosaic → connect Xaman → mint NFT.', 'info', 6500);
  if (autoConnect) {
    setTimeout(() => document.getElementById('wizard-connect-btn')?.click(), 800);
  }
}

export function startGemApproach(autoConnect = false) {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  switchToComparatorCallback?.();
  setWalletTypeCallback?.('gem');
  scrollToWalletApproach();
  showToast('Gem Wallet alternative: install the extension and click Connect.', 'info', 5500);
  if (autoConnect) {
    setTimeout(() => connectWalletCallback?.(), 400);
  }
}

function dismissWalletApproachPanel() {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  document.getElementById('wallet-approach-panel')?.classList.add('collapsed');
}

let toastTimer = null;

export function showToast(message, type = 'info', durationMs = 4500) {
  let container = document.getElementById('ui-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ui-toast-container';
    container.className = 'ui-toast-container';
    document.body.appendChild(container);
  }

  container.replaceChildren();

  const toast = document.createElement('div');
  toast.className = `ui-toast ui-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="ui-toast-icon">${type === 'success' ? '✅' : type === 'warn' ? '⚠️' : '💡'}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}

function updateTabGuide(tabId) {
  const guide = TAB_GUIDES[tabId];
  const panel = document.getElementById('tab-guide-panel');
  if (!panel || !guide) return;

  panel.innerHTML = `
    <div class="tab-guide-header">
      <span class="tab-guide-icon">${guide.icon}</span>
      <div>
        <h3 class="tab-guide-title">${guide.title}</h3>
        <p class="tab-guide-summary">${guide.summary}</p>
      </div>
    </div>
    <ol class="tab-guide-steps">
      ${guide.steps.map(s => `<li>${s}</li>`).join('')}
    </ol>
  `;
}

function bindTooltips() {
  document.querySelectorAll('[data-tip]').forEach(el => {
    const key = el.getAttribute('data-tip');
    const text = ELEMENT_TIPS[key] || el.getAttribute('data-tip-text');
    if (!text) return;

    el.classList.add('has-tip');
    el.setAttribute('aria-describedby', `tip-${key}`);

    const tip = document.createElement('span');
    tip.className = 'ui-tooltip';
    tip.id = `tip-${key}`;
    tip.setAttribute('role', 'tooltip');
    tip.textContent = text;
    el.appendChild(tip);
  });
}

function openHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function dismissWelcome() {
  localStorage.setItem(STORAGE_WELCOME, '1');
  const banner = document.getElementById('welcome-banner');
  if (banner) banner.classList.add('hidden');
  showToast('Welcome! Use the ❓ Help button anytime.', 'success');
}

function detectHostPlatform() {
  const host = window.location.hostname;
  if (host.includes('github.io')) return 'github-pages';
  if (host.includes('vercel.app')) return 'vercel';
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'unknown';
}

function showHostNotice() {
  const platform = detectHostPlatform();
  const notice = document.getElementById('host-platform-notice');
  if (!notice) return;

  if (platform === 'github-pages') {
    notice.style.display = 'flex';
    notice.innerHTML = `
      <span>📄</span>
      <span>You are on <strong>GitHub Pages</strong> (visual mode). For Mainnet NFT minting use the
      <a href="https://mosaico-criptografico.vercel.app" target="_blank" rel="noopener">full demo on Vercel</a>.</span>
    `;
  } else if (platform === 'vercel') {
    notice.style.display = 'flex';
    notice.innerHTML = `
      <span>🌊</span>
      <span>Full version with XRPL Mainnet registration. First approach: <strong>Xaman</strong> (mobile) or Gem Wallet (alternative).</span>
    `;
  }
}

export function initOnboarding() {
  const termsOk = initTermsAcceptance();

  bindTooltips();
  showHostNotice();

  const activeTab = document.querySelector('.tab-panel.active')?.id || 'register-tab';
  updateTabGuide(activeTab);

  const welcome = document.getElementById('welcome-banner');
  if (termsOk && welcome && !localStorage.getItem(STORAGE_WELCOME)) {
    welcome.classList.remove('hidden');
  }

  document.getElementById('welcome-dismiss-btn')?.addEventListener('click', dismissWelcome);
  document.getElementById('welcome-start-tour-btn')?.addEventListener('click', () => {
    dismissWelcome();
    openHelpModal();
  });
  document.getElementById('welcome-xaman-btn')?.addEventListener('click', () => {
    dismissWelcome();
    startXamanApproach(true);
  });
  document.getElementById('welcome-gem-btn')?.addEventListener('click', () => {
    dismissWelcome();
    startGemApproach(true);
  });

  document.getElementById('xaman-connect-btn')?.addEventListener('click', () => {
    setWalletTypeCallback?.('xaman');
    connectWalletCallback?.();
  });
  document.getElementById('gem-connect-btn')?.addEventListener('click', () => {
    setWalletTypeCallback?.('gem');
    connectWalletCallback?.();
  });
  document.getElementById('wallet-approach-dismiss')?.addEventListener('click', dismissWalletApproachPanel);

  document.getElementById('help-open-btn')?.addEventListener('click', openHelpModal);
  document.getElementById('help-close-btn')?.addEventListener('click', closeHelpModal);
  document.getElementById('help-modal-backdrop')?.addEventListener('click', closeHelpModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHelpModal();
  });

  if (termsOk && !localStorage.getItem(STORAGE_TOUR)) {
    localStorage.setItem(STORAGE_TOUR, '1');
    setTimeout(() => {
      showToast('New here? Open the 🔑 Register tab for a step-by-step keychain setup.', 'info', 6000);
    }, 1500);
  }

  if (termsOk && !localStorage.getItem(STORAGE_WALLET_APPROACH)) {
    document.getElementById('wallet-approach-panel')?.classList.remove('collapsed');
  }
}

export function onTabChanged(tabId) {
  updateTabGuide(tabId);
}

export function onAddressGenerated() {
  /* Mosaic updates silently — hint stays in the field label */
}

export function onComparisonResult(isMatch) {
  if (isMatch) {
    showToast('Addresses match — mosaics are identical. You may proceed with caution.', 'success');
  } else {
    showToast('Warning! Addresses differ — check for phishing before signing.', 'warn', 6000);
  }
}
