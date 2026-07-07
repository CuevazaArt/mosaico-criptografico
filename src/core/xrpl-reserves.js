/**
 * Live XRPL reserve and fee estimates from the connected ledger.
 * Adapts automatically when network reserve_inc / base_fee change.
 */

import { getXrplClient, getXrplNetwork } from './xrpl.js';

const NETWORK_RESERVE_FALLBACKS = {
  mainnet: { reserveBaseDrops: '1000000', reserveIncDrops: '200000' },
  testnet: { reserveBaseDrops: '1000000', reserveIncDrops: '200000' }
};

function dropsToXrpDisplay(drops) {
  if (!window.xrpl?.dropsToXrp) {
    return (Number(drops) / 1_000_000).toFixed(6);
  }
  const xrp = Number(window.xrpl.dropsToXrp(String(drops)));
  if (xrp >= 1) return xrp.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return xrp.toFixed(6);
}

function netDropsPositive(a, b) {
  const result = BigInt(a) - BigInt(b);
  return result > 0n ? result.toString() : '0';
}

function xrpAmountToDrops(value) {
  if (window.xrpl?.xrpToDrops) {
    return String(window.xrpl.xrpToDrops(value));
  }
  return String(Math.round(Number(value) * 1_000_000));
}

function parseReserveFields(ledger) {
  if (!ledger) return null;

  if (ledger.reserve_base != null && ledger.reserve_inc != null) {
    return {
      reserveBaseDrops: String(ledger.reserve_base),
      reserveIncDrops: String(ledger.reserve_inc)
    };
  }

  if (ledger.reserve_base_xrp != null && ledger.reserve_inc_xrp != null) {
    return {
      reserveBaseDrops: xrpAmountToDrops(ledger.reserve_base_xrp),
      reserveIncDrops: xrpAmountToDrops(ledger.reserve_inc_xrp)
    };
  }

  return null;
}

function extractReservesFromServerInfo(response) {
  const info = response?.result?.info ?? response?.info;
  if (!info) return null;

  return parseReserveFields(info.validated_ledger)
    ?? parseReserveFields(info.closed_ledger);
}

function extractReservesFromServerState(response) {
  const state = response?.result?.state ?? response?.state;
  return parseReserveFields(state?.validated_ledger)
    ?? parseReserveFields(state?.closed_ledger);
}

export async function fetchLedgerReserveCosts(logger = () => {}) {
  const client = await getXrplClient(logger);

  try {
    const serverInfo = await client.request({ command: 'server_info' });
    const parsed = extractReservesFromServerInfo(serverInfo);
    if (parsed) {
      return { ...parsed, source: 'server_info' };
    }
  } catch (err) {
    logger(`[warn] server_info reserve lookup failed: ${err.message}`);
  }

  try {
    const serverState = await client.request({ command: 'server_state' });
    const parsed = extractReservesFromServerState(serverState);
    if (parsed) {
      return { ...parsed, source: 'server_state' };
    }
  } catch (err) {
    logger(`[warn] server_state reserve lookup failed: ${err.message}`);
  }

  const network = getXrplNetwork();
  const fallback = NETWORK_RESERVE_FALLBACKS[network] || NETWORK_RESERVE_FALLBACKS.testnet;
  logger(`[warn] Using ${network} reserve fallback values.`);
  return { ...fallback, source: 'fallback' };
}

export async function estimateTransactionFeeDrops(client, txTemplate) {
  try {
    const prepared = await client.autofill({ ...txTemplate });
    return String(prepared.Fee || '12');
  } catch {
    return '12';
  }
}

export async function getMintCostEstimate(address, buildMintTx, logger = () => {}) {
  const client = await getXrplClient(logger);
  const reserves = await fetchLedgerReserveCosts(logger);
  const feeDrops = await estimateTransactionFeeDrops(client, buildMintTx(address));

  return {
    action: 'mint',
    network: getXrplNetwork(),
    nftOwnerReserveXrp: dropsToXrpDisplay(reserves.reserveIncDrops),
    networkFeeXrp: dropsToXrpDisplay(feeDrops),
    recoverableOnBurnXrp: dropsToXrpDisplay(reserves.reserveIncDrops),
    nftOwnerReserveDrops: reserves.reserveIncDrops,
    networkFeeDrops: feeDrops,
    reserveSource: reserves.source || 'live',
    fetchedAt: Date.now()
  };
}

export async function getBurnRecoveryEstimate(address, buildBurnTx, logger = () => {}) {
  const client = await getXrplClient(logger);
  const txTemplate = await buildBurnTx(address, client);
  const reserves = await fetchLedgerReserveCosts(logger);
  const feeDrops = await estimateTransactionFeeDrops(client, txTemplate);
  const netDrops = netDropsPositive(reserves.reserveIncDrops, feeDrops);

  return {
    action: 'burn',
    network: getXrplNetwork(),
    tokenId: txTemplate.NFTokenID,
    reclaimedReserveXrp: dropsToXrpDisplay(reserves.reserveIncDrops),
    networkFeeXrp: dropsToXrpDisplay(feeDrops),
    netRecoveryXrp: dropsToXrpDisplay(netDrops),
    reclaimedReserveDrops: reserves.reserveIncDrops,
    networkFeeDrops: feeDrops,
    reserveSource: reserves.source || 'live',
    fetchedAt: Date.now()
  };
}
