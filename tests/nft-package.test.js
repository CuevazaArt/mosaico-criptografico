import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNftMintUri,
  buildNftPackageUrls,
  isMosaicKeychainUri,
  isPackageAddress
} from '../src/core/nft-package.js';
import { synthesizeAcousticWav } from '../src/core/acoustic-export.js';
import { sha256 } from '../src/core/crypto.js';

const SAMPLE = 'rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE';
const APP_URL = 'https://mosaico-criptografico.vercel.app';

test('NFT package - validates XRPL addresses', () => {
  assert.equal(isPackageAddress(SAMPLE), true);
  assert.equal(isPackageAddress('invalid'), false);
});

test('NFT package - builds metadata URI under XRPL 256-byte limit', () => {
  const uri = buildNftMintUri(SAMPLE, APP_URL);
  assert.equal(uri, `${APP_URL}/api/nft/${SAMPLE}`);
  assert.ok(uri.length <= 256);
  assert.equal(isMosaicKeychainUri(uri), true);
  assert.equal(isMosaicKeychainUri(`mosaico://identity/${SAMPLE}`), true);
});

test('NFT package - exposes image and audio endpoints', () => {
  const urls = buildNftPackageUrls(SAMPLE, APP_URL);
  assert.equal(urls.metadata, `${APP_URL}/api/nft/${SAMPLE}`);
  assert.equal(urls.image, `${APP_URL}/api/nft/${SAMPLE}/image`);
  assert.equal(urls.audio, `${APP_URL}/api/nft/${SAMPLE}/audio`);
});

test('NFT package - synthesizes deterministic WAV audio', async () => {
  const hash = await sha256(SAMPLE);
  const wavA = synthesizeAcousticWav(hash);
  const wavB = synthesizeAcousticWav(hash);
  assert.ok(Buffer.isBuffer(wavA));
  assert.equal(wavA.toString('ascii', 0, 4), 'RIFF');
  assert.deepEqual(wavA, wavB);
});
