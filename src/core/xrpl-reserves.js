/**
 * Live XRPL reserve and fee estimates from the connected ledger.
 * Adapts automatically when network reserve_inc / base_fee change.
 */

import { getXrplClient, getXrplNetwork } from './xrpl.js';

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

export async function fetchLedgerReserveCosts(logger = () => {}) {
  const client = await getXrplClient(logger);
  const response = await client.request({ command: 'server_info' });
  const validated = response.result?.info?.validated_ledger;
  if (!validated?.reserve_base || !validated?.reserve_inc) {
    throw new Error('Could not read reserve parameters from the ledger.');
  }
  return {
    reserveBaseDrops: String(validated.reserve_base),
    reserveIncDrops: String(validated.reserve_inc)
  };
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
  const { reserveIncDrops } = await fetchLedgerReserveCosts(logger);
  const feeDrops = await estimateTransactionFeeDrops(client, buildMintTx(address));

  return {
    action: 'mint',
    network: getXrplNetwork(),
    nftOwnerReserveXrp: dropsToXrpDisplay(reserveIncDrops),
    networkFeeXrp: dropsToXrpDisplay(feeDrops),
    recoverableOnBurnXrp: dropsToXrpDisplay(reserveIncDrops),
    nftOwnerReserveDrops: reserveIncDrops,
    networkFeeDrops: feeDrops,
    fetchedAt: Date.now()
  };
}

export async function getBurnRecoveryEstimate(address, buildBurnTx, logger = () => {}) {
  const client = await getXrplClient(logger);
  const txTemplate = await buildBurnTx(address, client);
  const { reserveIncDrops } = await fetchLedgerReserveCosts(logger);
  const feeDrops = await estimateTransactionFeeDrops(client, txTemplate);
  const netDrops = netDropsPositive(reserveIncDrops, feeDrops);

  return {
    action: 'burn',
    network: getXrplNetwork(),
    tokenId: txTemplate.NFTokenID,
    reclaimedReserveXrp: dropsToXrpDisplay(reserveIncDrops),
    networkFeeXrp: dropsToXrpDisplay(feeDrops),
    netRecoveryXrp: dropsToXrpDisplay(netDrops),
    reclaimedReserveDrops: reserveIncDrops,
    networkFeeDrops: feeDrops,
    fetchedAt: Date.now()
  };
}
