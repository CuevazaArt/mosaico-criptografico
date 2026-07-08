/**
 * XRP Ledger integration module.
 * Provides methods to register and verify mosaic keys on-chain
 * using the XLS-20 standard (NFTs), with network redundancy and non-custodial support.
 */

import { getAppConfig, isProductionDeployment } from '../app-config.js';
import { buildNftMintUri } from './nft-package.js';

const NETWORKS = {
  testnet: [
    "wss://s.altnet.rippletest.net:51233",
    "wss://testnet.xrpl-labs.com",
    "wss://s.altnet.rippletest.net:51234"
  ],
  mainnet: [
    "wss://xrplcluster.com",
    "wss://s1.ripple.com",
    "wss://s2.ripple.com",
    "wss://xrpl.ws"
  ]
};

const NFT_TAXON_MOSAICO = 1001;

export function isValidXrplAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (typeof window.xrpl?.isValidClassicAddress === 'function') {
    return window.xrpl.isValidClassicAddress(trimmed);
  }
  if (typeof window.xrpl?.isValidAddress === 'function') {
    return window.xrpl.isValidAddress(trimmed);
  }
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(trimmed);
}

let clientInstance = null;
let currentNetwork = 'testnet';

function getXummClient() {
  const config = getAppConfig();
  if (!config.xummApiKey) {
    throw new Error("Xaman is not configured. Set XUMM_API_KEY in .env and run npm run config.");
  }
  if (typeof window.Xumm === 'undefined') {
    throw new Error("Xumm SDK failed to load. Check your network connection.");
  }
  if (!window.__xummClient) {
    window.__xummClient = new window.Xumm(config.xummApiKey);
  }
  return window.__xummClient;
}

function buildMintTxJson(address) {
  if (typeof window.xrpl?.convertStringToHex !== 'function') {
    throw new Error('XRPL SDK is not ready. Reload the page and try again.');
  }
  const config = getAppConfig();
  const mintUri = buildNftMintUri(address, config.appUrl);
  const uriHex = window.xrpl.convertStringToHex(mintUri);
  return {
    TransactionType: "NFTokenMint",
    Account: address,
    NFTokenTaxon: NFT_TAXON_MOSAICO,
    Flags: 0,
    URI: uriHex
  };
}

export function getNftMintPackageUri(address) {
  const config = getAppConfig();
  return buildNftMintUri(address, config.appUrl);
}

async function pollXamanPayload(uuid, logger, timeoutMs = 300000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`/api/xumm/payload?uuid=${encodeURIComponent(uuid)}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Payload status check failed (${response.status})`);
    }
    const status = await response.json();
    if (status.signed) {
      // Prefer ledger txid; fall back so wizard can still complete if hash lag occurs.
      return status.txHash || `signed:${uuid}`;
    }
    if (status.cancelled) {
      throw new Error("Transaction cancelled in Xaman.");
    }
    if (status.expired) {
      throw new Error("Xaman signing request expired. Please try again.");
    }
    logger("[red] Waiting for signature in Xaman app...");
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  throw new Error("Timed out waiting for Xaman signature.");
}

export function setXrplNetwork(network) {
  if (network === 'mainnet' || network === 'testnet') {
    if (currentNetwork !== network) {
      currentNetwork = network;
      disconnectXrpl();
    }
  }
}

export function getXrplNetwork() {
  return currentNetwork;
}

export async function getXrplClient(logger = console.log) {
  if (typeof window.xrpl === 'undefined') {
    throw new Error("XRPL SDK has not loaded correctly in the window.");
  }

  if (clientInstance && clientInstance.isConnected()) {
    return clientInstance;
  }

  const netName = currentNetwork === 'mainnet' ? "Mainnet" : "Testnet";
  const nodes = NETWORKS[currentNetwork];

  for (const node of nodes) {
    try {
      logger(`[red] Connecting to node ${netName} (${node})...`);
      clientInstance = new window.xrpl.Client(node);

      clientInstance.on('disconnected', (code) => {
        logger(`[red] Closed connection with XRPL node. Code: ${code}`);
        clientInstance = null;
      });

      await clientInstance.connect();
      logger(`[red] Connection established with XRPL ${netName}!`);
      return clientInstance;
    } catch (err) {
      logger(`[red] Connection error on ${node}: ${err.message}. Trying next node...`);
      clientInstance = null;
    }
  }

  throw new Error(`Could not connect to any node on the ${netName} network.`);
}

