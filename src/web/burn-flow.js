/**
 * Shared burn flow: pick NFT (if many) → confirm costs → sign burn.
 */
import {
  findAllMosaicNfts,
  burnMnemonicNftNonCustodial,
  isValidXrplAddress
} from '../core/xrpl.js';
import { confirmBurnCosts } from './cost-confirm.js';
import { pickMosaicNftForBurn } from './nft-picker.js';

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

  const result = await burnMnemonicNftNonCustodial(walletAddress, walletType, logger, {
    nftTokenId: selected.NFTokenID
  });
  return { cancelled: false, ...result, burnedTokenId: selected.NFTokenID };
}
