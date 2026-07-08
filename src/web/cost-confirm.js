/**
 * User confirmation modal for on-chain actions with live ledger cost estimates.
 */
import { getMintCostEstimateForAddress, getBurnCostEstimateForAddress } from '../core/xrpl.js';
import { buildNftPackageSummary } from '../core/nft-package.js';
import { getAppConfig } from '../app-config.js';
import { showToast } from './onboarding.js';

let activeResolve = null;
let modalSession = 0;
let interactionReadyAt = 0;
let swallowPointerUntil = 0;
let modalState = 'idle';
let currentAction = 'mint';
let currentAddress = '';
let currentLogger = () => {};
let currentNftTokenId = null;
let lastEstimate = null;

function $(id) {
  return document.getElementById(id);
}

function closeModal() {
  const modal = $('cost-confirm-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  modal?.removeAttribute('data-loading');
  modal?.removeAttribute('data-arming');
  modal?.removeAttribute('data-error');
  swallowPointerUntil = 0;
  modalState = 'idle';
}

function beginInteractionLock(ms = 800) {
  interactionReadyAt = Date.now() + ms;
}

function canInteract() {
  return Date.now() >= interactionReadyAt;
}

function isLoading() {
  return modalState === 'loading';
}

function isArming() {
  return $('cost-confirm-modal')?.dataset.arming === '1';
}

function armModalGuards() {
  const modal = $('cost-confirm-modal');
  modal?.setAttribute('data-arming', '1');
  beginInteractionLock(850);
  swallowPointerUntil = performance.now() + 750;

  window.setTimeout(() => {
    if (modal?.classList.contains('open')) {
      modal.removeAttribute('data-arming');
      beginInteractionLock(500);
    }
  }, 750);
}

function settlePendingPointerEvents() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 200);
      });
    });
  });
}

function finishModal(accepted) {
  const resolver = activeResolve;
  activeResolve = null;
  closeModal();
  if (!resolver) return;
  if (!accepted) {
    resolver(false);
    return;
  }
  resolver(lastEstimate ? { accepted: true, estimate: lastEstimate } : { accepted: true });
}

