/**
 * Server-side NFT PNG renderer with address label (Sharp text — fonts available on Vercel).
 */
import sharp from 'sharp';
import { renderNftPackageSvg, normalizePackageAddress } from './nft-package.js';

function formatAddressLabel(address) {
  const clean = String(address || '').trim();
  if (clean.length <= 10) return clean.toUpperCase();
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`.toUpperCase();
}

/**
 * Rasterize mosaic + bottom address strip for wallet NFT previews.
 */
export async function renderNftPackagePng(address) {
  const normalized = normalizePackageAddress(address);
  const svg = await renderNftPackageSvg(normalized, { showOverlay: false });

  const mosaicPng = await sharp(Buffer.from(svg), { density: 220 })
    .resize(512, 480, {
      fit: 'contain',
      background: { r: 8, g: 10, b: 20, alpha: 1 }
    })
    .png()
    .toBuffer();

  const label = formatAddressLabel(normalized);

  let textBar;
  try {
    textBar = await sharp({
      create: {
        width: 512,
        height: 32,
        channels: 4,
        background: { r: 6, g: 9, b: 22, alpha: 255 }
      }
    })
      .composite([{
        input: {
          text: {
            text: `<span foreground="#ffffff">${label}</span>`,
            font: 'DejaVu Sans Mono',
            width: 512,
            height: 32,
            align: 'centre',
            rgba: true
          }
        },
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
  } catch {
    // Fallback font if mono is unavailable in the runtime.
    textBar = await sharp({
      create: {
        width: 512,
        height: 32,
        channels: 4,
        background: { r: 6, g: 9, b: 22, alpha: 255 }
      }
    })
      .composite([{
        input: {
          text: {
            text: `<span foreground="#ffffff">${label}</span>`,
            font: 'sans',
            width: 512,
            height: 32,
            align: 'centre',
            rgba: true
          }
        },
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
  }

  return sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 8, g: 10, b: 20, alpha: 255 }
    }
  })
    .composite([
      { input: mosaicPng, top: 0, left: 0 },
      { input: textBar, top: 480, left: 0 }
    ])
    .png()
    .toBuffer();
}
