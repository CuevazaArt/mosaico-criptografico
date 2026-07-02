/**
 * Autonomous Cryptographic Module.
 * Provides deterministic hashing utilities using the native Web Crypto API.
 */

/**
 * Computes the SHA-256 hash of a string.
 * @param {string} text - The string to hash.
 * @returns {Promise<Uint8Array>} A 32-byte array representing the hash.
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Converts a Uint8Array of bytes into its Hexadecimal string representation.
 * @param {Uint8Array} bytes - The byte array.
 * @returns {string} The hexadecimal string.
 */
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a Hexadecimal string into a Uint8Array of bytes.
 * @param {string} hex - The hexadecimal string (optionally starting with 0x).
 * @returns {Uint8Array} The byte array.
 */
export function hexToBytes(hex) {
  let cleanHex = hex.toLowerCase();
  if (cleanHex.startsWith('0x')) {
    cleanHex = cleanHex.slice(2);
  }
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex;
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}
