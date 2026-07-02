import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// Ensure Web Crypto API compatibility in Node.js environments where globalThis.crypto is not exposed
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  globalThis.crypto = crypto;
}

import { sha256, bytesToHex, hexToBytes } from '../src/core/crypto.js';
import { generateSvg } from '../src/core/generator.js';

test('Cryptographic Module - bytesToHex and hexToBytes', () => {
  const bytes = new Uint8Array([0, 15, 255, 128]);
  const hex = bytesToHex(bytes);
  assert.strictEqual(hex, '000fff80');

  const parsedBytes = hexToBytes(hex);
  assert.deepStrictEqual(parsedBytes, bytes);
});

test('Cryptographic Module - hexToBytes supports 0x prefix and case-insensitivity', () => {
  const bytes1 = hexToBytes('0xABcdEF');
  const bytes2 = hexToBytes('abcdef');
  assert.deepStrictEqual(bytes1, bytes2);
  assert.deepStrictEqual(bytes1, new Uint8Array([171, 205, 239]));
});

test('Cryptographic Module - sha256 computes a 32-byte hash deterministically', async () => {
  const text = 'rP1p...g2y';
  const hash1 = await sha256(text);
  const hash2 = await sha256(text);

  assert.strictEqual(hash1.length, 32);
  assert.deepStrictEqual(hash1, hash2);
  
  const hexHash = bytesToHex(hash1);
  // SHA-256 hash of 'rP1p...g2y'
  assert.strictEqual(typeof hexHash, 'string');
  assert.strictEqual(hexHash.length, 64);
});

test('SVG Rendering Engine - Generates mosaic deterministically', async () => {
  const address = 'rP1p3p23jW2s12as3k';
  const hash = await sha256(address);
  
  // Generate SVG with default options (gridSize 3)
  const svgDefault = generateSvg(hash, address);
  assert.ok(svgDefault.startsWith('<svg'));
  assert.ok(svgDefault.endsWith('</svg>'));
  assert.ok(svgDefault.includes('viewBox="0 0 300 300"'));
  assert.ok(svgDefault.includes(address.substring(0, 6).toUpperCase()));
  assert.ok(svgDefault.includes(address.substring(address.length - 4).toUpperCase()));

  // Test determinism: the same hash must produce the identical SVG
  const svgSame = generateSvg(hash, address);
  assert.strictEqual(svgDefault, svgSame);

  // Generate SVG with gridSize 4
  const svg4x4 = generateSvg(hash, address, { gridSize: 4 });
  assert.ok(svg4x4.includes('scale(0.75)')); // Scale factor for 4x4 is 75 / 100

  // Generate SVG in chaotic mode
  const svgChaotic = generateSvg(hash, address, { chaoticMode: true });
  assert.ok(svgChaotic.includes('<svg'));
});
