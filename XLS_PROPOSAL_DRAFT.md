# XLS-XX: Cryptographic Mosaic (Visual Identity Standard)

**Author:** CuevazaArt  
**Status:** Draft  
**Category:** Standards Track / XLS (Interface Standard)  
**Date:** 2026-07-02  

---

## 1. Abstract

This proposal defines a standard for generating **deterministic visual and acoustic hashes (Identicons and Acoustic Keys)** for XRP Ledger addresses. The standard enables wallets, dApps, and block explorers to uniformly render a vector SVG grid of $3 \times 3$, $4 \times 4$, or $5 \times 5$ sectors and play a 4-note arpeggio melody. This helps users visually and acoustically validate the authenticity of destination addresses, preventing vanity phishing and clipboard hijacking attacks.

---

## 2. Motivation

XRPL public addresses are complex alphanumeric strings of 25 to 35 characters (e.g., `rP1p...g2y`). Humans are unable to remember or compare these strings exhaustively under fatigue, typically checking only the start and end characters. Attackers exploit this by generating malicious addresses with matching extreme characters (*Vanity Addresses*).

By mapping the address's SHA-256 hash to deterministic, discrete geometric shapes and colors, we convert validation into a simple sensory recognition task. If an address varies by a single intermediate character, the resulting mosaic and melody will be drastically different, alerting the user instantly.

---

## 3. Technical Specification

For the mosaic to remain identical across any wallet or client (JavaScript, Swift, Kotlin, Rust), the following computation requirements must be met:

### A. Base Hash Computation
1. The base58-encoded XRPL address is processed using the **SHA-256** hashing algorithm.
2. The result must be a **32-byte** buffer ($Bytes[0..31]$).

### B. Spatial Distribution (Fisher-Yates Shuffle)
For a grid of size $N \times N$ (where $N \in \{3, 4, 5\}$), the total number of cells is $C = N^2$.
1. Initialize a sequential cell array: $Layout = [0, 1, 2, ..., C-1]$.
2. Perform a deterministic Fisher-Yates shuffle indexed by the hash:
   ```javascript
   for (let k = C - 1; k > 0; k--) {
     const j = Hash[k % 32] % (k + 1);
     // Swap Layout[k] and Layout[j]
     const temp = Layout[k];
     Layout[k] = Layout[j];
     Layout[j] = temp;
   }
   ```
3. Each physical cell $i \in [0..C-1]$ of the grid will render the logical cell corresponding to $Layout[i]$.

### C. Discrete Chromatic Mapping (12 Color Families)
To prevent screen differences or blue-light filters (Night Shift) from altering color perception:
1. Extract configuration bytes:
   * $globalHue = (Hash[30] \times 256 + Hash[31]) \pmod{360}$
2. For each logical cell $LogicalIndex$, calculate a dynamic 3-byte data offset:
   * $cDataOffset = (LogicalIndex \times 3) \pmod{26}$
   * $cData = [Hash[cDataOffset], Hash[cDataOffset + 1], Hash[cDataOffset + 2]]$
3. Calculate hue ($h$), saturation ($s$), and lightness ($l$):
   * Harmonious Mode: $h = (globalHue + (cData[0] \pmod{60}) - 30 + 360) \pmod{360}$
4. **Quantize the hue ($h$) in multiples of 30 degrees** to force 12 distinguishable chromatic families:
   * $h = (\text{round}(h / 30) \times 30) \pmod{360}$
5. Define the cell's palette:
   * $BaseColor = HSL(h, s, l)$
   * $DarkColor = HSL(h, s, \max(10, l - 20))$
   * $LightColor = HSL(h, s, \min(95, l + 20))$

### D. Cell Geometries (9 Base Types)
Each logical cell in the grid executes a sub-renderer based on $CellType = LogicalIndex \pmod 9$:
* **Type 0:** Low-Poly Crystal (Triangles connected to corners).
* **Type 1:** Concentric rings and rays.
* **Type 2:** Rotated checkerboard.
* **Type 3:** Truchet Arcs (Curved labyrinth pipes).
* **Type 4 (Anchor):** Central glyph (Countable star or regular polygon).
* **Type 5:** Overlapping sine waves.
* **Type 6:** Spiral vortex.
* **Type 7:** Symmetric 5x5 Pixel-Art avatar.
* **Type 8:** Recursive geometric fractals.

---

## 4. Mnemonic Acoustic Signature (Acoustic Specification)

Audio must be generated deterministically using sample-free sine and triangle oscillators:
1. **Fundamental Frequency (F0):** $F0 = 160 + (Hash[31] \pmod{120}) \text{ Hz}$.
2. **Pentatonic Scale:** Generate the scale using intervals in semitones: $[0, 2, 4, 7, 9, 12, 14, 16, 19, 21]$.
3. **Sequencing:** Play a 4-note melody (160ms per note) using the logical cells of the first 4 positions of the $Layout$ to determine the notes.

---

## 5. Security Considerations

* **Autonomous Authenticity (Self-Issued Verification):** To prevent third parties from issuing an NFT representative of another account, the client validator must verify that for any NFT with taxon `1001`, the issuer (`Issuer`) matches the owner (`Owner`) exactly.