export async function disconnectXrpl() {
  if (clientInstance && clientInstance.isConnected()) {
    try {
      await clientInstance.disconnect();
    } catch (e) {
      // Ignore failures on close
    }
  }
  clientInstance = null;
}

export async function generateFaucetWallet(logger = console.log) {
  if (currentNetwork === 'mainnet') {
    throw new Error("Automatic wallet generation with Faucet is not available on Mainnet. Connect a non-custodial wallet instead.");
  }

  const client = await getXrplClient(logger);
  logger("[red] Requesting funds from XRPL Testnet Faucet...");

  const { wallet, balance } = await client.fundWallet();

  logger(`[red] Account created! Address: ${wallet.address}`);
  logger(`[red] Initial balance: ${balance} XRP`);
  return {
    address: wallet.address,
    seed: wallet.seed,
    wallet
  };
}

export async function waitForXamanPayloadSignature(uuid, logger = console.log, timeoutMs = 300000) {
  return pollXamanPayload(uuid, logger, timeoutMs);
}

export async function getConnectedXamanAccount() {
  const xumm = getXummClient();
  if (!xumm.authorized) {
    return null;
  }
  const account = await xumm.user.account;
  return account || null;
}

export async function connectWallet(walletType, logger = console.log) {
  if (walletType === 'gem') {
    if (typeof window.GemWallet === 'undefined') {
      throw new Error("Gem Wallet is not installed. Install the extension from gemwallet.app");
    }
    logger("[red] Connecting to Gem Wallet...");
    const response = await window.GemWallet.getAddress();
    if (!response?.result?.address) {
      throw new Error("User rejected connection or no address was returned.");
    }
    logger(`[red] Gem Wallet connected: ${response.result.address}`);
    return response.result.address;
  }

  if (walletType === 'crossmark') {
    if (typeof window.crossmark === 'undefined') {
      throw new Error("Crossmark is not installed. Install the extension from crossmark.io");
    }
    logger("[red] Connecting to Crossmark...");
    let address = window.crossmark.address;
    if (!address) {
      const response = await window.crossmark.signIn();
      address = response.address;
    }
    if (!address) {
      throw new Error("User rejected connection or no address was returned.");
    }
    logger(`[red] Crossmark connected: ${address}`);
    return address;
  }

  if (walletType === 'xaman') {
    logger("[red] Connecting to Xaman (Xumm)...");
    const xumm = getXummClient();
    await xumm.authorize();
    const account = await xumm.user.account;
    if (!account) {
      throw new Error("User rejected Xaman authorization or no account was returned.");
    }
    logger(`[red] Xaman connected: ${account}`);
    return account;
  }

  throw new Error("Unsupported wallet type.");
}

export async function registerMnemonicNft(seed, logger = console.log) {
  if (isProductionDeployment()) {
    throw new Error("Seed-based signing is disabled in production. Connect Gem Wallet, Crossmark, or Xaman.");
  }

  const client = await getXrplClient(logger);
  const wallet = window.xrpl.Wallet.fromSeed(seed);

  logger(`[red] Preparing registration for: ${wallet.address}`);
  logger("[red] Creating NFTokenMint transaction...");

  const txJson = buildMintTxJson(wallet.address);

  logger("[red] Submitting transaction to the ledger and waiting for validation...");
  const response = await client.submitAndWait(txJson, { wallet });

  if (response.result.meta.TransactionResult === "tesSUCCESS") {
    logger(`[red] Mosaic key successfully registered! Tx Hash: ${response.result.hash}`);
    return { success: true, hash: response.result.hash };
  }
  throw new Error(`Ledger error: ${response.result.meta.TransactionResult}`);
}