function shouldSwallowPointerEvent(event) {
  const firstUseModal = $('first-use-modal');
  if (firstUseModal?.classList.contains('is-open')) return false;
  if (firstUseModal?.contains(event.target)) return false;

  if (performance.now() >= swallowPointerUntil) return false;
  const modal = $('cost-confirm-modal');
  if (!modal?.classList.contains('open')) return false;
  const cancelBtn = $('cost-confirm-cancel-btn');
  if (cancelBtn && (event.target === cancelBtn || cancelBtn.contains(event.target))) {
    return false;
  }
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCostRows(estimate) {
  if (estimate.action === 'mint') {
    return `
      <li><strong>NFT owner reserve (locked):</strong> ${estimate.nftOwnerReserveXrp} XRP</li>
      <li><strong>Network fee (not recoverable):</strong> ${estimate.networkFeeXrp} XRP</li>
      <li><strong>Recoverable if you burn later:</strong> ${estimate.recoverableOnBurnXrp} XRP</li>
    `;
  }
  return `
    <li><strong>Reserve you will reclaim:</strong> ${estimate.reclaimedReserveXrp} XRP</li>
    <li><strong>Network fee (not recoverable):</strong> ${estimate.networkFeeXrp} XRP</li>
    <li><strong>Estimated net credit:</strong> ~${estimate.netRecoveryXrp} XRP</li>
  `;
}

function renderMintPackageBlock(address) {
  const pkg = buildNftPackageSummary(address, getAppConfig().appUrl);
  return `
    <div class="cost-confirm-package">
      <p class="cost-confirm-package-title"><strong>Keychain package anchored in NFT URI</strong></p>
      <ul class="cost-confirm-package-list">
        <li>🎨 Visual mosaic (SVG): <a href="${pkg.imageUrl}" target="_blank" rel="noopener">preview</a></li>
        <li>🔊 Acoustic signature (WAV): <a href="${pkg.audioUrl}" target="_blank" rel="noopener">listen</a></li>
        <li>📦 Metadata manifest (JSON): <a href="${pkg.mintUri}" target="_blank" rel="noopener">open</a></li>
      </ul>
      <p class="cost-confirm-package-note">Wallets and explorers resolve this URI to your full visual + sound keychain.</p>
    </div>
  `;
}

function renderBody(estimate, address) {
  const netLabel = estimate.network === 'mainnet' ? 'Mainnet' : 'Testnet';
  const actionTitle = estimate.action === 'mint'
    ? 'Mint Soulbound keychain NFT'
    : 'Burn keychain NFT & reclaim reserve';

  const warning = estimate.action === 'burn'
    ? '<p class="cost-confirm-warning">⚠️ Burning removes your on-chain registration. You can mint again later if you change your mind.</p>'
    : '<p class="cost-confirm-note">The owner reserve stays locked while you hold the NFT. You can burn it later to reclaim that XRP.</p>';

  const packageBlock = estimate.action === 'mint'
    ? renderMintPackageBlock(address)
    : '';

  const sourceNote = estimate.reserveSource === 'fallback'
    ? '<p class="cost-confirm-note">Using standard XRPL reserve defaults — live node did not return reserve fields.</p>'
    : '';

  return `
    <p class="cost-confirm-lead"><strong>${actionTitle}</strong> on XRPL ${netLabel}</p>
    <p class="cost-confirm-address">Account: <code>${address}</code></p>
    <p class="cost-confirm-live">Live ledger values · fetched ${new Date(estimate.fetchedAt).toLocaleTimeString()}</p>
    <ul class="cost-confirm-list">${renderCostRows(estimate)}</ul>
    ${packageBlock}
    ${sourceNote}
    ${warning}
    <p class="cost-confirm-disclaimer">Fees and reserves come from the XRPL network — not this app. Do you accept these costs?</p>
  `;
}

function renderErrorBody(message) {
  return `
    <p class="cost-confirm-warning">⚠️ Could not load ledger costs</p>
    <p class="cost-confirm-error-detail">${escapeHtml(message)}</p>
    <p class="cost-confirm-note">Check your internet connection and try again, or cancel and come back later.</p>
  `;
}

function openModal({ title, bodyHtml, acceptLabel, loading = false, error = false }) {
  const modal = $('cost-confirm-modal');
  const titleEl = $('cost-confirm-title');
  const bodyEl = $('cost-confirm-body');
  const acceptBtn = $('cost-confirm-accept-btn');
  const cancelBtn = $('cost-confirm-cancel-btn');

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  if (acceptBtn) {
    acceptBtn.textContent = acceptLabel;
    acceptBtn.disabled = loading;
    acceptBtn.setAttribute('aria-disabled', loading ? 'true' : 'false');
  }
  if (cancelBtn) {
    cancelBtn.disabled = false;
  }

  if (loading) {
    modal?.setAttribute('data-loading', '1');
    modal?.removeAttribute('data-arming');
    modal?.removeAttribute('data-error');
  } else if (error) {
    modal?.removeAttribute('data-loading');
    modal?.removeAttribute('data-arming');
    modal?.setAttribute('data-error', '1');
  } else {
    modal?.removeAttribute('data-loading');
    modal?.removeAttribute('data-error');
  }

  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
}

async function fetchEstimate(action, address, logger) {
  return action === 'mint'
    ? getMintCostEstimateForAddress(address, logger)
    : getBurnCostEstimateForAddress(address, logger, currentNftTokenId);
}

async function presentCosts(session) {
  modalState = 'loading';
  openModal({
    title: currentAction === 'mint' ? 'Confirm mint costs' : 'Confirm burn & reclaim',
    bodyHtml: '<p class="cost-confirm-loading">Fetching live costs from the XRPL ledger…</p>',
    acceptLabel: currentAction === 'mint' ? 'Accept & mint' : 'Accept & burn',
    loading: true
  });

  try {
    const estimate = await fetchEstimate(currentAction, currentAddress, currentLogger);
    if (session !== modalSession || !activeResolve) return;
    lastEstimate = estimate;

    await settlePendingPointerEvents();

    modalState = 'ready';
    openModal({
      title: currentAction === 'mint' ? 'Confirm mint costs' : 'Confirm burn & reclaim',
      bodyHtml: renderBody(estimate, currentAddress),
      acceptLabel: currentAction === 'mint' ? 'Accept & mint' : 'Accept & burn',
      loading: false
    });
    armModalGuards();
  } catch (err) {
    if (session !== modalSession || !activeResolve) return;

    await settlePendingPointerEvents();

    modalState = 'error';
    openModal({
      title: 'Could not load ledger costs',
      bodyHtml: renderErrorBody(err.message || 'Unknown error'),
      acceptLabel: 'Retry',
      loading: false,
      error: true
    });
    armModalGuards();
    showToast('Could not fetch ledger costs. Use Retry in the modal or Cancel.', 'warn', 5000);
  }
}

export function initCostConfirmModal() {
  const panel = document.querySelector('#cost-confirm-modal .cost-confirm-panel');
  const swallow = (event) => {
    if (!shouldSwallowPointerEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  ['click', 'pointerup', 'touchend'].forEach((type) => {
    document.addEventListener(type, swallow, true);
  });

  panel?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  $('cost-confirm-accept-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!activeResolve) return;

    if (modalState === 'error') {
      void presentCosts(modalSession);
      return;
    }

    if (isLoading() || isArming() || !canInteract()) return;
    finishModal(true);
  });

  $('cost-confirm-cancel-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!activeResolve) return;
    finishModal(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const modal = $('cost-confirm-modal');
    if (!modal?.classList.contains('open') || !activeResolve || isLoading()) return;
    event.preventDefault();
    finishModal(false);
  });
}

export function confirmMintCosts(address, logger = () => {}) {
  return confirmLedgerAction('mint', address, logger);
}

export function confirmBurnCosts(address, logger = () => {}, nftTokenId = null) {
  return confirmLedgerAction('burn', address, logger, nftTokenId);
}

async function confirmLedgerAction(action, address, logger, nftTokenId = null) {
  if (activeResolve) {
    return false;
  }

  const session = ++modalSession;
  currentAction = action;
  currentAddress = address;
  currentLogger = logger;
  currentNftTokenId = nftTokenId;
  lastEstimate = null;

  return new Promise((resolve) => {
    activeResolve = (result) => {
      if (session !== modalSession) return;
      activeResolve = null;
      closeModal();
      resolve(result);
    };

    void presentCosts(session);
  });
}
