/**
 * Global header actions: burn keychain & reclaim XRP reserve.
 */
import {
  burnMnemonicNftNonCustodial,
  findMosaicNft,
  getConnectedXamanAccount,
  setXrplNetwork
} from '../core/xrpl.js';
import { getAppConfig } from '../app-config.js';
import { confirmBurnCosts } from './cost-confirm.js';
import { hasAcceptedTerms, showToast, openRegisterTab } from './onboarding.js';

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

async function resolveKeychainAddress() {
  try {
    const connected = await getConnectedXamanAccount();
    if (connected) return connected;
  } catch {
    // Fall through to form fields.
  }

  const candidates = [
    document.getElementById('wizard-address-input')?.value?.trim(),
    document.getElementById('xrpl-address-output')?.value?.trim(),
    document.getElementById('compare-a-input')?.value?.trim()
  ];

  return candidates.find(addr => addr && XRPL_ADDRESS_RE.test(addr)) || null;
}

export async function handleHeaderBurnKeychain() {
  if (!hasAcceptedTerms()) {
    showToast('Accept the Terms of Use before burning your keychain NFT.', 'warn', 6000);
    return;
  }

  const config = getAppConfig();
  setXrplNetwork(config.defaultNetwork);
  openRegisterTab();

  const address = await resolveKeychainAddress();
  if (!address) {
    showToast('Connect Xaman or paste your XRPL address in Register, then try again.', 'warn', 6500);
    return;
  }

  try {
    const nft = await findMosaicNft(address, () => {});
    if (!nft) {
      showToast('No mosaic keychain NFT found on this account.', 'warn', 6000);
      return;
    }
  } catch (err) {
    showToast(err.message || 'Could not verify NFT on the ledger.', 'warn', 6000);
    return;
  }

  const accepted = await confirmBurnCosts(address, () => {});
  if (!accepted) return;

  const btn = document.getElementById('header-burn-btn');
  if (btn) btn.disabled = true;
  try {
    const res = await burnMnemonicNftNonCustodial(address, 'xaman', () => {});
    if (res?.success) {
      showToast('Keychain burned — XRP reserve reclaimed to your account.', 'success', 7000);
    }
  } catch (err) {
    showToast(err.message || 'Burn failed.', 'warn', 6000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initHeaderActions() {
  document.getElementById('header-burn-btn')?.addEventListener('click', handleHeaderBurnKeychain);
}
