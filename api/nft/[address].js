import { buildNftPackageMetadata, normalizePackageAddress } from '../../src/core/nft-package.js';

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
    const metadata = await buildNftPackageMetadata(address);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(metadata);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid NFT package request.' });
  }
}
