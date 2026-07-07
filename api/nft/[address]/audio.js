import { sha256 } from '../../../src/core/crypto.js';
import { synthesizeAcousticWav } from '../../../src/core/acoustic-export.js';
import { normalizePackageAddress } from '../../../src/core/nft-package.js';

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
    const hash = await sha256(address);
    const wav = synthesizeAcousticWav(hash, { gridSize: 3, chaoticMode: false });
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'audio/wav');
    return res.status(200).send(wav);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid NFT audio request.' });
  }
}
