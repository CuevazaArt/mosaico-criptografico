import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeMosaicNftUri } from '../src/core/nft-package.js';

const SAMPLE = 'rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE';
const APP_URL = 'https://mosaico-criptografico.vercel.app';

test('First-use burn picker - decodes package URI to public address', () => {
  const uri = `${APP_URL}/api/nft/${SAMPLE}`;
  const decoded = decodeMosaicNftUri(uri);
  assert.equal(decoded.address, SAMPLE);
  assert.equal(decoded.format, 'package');
});

test('First-use burn picker - decodes legacy mosaic URI', () => {
  const uri = `mosaico://identity/${SAMPLE}`;
  const decoded = decodeMosaicNftUri(uri);
  assert.equal(decoded.address, SAMPLE);
  assert.equal(decoded.format, 'legacy');
});
