# Cryptographic Mosaic Explanation: User vs. Developer

This document provides two complementary perspectives on the use, validation, and security of the Cryptographic Mosaic: a simple narrative for the end-user and a detailed technical specification for the developer.

---

## PART 1: Simple Guide for the End-User (Non-Technical)

### 💡 The Keychain Analogy
Imagine that crypto addresses (like `0x71c8...3a9`) are extremely long passwords written in a foreign language. Since humans cannot memorize them, **the Cryptographic Mosaic takes that address and turns it into a unique "color key" in the form of a mosaic.**

Each address has its own immutable key. If a single letter or number in the address changes, the key changes its design and color completely.

```
[ Your Crypto Address ] ──────────► [ Your Unique Color Mosaic ]
(Example: 0x71c8...3a9)              (Shapes and colors in place)

[ Fake/Cloned Address ] ──────────► [ COMPLETELY Different Mosaic ]
(Example: 0x71c8...3a8)              (Colors change and shapes move)
```

### 🔍 How to use it in your daily routine?

1. **Get to know your pattern:** When you save your wallet address, take a quick glance at the mosaic it generates. Memorize something simple: *"my mosaic has blue tones, curved pipes at the bottom, and a star in the top-right corner"*.
2. **Compare before sending:** When you are about to transfer cryptocurrency and paste the address into your wallet:
   * **Look at the drawing:** Are the colors still the same? Is the star still in the same corner?
   * **If the drawings are identical:** It is safe to send.
   * **If the drawings are different:** Stop the transaction! There is an error or a theft attempt.

### ⚠️ How does it protect you from common scams?

* **Clipboard Virus (Clipboard Hijacker):**
  * *The Scam:* You copy a legitimate address, but a virus on your computer swaps it for the attacker's address when you paste it.
  * *The Detection:* When you paste the modified address, the mosaic **will completely change its colors and order**. You will notice the difference instantly without having to read the address character by character.
* **Cloned Address Trick (Vanity Phishing):**
  * *The Scam:* A scammer creates a junk token and generates an address that starts and ends exactly like the real project's address (e.g., real USDT vs. fake USDT).
  * *The Detection:* Even if the text looks identical at a glance, the algorithm shuffles the mosaic shapes based on the full hash. On the fake address, **the geometric patterns will jump to other cells** and the central anchor will change shape (e.g., changing from a 5-pointed star to an 8-pointed star).

---

## PART 2: Technical Specification for the Developer

### ⚙️ Mathematical and Cryptographic Pipeline

The visual generation flow follows a One-Way Deterministic Pipeline:

```
┌──────────────┐    SHA-256     ┌─────────────────┐    Fisher-Yates    ┌─────────────────────┐
│ String Input ├───────────────►│ 32-Byte Buffer  ├───────────────────►│ Shuffled Layout     │
└──────────────┘                └────────┬────────┘                    └────────┬────────────┘
                                         │                                      │
                                         ▼                                      ▼
                                [ Global Colors HSL ]                  [ Procedural Cells ]
```

#### Step 1: Cryptographic Hashing
The input string (e.g., hexadecimal address or public key) is UTF-8 encoded and processed using the browser's native **SHA-256** algorithm (`crypto.subtle.digest`), ensuring quantum resistance and uniform entropy distribution in an immutable 32-byte buffer ($B_0 \dots B_{31}$).

#### Step 2: Global Chromatic Configuration Extraction
To prevent excessive visual noise, a cohesive global HSL scheme is extracted from the final bytes of the buffer:
$$\text{Base Hue} = (B_{30} \times 256 + B_{31}) \pmod{360}$$
$$\text{Base Saturation} = 65 + (B_{29} \pmod{25}) \quad [65\% \text{ to } 90\%]$$
$$\text{Base Lightness} = 40 + (B_{28} \pmod{20}) \quad [40\% \text{ to } 60\%]$$

#### Step 3: Fisher-Yates Grid Shuffling
An array of logical indices representing the grid ($G \times G$) is initialized. For a $3 \times 3$ grid, `layout = [0, 1, 2, 3, 4, 5, 6, 7, 8]`. A deterministic permutation is applied:
$$\text{For } k \text{ from } (\text{numCells} - 1) \text{ down to } 1:$$
$$j = B_{k \pmod{32}} \pmod{k + 1}$$
$$\text{Swap } layout[k] \longleftrightarrow layout[j]$$

#### Step 4: Cell Mapping and Canvas Isolation
The main SVG viewport is fixed at $300 \times 300$ pixels. Each physical cell $i$ of a grid of size $G$ is situated at dynamically calculated coordinates $(x, y)$:
$$\text{cellSize} = \frac{300}{G}$$
$$\text{xOffset} = (i \pmod{G}) \times \text{cellSize}$$
$$\text{yOffset} = \lfloor i / G \rfloor \times \text{cellSize}$$
$$\text{scaleFactor} = \frac{\text{cellSize}}{100}$$

Each logical cell is drawn inside a scaled SVG `<g>` container:
```html
<g transform="translate(xOffset, yOffset) scale(scaleFactor)" clip-path="url(#cell-clip)">
  <!-- Vector elements based on the procedural sub-generator -->
</g>
```
The `scaleFactor` allows all procedural generators to keep drawing within a normalized $100 \times 100$ virtual space, guaranteeing native scalability for 3x3, 4x4, and 5x5 grids without having to recalculate internal geometries.

#### Step 5: Sub-generator Entropy Distribution
Each logical cell executes a geometric generator determined by `logicalIndex % 9`. The control bytes for the color and internal shapes of each cell are read using a deterministic circular offset to avoid collisions:
$$\text{Cell byte offset } c = (logicalIndex \times 3) \pmod{26}$$
This ensures that even if a geometric pattern repeats in larger 4x4 or 5x5 grids, **each cell consumes different bytes of the hash**, producing entirely independent colors and internal shapes.
