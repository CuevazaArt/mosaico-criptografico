/**
 * On-chain NFT keychain package: metadata URI + visual mosaic + acoustic signature.
 */
import { sha256 } from './crypto.js';
import { generateSvg } from './generator.js';
import { getAcousticNoteSequence } from './acoustic-export.js';
import { getAppConfig } from '../app-config.js';

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const PACKAGE_VERSION = 'mosaico-keychain-v1';
const MAX_URI_BYTES = 256;

const DEFAULT_PACKAGE_OPTIONS = {
  gridSize: 3,
  chaoticMode: false,
  showOverlay: true,
  showAnchors: true
};

export function isPackageAddress(address) {
  return typeof address === 'string' && XRPL_ADDRESS_RE.test(address.trim());
}

export function normalizePackageAddress(address) {
  const trimmed = String(address || '').trim();
  if (!isPackageAddress(trimmed)) {
    throw new Error('Invalid XRPL address for NFT package.');
  }
  return trimmed;
}

export function resolveAppUrl(overrideUrl) {
  if (overrideUrl) return String(overrideUrl).replace(/\/$/, '');
  if (typeof process !== 'undefined' && process.env?.APP_URL) {
    return String(process.env.APP_URL).replace(/\/$/, '');
  }
  return String(getAppConfig().appUrl || 'https://mosaico-criptografico.vercel.app').replace(/\/$/, '');
}

export function buildNftPackageUrls(address, appUrl) {
  const normalized = normalizePackageAddress(address);
  const base = resolveAppUrl(appUrl);
  const root = `${base}/api/nft/${normalized}`;
  return {
    metadata: root,
    image: `${root}/image`,
    audio: `${root}/audio`
  };
}

export function buildNftMintUri(address, appUrl) {
  const { metadata } = buildNftPackageUrls(address, appUrl);
  if (metadata.length > MAX_URI_BYTES) {
    throw new Error(`NFT metadata URI exceeds ${MAX_URI_BYTES} bytes.`);
  }
  return metadata;
}

export function buildNftPackageSummary(address, appUrl) {
  const urls = buildNftPackageUrls(address, appUrl);
  return {
    mintUri: urls.metadata,
    imageUrl: urls.image,
    audioUrl: urls.audio,
    includes: [
      'Visual mosaic (deterministic SVG)',
      'Acoustic signature (4-note WAV)',
      'Metadata manifest (JSON)'
    ]
  };
}

export async function buildNftPackageMetadata(address, appUrl) {
  const normalized = normalizePackageAddress(address);
  const urls = buildNftPackageUrls(normalized, appUrl);
  const hash = await sha256(normalized);
  const notes = getAcousticNoteSequence(hash, DEFAULT_PACKAGE_OPTIONS);

  return {
    name: `Mosaic Keychain — ${normalized}`,
    description: `Soulbound visual and acoustic identity for XRPL public address ${normalized}. Safe to share: this is your public receiving address, not a secret key.`,
    external_url: resolveAppUrl(appUrl),
    address: normalized,
    image: urls.image,
    animation_url: urls.audio,
    properties: {
      package: PACKAGE_VERSION,
      standard: 'XLS-20',
      taxon: 1001,
      soulbound: true,
      address: normalized,
      visual: {
        type: 'image/svg+xml',
        algorithm: 'sha256-mosaic-grid',
        grid_size: DEFAULT_PACKAGE_OPTIONS.gridSize,
        url: urls.image
      },
      acoustic: {
        type: 'audio/wav',
        algorithm: 'sha256-arpeggio-4',
        notes: notes.length,
        url: urls.audio
      }
    },
    attributes: [
      { trait_type: 'XRPL Address', value: normalized },
      { trait_type: 'Package', value: PACKAGE_VERSION },
      { trait_type: 'Grid', value: `${DEFAULT_PACKAGE_OPTIONS.gridSize}x${DEFAULT_PACKAGE_OPTIONS.gridSize}` },
      { trait_type: 'Acoustic Notes', value: String(notes.length) },
      { trait_type: 'Soulbound', value: 'Yes' }
    ]
  };
}

export async function renderNftPackageSvg(address) {
  const normalized = normalizePackageAddress(address);
  const hash = await sha256(normalized);
  return generateSvg(hash, normalized, DEFAULT_PACKAGE_OPTIONS);
}

export function decodeMosaicNftUri(uriHex) {
  if (!uriHex) return { raw: '', address: null, format: 'unknown' };

  let raw = String(uriHex);
  try {
    if (typeof window !== 'undefined' && window.xrpl?.convertHexToString) {
      raw = window.xrpl.convertHexToString(uriHex);
    } else if (/^[0-9A-Fa-f]+$/.test(raw) && raw.length % 2 === 0) {
      raw = Buffer.from(raw, 'hex').toString('utf8');
    }
  } catch {
    /* keep hex fallback */
  }

  const legacy = raw.match(/^mosaico:\/\/identity\/(r[1-9A-HJ-NP-Za-km-z]{24,34})$/);
  if (legacy) {
    return { raw, address: legacy[1], format: 'legacy' };
  }

  const modern = raw.match(/\/api\/nft\/(r[1-9A-HJ-NP-Za-km-z]{24,34})(?:\/|$)/);
  if (modern) {
    return { raw, address: modern[1], format: 'package' };
  }

  return { raw, address: null, format: 'unknown' };
}

export function isMosaicKeychainUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  const decoded = uri.trim();
  if (decoded.startsWith('mosaico://identity/')) return true;
  return /\/api\/nft\/r[1-9A-HJ-NP-Za-km-z]{24,34}\/?$/i.test(decoded);
}
