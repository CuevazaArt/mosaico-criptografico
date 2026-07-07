/**
 * User confirmation modal for on-chain actions with live ledger cost estimates.
 */
import { getMintCostEstimateForAddress, getBurnCostEstimateForAddress } from '../core/xrpl.js';
import { showToast } from './onboarding.js';

let activeResolve = null;

function $(id) {
  return document.getElementById(id);
}

function closeModal() {
  const modal = $('cost-confirm-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
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

function renderBody(estimate, address) {
  const netLabel = estimate.network === 'mainnet' ? 'Mainnet' : 'Testnet';
  const actionTitle = estimate.action === 'mint'
    ? 'Mint Soulbound keychain NFT'
    : 'Burn keychain NFT & reclaim reserve';

  const warning = estimate.action === 'burn'
    ? '<p class="cost-confirm-warning">⚠️ Burning removes your on-chain registration. You can mint again later if you change your mind.</p>'
    : '<p class="cost-confirm-note">The owner reserve stays locked while you hold the NFT. You can burn it later to reclaim that XRP.</p>';

  return `
    <p class="cost-confirm-lead"><strong>${actionTitle}</strong> on XRPL ${netLabel}</p>
    <p class="cost-confirm-address">Account: <code>${address}</code></p>
    <p class="cost-confirm-live">Live ledger values · fetched ${new Date(estimate.fetchedAt).toLocaleTimeString()}</p>
    <ul class="cost-confirm-list">${renderCostRows(estimate)}</ul>
    ${warning}
    <p class="cost-confirm-disclaimer">Fees and reserves come from the XRPL network — not this app. Do you accept these costs?</p>
  `;
}

export function initCostConfirmModal() {
  $('cost-confirm-accept-btn')?.addEventListener('click', () => {
    closeModal();
    activeResolve?.(true);
    activeResolve = null;
  });

  $('cost-confirm-cancel-btn')?.addEventListener('click', () => {
    closeModal();
    activeResolve?.(false);
    activeResolve = null;
  });

  $('cost-confirm-modal-backdrop')?.addEventListener('click', () => {
    closeModal();
    activeResolve?.(false);
    activeResolve = null;
  });
}

function openModal({ title, bodyHtml, acceptLabel, loading = false }) {
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
  }
  if (cancelBtn) cancelBtn.disabled = loading;

  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
}

export function confirmMintCosts(address, logger = () => {}) {
  return confirmLedgerAction('mint', address, logger);
}

export function confirmBurnCosts(address, logger = () => {}) {
  return confirmLedgerAction('burn', address, logger);
}

async function confirmLedgerAction(action, address, logger) {
  if (activeResolve) {
    return false;
  }

  openModal({
    title: action === 'mint' ? 'Confirm mint costs' : 'Confirm burn & reclaim',
    bodyHtml: '<p class="cost-confirm-loading">Fetching live costs from the XRPL ledger…</p>',
    acceptLabel: action === 'mint' ? 'Accept & mint' : 'Accept & burn',
    loading: true
  });

  let estimate;
  try {
    estimate = action === 'mint'
      ? await getMintCostEstimateForAddress(address, logger)
      : await getBurnCostEstimateForAddress(address, logger);
  } catch (err) {
    closeModal();
    showToast(`Could not fetch ledger costs: ${err.message}`, 'warn', 6000);
    return false;
  }

  openModal({
    title: action === 'mint' ? 'Confirm mint costs' : 'Confirm burn & reclaim',
    bodyHtml: renderBody(estimate, address),
    acceptLabel: action === 'mint' ? 'Accept & mint' : 'Accept & burn',
    loading: false
  });

  return new Promise((resolve) => {
    activeResolve = resolve;
  });
}
