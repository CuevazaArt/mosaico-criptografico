/**
 * Módulo Criptográfico Autónomo
 * Proporciona utilidades de hashing determinista usando la Web Crypto API nativa.
 */

/**
 * Calcula el hash SHA-256 de una cadena de texto.
 * @param {string} text - La cadena a hashear.
 * @returns {Promise<Uint8Array>} Un array de 32 bytes representando el hash.
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Convierte un Uint8Array de bytes a su representación en cadena Hexadecimal.
 * @param {Uint8Array} bytes - El array de bytes.
 * @returns {string} La cadena hexadecimal.
 */
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte una cadena Hexadecimal a un Uint8Array de bytes.
 * @param {string} hex - La cadena hexadecimal (opcionalmente con prefijo 0x).
 * @returns {Uint8Array} El array de bytes.
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
