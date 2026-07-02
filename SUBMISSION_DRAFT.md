# Submission Draft: Make Waves on XRPL

This document contains the texts and structure ready to copy and paste into the Devpost submission form or the **Make Waves on XRPL** challenge platform.

---

## 🏷️ Basic Project Information

* **Project Name:** Cryptographic Mosaic (Sensory 2FA)
* **Tagline / Short Pitch (140 characters):** Deterministic visual and acoustic identicons on XRPL to eliminate Vanity Address phishing and Clipboard Hijacking at $0 infrastructure cost.
* **Category:** Web3 Usability & Security / NFTs (XLS-20)
* **Repository Link:** `https://github.com/CuevazaArt/mosaico-criptografico`

---

## 📖 Project Description (Devpost Story)

### 1. The Problem
Public addresses in the crypto ecosystem (such as `rP1p...g2y` on XRPL) are inhuman. Their length and complexity cause the average user to only verify the first and last 4 characters when confirming a transaction.

This opens a critical vulnerability:
1. **Vanity Address Phishing:** Attackers generate automated malicious addresses that mimic the ends of the victim's real address or the contract.
2. **Clipboard Hijacking:** Malicious software intercepts the clipboard and swaps the copied address for the attacker's. The end-user signs the transaction in their wallet without noticing the intermediate swap.

### 2. The Solution
**Cryptographic Mosaic** adds a deterministic and immutable sensory layer (visual and acoustic) that acts as a "Human 2FA":
* **Deterministic Visual Identity (3x3 Mosaic):** The address's SHA-256 hash is mathematically decomposed to generate a unique SVG grid of geometric cells with discrete color palettes (quantized into 12 families). If a single character in the middle of the address changes, the mosaic changes shape and color drastically.
* **Acoustic Signature (Acoustic Key):** Generates a pentatonic sequence of 4 notes (160ms each) based on the key, allowing hearing to collaborate in validation before signing.
* **XLS-20 Immutable Registry (Soulbound NFT):** Users can register their visual identity on-chain by minting a non-transferable Soulbound NFT with taxon `1001`, where the issuer matches the owner, achieving secure decentralized validation ("Self-Issued Proof").

### 3. How We Built It
The project was built following strict principles of minimalism, decentralization, and zero cost:
* **Pure JS (Vanilla JS) and Web Crypto API:** All cryptographic processing, Fisher-Yates shuffling, and audio synthesis occur locally in the user's browser. Zero heavy dependencies.
* **Full Non-Custodial Integration:** Connection and secure signing support with **Gem Wallet**, **Crossmark**, and **Xaman (Xumm)**, ensuring that the user's private keys are never exposed to the frontend.
* **Serverless Architecture:** Statically hosted on Vercel with strict CSP header rules. Requires $0 in maintenance and eliminates the need for a perpetual server administrator.

### 4. Challenges We Ran Into
* **Hardware Color Mismatch:** The difference in colors shown on screens with warm or night profiles made fine visual comparison difficult. We resolved this by implementing a quantized HSL chromatic mapping (spaced 30 degrees apart) to force radically different and recognizable colors.
* **NFT Impersonation Prevention:** We prevent third parties from impersonating a user's visual identity by minting an NFT with their mosaic. The validation client implements a cross-security check that invalidates any registry whose NFT is not owned by its own issuer (`Issuer == Owner`).

### 5. Accomplishments That We're Proud Of
* Creating a **lightweight browser extension** that injects visual mosaics in real-time next to XRPL addresses on external sites (like block explorers or dApps).
* Developing an **integrated usability simulator** to test the effectiveness of the human eye in recognizing fake addresses (phishing) under cognitive fatigue, recording streaks and local history.

### 6. What We Learned
* Web3 security must not be limited to smart contract code; the user interface and the cognitive psychology of the human interacting with the Ledger are equally critical.

### 7. What's Next?
* **XLS Standard Proposal:** Push the `XLS-XX` draft so that visual mosaics become a universal standard across all XRPL wallets.
* **Launch the `@mosaico/core` package on NPM** to make it easy for any dApp to inject identicons with a single line of code.
