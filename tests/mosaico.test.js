import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// Asegurar compatibilidad de la Web Crypto API en entornos de Node.js donde globalThis.crypto no esté expuesto
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  globalThis.crypto = crypto;
}

import { sha256, bytesToHex, hexToBytes } from '../src/core/crypto.js';
import { generateSvg } from '../src/core/generator.js';

test('Módulo Criptográfico - bytesToHex y hexToBytes', () => {
  const bytes = new Uint8Array([0, 15, 255, 128]);
  const hex = bytesToHex(bytes);
  assert.strictEqual(hex, '000fff80');

  const parsedBytes = hexToBytes(hex);
  assert.deepStrictEqual(parsedBytes, bytes);
});

test('Módulo Criptográfico - hexToBytes soporta prefijo 0x y case-insensitivity', () => {
  const bytes1 = hexToBytes('0xABcdEF');
  const bytes2 = hexToBytes('abcdef');
  assert.deepStrictEqual(bytes1, bytes2);
  assert.deepStrictEqual(bytes1, new Uint8Array([171, 205, 239]));
});

test('Módulo Criptográfico - sha256 calcula hash de 32 bytes de forma determinista', async () => {
  const text = 'rP1p...g2y';
  const hash1 = await sha256(text);
  const hash2 = await sha256(text);

  assert.strictEqual(hash1.length, 32);
  assert.deepStrictEqual(hash1, hash2);
  
  const hexHash = bytesToHex(hash1);
  // Hash SHA-256 de 'rP1p...g2y'
  assert.strictEqual(typeof hexHash, 'string');
  assert.strictEqual(hexHash.length, 64);
});

test('Motor de Renderizado SVG - Generación de mosaico deterministicamente', async () => {
  const address = 'rP1p3p23jW2s12as3k';
  const hash = await sha256(address);
  
  // Generar SVG con opciones por defecto (gridSize 3)
  const svgDefault = generateSvg(hash, address);
  assert.ok(svgDefault.startsWith('<svg'));
  assert.ok(svgDefault.endsWith('</svg>'));
  assert.ok(svgDefault.includes('viewBox="0 0 300 300"'));
  assert.ok(svgDefault.includes(address.substring(0, 6).toUpperCase()));
  assert.ok(svgDefault.includes(address.substring(address.length - 4).toUpperCase()));

  // Comprobar determinismo: el mismo hash debe producir el mismo SVG
  const svgSame = generateSvg(hash, address);
  assert.strictEqual(svgDefault, svgSame);

  // Generar SVG con gridSize 4
  const svg4x4 = generateSvg(hash, address, { gridSize: 4 });
  assert.ok(svg4x4.includes('scale(0.75)')); // Factor de escala para 4x4 es 75 / 100

  // Generar SVG en modo caótico
  const svgChaotic = generateSvg(hash, address, { chaoticMode: true });
  assert.ok(svgChaotic.includes('<svg'));
});
