/**
 * NFT mosaic image — PNG by default (Xaman / XRPL Labs proxy-friendly).
 * Use ?format=svg for the raw deterministic SVG (includes SVG text overlay).
 */
import { renderNftPackageSvg, normalizePackageAddress } from '../../../src/core/nft-package.js';
import { renderNftPackagePng } from '../../../src/core/nft-image.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const address = normalizePackageAddress(req.query.address);
    const wantsSvg = String(req.query.format || '').toLowerCase() === 'svg';

    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    if (wantsSvg) {
      const svg = await renderNftPackageSvg(address);
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      return res.status(200).send(svg);
    }

    const png = await renderNftPackagePng(address);
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(png);
  } catch (err) {
    console.error('[nft/image]', err);
    return res.status(400).json({ error: err.message || 'Invalid NFT image request.' });
  }
}
