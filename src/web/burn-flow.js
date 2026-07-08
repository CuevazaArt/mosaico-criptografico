/**
 * Shared burn flow: pick NFT (if many) → confirm costs → sign burn.
 * Persists burn intent so Xaman return opens a fresh confirmation session.
 */
import {
  findAllMosaicNfts,
  burnMnemonicNftNonCustodial,
  isValidXrplAddress
} from '../core/xrpl.js';
import { confirmBurnCosts } from './cost-confirm.js';
import { pickMosaicNftForBurn } from './nft-picker.js';
import { saveBurnSession, completeBurnSuccess, clearBurnSession } from './burn-result.js';
import { blockFirstUseAfterBurn } from './first-use-guide.js';

export async function burnKeychainWithSelection(walletAddress, walletType, logger = () => {}) {
  if (!isValidXrplAddress(walletAddress)) {
    throw new Error('Invalid XRPL wallet address.');
  }

  const nfts = await findAllMosaicNfts(walletAddress, logger);
  if (!nfts.length) {
    throw new Error('No mosaic keychain NFT found on this account.');
  }

  const selected = await pickMosaicNftForBurn(nfts, walletAddress);
  if (!selected) {
    return { cancelled: true };
  }

  const accepted = await confirmBurnCosts(walletAddress, logger, selected.NFTokenID);
  if (!accepted) {
    return { cancelled: true };
  }

  // Persist intent before Xaman opens so a return_url tab can show burn confirmation.
  const reserveHint = accepted?.estimate?.reclaimedReserveXrp
    || accepted?.estimate?.recoverableOnBurnXrp
    || accepted?.estimate?.nftOwnerReserveXrp
    || '~2';

  // Cancel any pending first-use tour — burn is not a registration path.
  blockFirstUseAfterBurn();

  saveBurnSession({
    pendingAction: 'burn',
    address: walletAddress,
    nftTokenId: selected.NFTokenID,
    reserveXrp: String(reserveHint),
    payloadUuid: null,
    hash: null
  });

  try {
    const result = await burnMnemonicNftNonCustodial(walletAddress, walletType, logger, {
      nftTokenId: selected.NFTokenID,
      returnAction: 'burn',
      onPayloadCreated: (uuid) => {
        saveBurnSession({
          pendingAction: 'burn',
          address: walletAddress,
          nftTokenId: selected.NFTokenID,
          reserveXrp: String(reserveHint),
          payloadUuid: uuid
        });
      }
    });

    const payload = {
      cancelled: false,
      ...result,
      burnedTokenId: selected.NFTokenID,
      address: walletAddress,
      reserveXrp: String(reserveHint)
    };

    if (result?.success) {
      completeBurnSuccess(payload);
    }
    return payload;
  } catch (err) {
    // Keep session briefly so return tab can still finalize if signing succeeded.
    saveBurnSession({
      pendingAction: 'burn',
      address: walletAddress,
      nftTokenId: selected.NFTokenID,
      reserveXrp: String(reserveHint)
    });
    throw err;
  }
}

export { clearBurnSession };
