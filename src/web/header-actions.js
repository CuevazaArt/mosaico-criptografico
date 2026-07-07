/**
 * Global header actions: burn keychain & reclaim XRP reserve.
 */
import {
  connectWallet,
  findAllMosaicNfts,
  getConnectedXamanAccount,
  isValidXrplAddress,
  setXrplNetwork
} from '../core/xrpl.js';
import { getAppConfig } from '../app-config.js';
import { burnKeychainWithSelection } from './burn-flow.js';
import { hasAcceptedTerms, showToast, openRegisterTab } from './onboarding.js';

function formatBurnError(err) {
  const message = err?.message || err?.data?.error_message || String(err);
  if (/malformed/i.test(message)) {
    return 'Connect Xaman with the wallet that owns your keychain NFT, then try again.';
  }
  return message;
}

async function resolveBurnWalletAddress() {
  try {
    const connected = await getConnectedXamanAccount();
    if (isValidXrplAddress(connected)) {
      return connected;
    }
  } catch {
    // Fall through to authorize.
  }

  showToast('Connect Xaman to burn your keychain NFT.', 'info', 4000);
  const address = await connectWallet('xaman', () => {});
  if (!isValidXrplAddress(address)) {
    throw new Error('Xaman did not return a valid XRPL address.');
  }
  return address;
}

export async function handleHeaderBurnKeychain() {
  const btn = document.getElementById('header-burn-btn');
  if (btn?.disabled) return;

  if (!hasAcceptedTerms()) {
    showToast('Accept the Terms of Use before burning your keychain NFT.', 'warn', 6000);
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const config = getAppConfig();
    setXrplNetwork(config.defaultNetwork);

    let address;
    try {
      address = await resolveBurnWalletAddress();
    } catch (err) {
      showToast(formatBurnError(err), 'warn', 6500);
      openRegisterTab();
      return;
    }

    const nfts = await findAllMosaicNfts(address, () => {});
    if (!nfts.length) {
      showToast('No mosaic keychain NFT found on this Xaman account.', 'warn', 6000);
      return;
    }

    const result = await burnKeychainWithSelection(address, 'xaman', () => {});
    if (result.cancelled) return;
    if (result?.success) {
      showToast('Keychain burned — XRP reserve reclaimed to your account.', 'success', 7000);
    }
  } catch (err) {
    showToast(formatBurnError(err), 'warn', 6000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initHeaderActions() {
  document.getElementById('header-burn-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleHeaderBurnKeychain();
  });
}
