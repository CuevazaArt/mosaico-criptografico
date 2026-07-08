/**
 * Public verification page — confirms Mosaic Keychain NFT on XRPL Mainnet.
 */
import { findMosaicNft, setXrplNetwork } from '../core/xrpl.js';
import { buildNftPackageUrls } from '../core/nft-package.js';

const ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

function $(id) {
  return document.getElementById(id);
}

function setStatus(kind, html) {
  const el = $('verify-status');
  if (!el) return;
  el.className = `verify-status verify-status--${kind}`;
  el.innerHTML = html;
}

function readAddressFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('address') || '').trim();
}

function renderValid(address, nft) {
  const urls = buildNftPackageUrls(address);
  const bithomp = `https://bithomp.com/nft/${encodeURIComponent(nft.NFTokenID)}`;
  const explorer = `https://livenet.xrpl.org/accounts/${encodeURIComponent(address)}`;
  setStatus('ok', `
    <p><strong>✅ Valid Mosaic Keychain</strong></p>
    <ul class="verify-result-list">
      <li><strong>Address:</strong> <code>${address}</code></li>
      <li><strong>NFTokenID:</strong> <code>${nft.NFTokenID}</code></li>
      <li><strong>Taxon:</strong> <code>${nft.NFTokenTaxon}</code></li>
      <li><strong>Issuer == Owner:</strong> yes (self-issued)</li>
    </ul>
    <p class="verify-links">
      <a href="${urls.metadata}" target="_blank" rel="noopener">Metadata JSON</a>
      <a href="${urls.image}" target="_blank" rel="noopener">NFT image</a>
      <a href="${bithomp}" target="_blank" rel="noopener">Bithomp NFT</a>
      <a href="${explorer}" target="_blank" rel="noopener">XRPL explorer</a>
    </p>
    <p class="verify-note">If Xaman still shows a scam warning, see the <a href="https://github.com/CuevazaArt/mosaico-criptografico/blob/main/XAMAN_TRUST_ISSUE.md" target="_blank" rel="noopener">known issue guide</a> — your on-chain anchor can still be valid.</p>
  `);
}

async function runVerify(address) {
  if (!ADDRESS_RE.test(address)) {
    setStatus('error', '<p>Enter a valid XRPL address (starts with <code>r</code>).</p>');
    return;
  }

  setStatus('loading', '<p>Querying XRPL Mainnet <code>account_nfts</code>…</p>');
  setXrplNetwork('mainnet');

  try {
    const nft = await findMosaicNft(address, (msg) => {
      const el = $('verify-log');
      if (el) el.textContent = String(msg).replace(/^\[red\]\s*/, '');
    });
    if (!nft) {
      setStatus('warn', `
        <p><strong>❓ No Mosaic Keychain found</strong></p>
        <p>No NFT with taxon <code>1001</code> where Issuer equals Owner was found for this address on Mainnet.</p>
        <p>Mint at <a href="/">mosaico-criptografico.vercel.app</a> or confirm you are on Mainnet.</p>
      `);
      return;
    }
    renderValid(address, nft);
    const url = new URL(window.location.href);
    url.searchParams.set('address', address);
    window.history.replaceState({}, '', url);
  } catch (err) {
    setStatus('error', `<p><strong>Could not verify:</strong> ${err.message || 'Network error'}</p>`);
  }
}

export function initVerifyPage() {
  const input = $('verify-address-input');
  const btn = $('verify-submit-btn');
  const prefill = readAddressFromQuery();

  if (input && prefill) {
    input.value = prefill;
    void runVerify(prefill);
  }

  btn?.addEventListener('click', () => {
    const address = input?.value?.trim() || '';
    void runVerify(address);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runVerify(input.value.trim());
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initVerifyPage());
} else {
  initVerifyPage();
}