async function signWithXamanBackend(txJson, logger, options = {}) {
  const response = await fetch('/api/xumm/payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txjson: txJson,
      returnAction: options.returnAction || 'mint'
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create Xaman payload (${response.status})`);
  }
  const payload = await response.json();
  if (!payload?.next?.always) {
    throw new Error("Xaman payload created but no signing URL was returned.");
  }
  options.onPayloadCreated?.(payload.uuid);
  logger(`[red] Open Xaman to sign: ${payload.next.always}`);
  window.open(payload.next.always, '_blank', 'noopener,noreferrer');
  const txHash = await pollXamanPayload(payload.uuid, logger);
  return { success: true, hash: txHash };
}

async function signWithXamanSdk(txJson, logger, options = {}) {
  const xumm = getXummClient();
  if (!xumm.authorized) {
    await xumm.authorize();
  }
  const appUrl = String(getAppConfig().appUrl || window.location.origin).replace(/\/$/, '');
  const action = options.returnAction || 'mint';
  const returnTarget = `${appUrl}/?xumm_payload={id}&txid={txid}&wizard=${action}`;
  const payload = await xumm.payload.create({
    txjson: txJson,
    options: {
      submit: true,
      return_url: { app: returnTarget, web: returnTarget }
    }
  });
  if (!payload?.next?.always) {
    throw new Error("Xaman payload created but no signing URL was returned.");
  }
  options.onPayloadCreated?.(payload.uuid);
  logger(`[red] Open Xaman to sign: ${payload.next.always}`);
  window.open(payload.next.always, '_blank', 'noopener,noreferrer');
  const resolved = await payload.resolved();
  if (!resolved?.signed) {
    throw new Error("Transaction cancelled or failed in Xaman.");
  }
  const txHash = resolved.txid || payload.uuid;
  return { success: true, hash: txHash };
}

async function signWithXaman(txJson, logger, options = {}) {
  const config = getAppConfig();
  if (config.xummBackendEnabled) {
    return signWithXamanBackend(txJson, logger, options);
  }
  return signWithXamanSdk(txJson, logger, options);
}

function buildBurnTxJson(address, nftTokenId) {
  return {
    TransactionType: "NFTokenBurn",
    Account: address,
    NFTokenID: nftTokenId
  };
}

export async function findAllMosaicNfts(address, logger = () => {}) {
  if (!isValidXrplAddress(address)) {
    throw new Error('Invalid XRPL address.');
  }
  const client = await getXrplClient(logger);
  const response = await client.request({
    command: "account_nfts",
    account: address,
    ledger_index: "validated"
  });
  const nfts = response.result.account_nfts || [];
  return nfts.filter(nft => nft.NFTokenTaxon === NFT_TAXON_MOSAICO && nft.Issuer === address);
}

export async function findMosaicNft(address, logger = () => {}) {
  const nfts = await findAllMosaicNfts(address, logger);
  return nfts[0] || null;
}

async function resolveMosaicNftForBurn(address, logger, nftTokenId) {
  const nfts = await findAllMosaicNfts(address, logger);
  if (!nfts.length) return null;
  if (nftTokenId) {
    return nfts.find(nft => nft.NFTokenID === nftTokenId) || null;
  }
  return nfts[0];
}

export async function getMintCostEstimateForAddress(address, logger = () => {}) {
  const { getMintCostEstimate } = await import('./xrpl-reserves.js');
  return getMintCostEstimate(address, buildMintTxJson, logger);
}

export async function getBurnCostEstimateForAddress(address, logger = () => {}, nftTokenId = null) {
  const { getBurnRecoveryEstimate } = await import('./xrpl-reserves.js');
  return getBurnRecoveryEstimate(address, async (addr, client) => {
    const nft = await resolveMosaicNftForBurn(addr, logger, nftTokenId);
    if (!nft) {
      throw new Error("No mosaic keychain NFT found on this account.");
    }
    return buildBurnTxJson(addr, nft.NFTokenID);
  }, logger);
}

export async function registerMnemonicNftNonCustodial(address, walletType, logger = console.log, options = {}) {
  await getXrplClient(logger);
  const txJson = buildMintTxJson(address);

  logger(`[red] Preparing registration for: ${address} using ${walletType}...`);
  logger("[red] Sending transaction to your wallet to sign...");

  if (walletType === 'gem') {
    const response = await window.GemWallet.signAndSubmitTransaction({ transaction: txJson });
    if (response?.result?.hash) {
      logger(`[red] Mosaic key registered with Gem Wallet! Tx Hash: ${response.result.hash}`);
      return { success: true, hash: response.result.hash };
    }
    throw new Error("Transaction cancelled or failed in Gem Wallet.");
  }

  if (walletType === 'crossmark') {
    const response = await window.crossmark.signAndSubmitAndWait(txJson);
    const hash = response.result?.hash || response.hash;
    if (hash) {
      logger(`[red] Mosaic key registered with Crossmark! Tx Hash: ${hash}`);
      return { success: true, hash: hash };
    }
    throw new Error("Transaction cancelled or failed in Crossmark.");
  }

  if (walletType === 'xaman') {
    logger("[red] Creating signing request in Xaman (Xumm)...");
    const result = await signWithXaman(txJson, logger, options);
    logger(`[red] Mosaic key registered with Xaman! Tx Hash: ${result.hash}`);
    return result;
  }

  throw new Error("Unsupported wallet.");
}

export async function burnMnemonicNftNonCustodial(address, walletType, logger = console.log, options = {}) {
  await getXrplClient(logger);
  const nft = await resolveMosaicNftForBurn(address, logger, options.nftTokenId || null);
  if (!nft) {
    throw new Error("No mosaic keychain NFT found on this account.");
  }

  const txJson = buildBurnTxJson(address, nft.NFTokenID);
  logger(`[red] Preparing burn for mosaic NFT on ${address}...`);
  logger("[red] Sending NFTokenBurn to your wallet to sign...");

  if (walletType === 'gem') {
    const response = await window.GemWallet.signAndSubmitTransaction({ transaction: txJson });
    if (response?.result?.hash) {
      logger(`[red] Mosaic key burned with Gem Wallet! Tx Hash: ${response.result.hash}`);
      return { success: true, hash: response.result.hash };
    }
    throw new Error("Transaction cancelled or failed in Gem Wallet.");
  }

  if (walletType === 'crossmark') {
    const response = await window.crossmark.signAndSubmitAndWait(txJson);
    const hash = response.result?.hash || response.hash;
    if (hash) {
      logger(`[red] Mosaic key burned with Crossmark! Tx Hash: ${hash}`);
      return { success: true, hash: hash };
    }
    throw new Error("Transaction cancelled or failed in Crossmark.");
  }

  if (walletType === 'xaman') {
    logger("[red] Creating burn signing request in Xaman (Xumm)...");
    const result = await signWithXaman(txJson, logger, options);
    logger(`[red] Mosaic key burned with Xaman! Tx Hash: ${result.hash}`);
    return result;
  }

  throw new Error("Unsupported wallet.");
}

export async function burnMnemonicNft(seed, logger = console.log) {
  if (isProductionDeployment()) {
    throw new Error("Seed-based signing is disabled in production. Connect Gem Wallet, Crossmark, or Xaman.");
  }

  const client = await getXrplClient(logger);
  const wallet = window.xrpl.Wallet.fromSeed(seed);
  const nft = await findMosaicNft(wallet.address, logger);
  if (!nft) {
    throw new Error("No mosaic keychain NFT found on this account.");
  }

  const txJson = buildBurnTxJson(wallet.address, nft.NFTokenID);
  logger(`[red] Burning mosaic NFT for: ${wallet.address}`);
  const response = await client.submitAndWait(txJson, { wallet });

  if (response.result.meta.TransactionResult === "tesSUCCESS") {
    logger(`[red] Mosaic key burned! Reserve reclaimed. Tx Hash: ${response.result.hash}`);
    return { success: true, hash: response.result.hash };
  }
  throw new Error(`Ledger error: ${response.result.meta.TransactionResult}`);
}

export async function checkAddressRegistration(address, logger = console.log) {
  try {
    if (!window.xrpl) {
      return false;
    }
    const isValid = (typeof window.xrpl.isValidAddress === 'function')
      ? window.xrpl.isValidAddress(address)
      : /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(address);

    if (!isValid) {
      return false;
    }

    const client = await getXrplClient(() => {});

    const response = await client.request({
      command: "account_nfts",
      account: address,
      ledger_index: "validated"
    });

    const nfts = response.result.account_nfts || [];

    return nfts.some(nft => {
      return nft.NFTokenTaxon === NFT_TAXON_MOSAICO && nft.Issuer === address;
    });
  } catch (error) {
    logger(`[error-silent] XRPL verification error for ${address}: ${error.message}`);
    return false;
  }
}
