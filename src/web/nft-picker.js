/**
 * Modal picker when multiple mosaic keychain NFTs exist on one account.
 */
import { decodeMosaicNftUri } from '../core/nft-package.js';

let activeResolve = null;

function $(id) {
  return document.getElementById(id);
}

function closeModal() {
  $('nft-picker-modal')?.classList.remove('open');
  $('nft-picker-modal')?.setAttribute('aria-hidden', 'true');
}

function formatTokenId(tokenId) {
  if (!tokenId || tokenId.length < 12) return tokenId || '—';
  return `${tokenId.slice(0, 8)}…${tokenId.slice(-6)}`;
}

function renderNftOption(nft, index) {
  const uriInfo = decodeMosaicNftUri(nft.URI);
  const label = uriInfo.address
    ? `${uriInfo.address.slice(0, 10)}…${uriInfo.address.slice(-6)}`
    : formatTokenId(nft.NFTokenID);
  const uriLabel = uriInfo.raw
    ? `<span class="nft-picker-uri">${uriInfo.raw.length > 48 ? `${uriInfo.raw.slice(0, 48)}…` : uriInfo.raw}</span>`
    : '';

  return `
    <button type="button" class="nft-picker-option" data-index="${index}">
      <span class="nft-picker-option-title">Keychain #${index + 1}</span>
      <span class="nft-picker-option-address">${label}</span>
      <span class="nft-picker-option-id">Token ${formatTokenId(nft.NFTokenID)}</span>
      ${uriLabel}
    </button>
  `;
}

export function initNftPickerModal() {
  $('nft-picker-cancel-btn')?.addEventListener('click', () => {
    closeModal();
    activeResolve?.(null);
    activeResolve = null;
  });

  $('nft-picker-modal-backdrop')?.addEventListener('click', (event) => {
    if (event.target !== event.currentTarget) return;
    closeModal();
    activeResolve?.(null);
    activeResolve = null;
  });
}

export function pickMosaicNftForBurn(nfts, walletAddress) {
  if (!nfts?.length) return Promise.resolve(null);
  if (nfts.length === 1) return Promise.resolve(nfts[0]);

  if (activeResolve) return Promise.resolve(null);

  return new Promise((resolve) => {
    activeResolve = resolve;
    const list = $('nft-picker-list');
    const subtitle = $('nft-picker-subtitle');
    if (subtitle) {
      subtitle.textContent = `${nfts.length} keychain NFTs on ${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)}. Choose which one to burn.`;
    }
    if (list) {
      list.innerHTML = nfts.map((nft, index) => renderNftOption(nft, index)).join('');
      list.querySelectorAll('.nft-picker-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = Number(btn.getAttribute('data-index'));
          const selected = nfts[index];
          closeModal();
          activeResolve?.(selected);
          activeResolve = null;
        });
      });
    }

    const modal = $('nft-picker-modal');
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden', 'false');
  });
}
