# Technical Proposal: Cryptographic Mosaic on XRPL (Make Waves Challenge)

**Live demo:** https://mosaico-criptografico.vercel.app

This proposal details the technical specification, architecture, and 90-day action plan for deploying the **Cryptographic Mosaic (Identicons & Acoustic Keys)** standard on the **XRPL Mainnet**, designed to compete in the real-world adoption program *Make Waves on XRPL*.

---

## 1. Executive Summary

* **Project Name**: Cryptographic Mosaic (Visual Identity Standard)
* **Goal**: Provide a native, deterministic, second-way sensory verification layer (visual and acoustic) to prevent *phishing* and *clipboard hijacking* attacks on the XRP Ledger.
* **Blockchain Mechanism**: Immutable registration of visual identities as self-declared **Soulbound NFTs (XLS-20 standard)** on the XRPL main network.
* **Network Cost**: Each registration consumes native gas (burned XRP) and freezes a recoverable **2 XRP** owner object reserve.

---

## 2. Problem and Solution Definition

### The Problem (Last-Mile Vulnerability)
XRPL public addresses are complex strings (e.g., `rP1p...g2y`). Humans are unable to memorize or compare them in their entirety, especially under conditions of haste or fatigue. Attackers exploit this by injecting clipboard-hijacking malware or generating similar addresses with the same starting and ending characters (*Vanity Address* attack), tricking users into signing fraudulent transactions.

### The Solution (Deterministic Sensory 2FA)
Convert the address's SHA-256 hash into a vector SVG grid of $3 \times 3$, $4 \times 4$, or $5 \times 5$ sectors with topological anchors and a procedural 4-note arpeggio melody.
* If a single character in the address is changed, the Fisher-Yates shuffling algorithm completely reorganizes the spatial grid and changes the arpeggio's timbre, visually and acoustically alerting the user instantly.

```
┌────────────────────┐      SHA-256      ┌──────────────────┐      Fisher-Yates      ┌──────────────────────┐
│    XRPL Address    ├──────────────────►│ Buffer (32 Bytes)├───────────────────────►│ SVG & Audio Keychain │
└────────────────────┘                   └──────────────────┘                        └──────────────────────┘
```

---

## 3. Implementation Development Requirements

To take this proposal from its current interactive prototype state to a robust production dApp integrated into the XRPL ecosystem, the following is required:

### A. Development Environment and Libraries
1. **Runtime & Dependencies**:
   * Node.js-based environment to package the library (`npm`).
   * Official Javascript SDK for XRPL (`xrpl.js` v2.x or higher).
   * Native browser Web Audio API for dependency-free audio synthesis.
2. **Network Environment**:
   * Access to public Mainnet WebSocket endpoints (`wss://xrplcluster.com` or `wss://s1.ripple.com`).
   * Developer Testnet environment (`wss://s.altnet.rippletest.net:51233`).

### B. Cryptographic and Funding Infrastructure
1. **Account Activation**: Each account on the XRPL requires a minimum deposit of **10 XRP** (base reserve) to be activated in the ledger.
2. **NFT Reserve (XLS-20)**: To mint the Soulbound NFT that registers the identity immutably, the user's wallet must contain at least **2 XRP** in additional owner reserve.
3. **Gas Cost**: Approximately `0.000012 XRP` per `NFTokenMint` transaction to pay validator fees.

---

## 4. Technical Robustness Architecture (Production-Grade Specs)

To ensure that the implementation is resistant to tampering and visual fraud, the following technical specifications are implemented:

### 1. Autonomous Authenticity Validation (Self-Issued Verification)
An attacker could mint an NFT with the name and mosaic of a third party to impersonate them. To prevent this:
* **Ledger Rule**: Verification does not only check if the address owns an NFT with taxon `1001`. The system validates that the issuer (*Issuer*) of the NFT is **exactly the same address** that owns it.
* **Inalienability**: No one but the private key owner can issue a valid NFT for their own address. If an attacker issues an NFT imitating a mosaic, the validator will reject it because the *Issuer* will not match the *Owner* of the token.

### 2. Secure Integration with Wallets (Non-Custodial Flow)
Instead of forcing the user to input their secret key directly into the dApp (which is a critical security risk on Mainnet):
* **Extension Integration**: Use external wallet connectors via browser APIs (`window.xrpl`).
* **Popular Wallets Support**:
  * **Gem Wallet**: Send signing requests via `GemWallet.signTransaction()`.
  * **Crossmark**: Use the Crossmark SDK to sign transactions in an isolated window.
  * **Xaman SDK (Xumm)**: Sign using QR payloads and push notifications on mobile devices, keeping the private key strictly within the secure hardware chip of the user's mobile device.

### 3. Discrete Chromatic Quantization
To mitigate color distortion caused by differing screen calibrations and blue-light filters (Night Shift):
* The rendering engine quantizes the HSL hue of the mosaic into **12 discrete color families** (spaced 30 degrees apart). This guarantees that screen variations do not alter the visual recognition of the signature's hue.

---

## 5. 90-Day Action Plan (Make Waves Strategy)

To participate in and optimize our score on the *Make Waves* leaderboard (based on active users and volume on Mainnet), we will follow the strategic schedule below:

```
  Days 1 - 30                       Days 31 - 60                      Days 61 - 90
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│   Phase 1: Integration  │ ─────►│   Phase 2: Usability    │ ─────►│   Phase 3: Adoption &   │
│   - Wallet Connectors   │       │   - Cognitive testing   │       │     Aquarium Pitch      │
│   - Mainnet Launch      │       │   - UX/UI Optimization  │       │   - Campaigns & Alliances│
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### Phase 1: Cryptographic Integration and Launch (Days 1 - 30)
* **Milestone 1**: Remove private key input in the production UI and integrate connectors for **Gem Wallet**, **Crossmark**, and **Xaman**.
* **Milestone 2**: Deploy the dApp on decentralized hosting (IPFS or Vercel) and connect to XRPL Mainnet RPC nodes.
* **Milestone 3**: Enable the low-cost native XLS-20 minting mechanism on Mainnet.

### Phase 2: UX and Usability Optimization (Days 31 - 60)
* **Milestone 1**: Use the **Cognitive Testing** panel to gather reaction time metrics from community users.
* **Milestone 2**: Refine the Fisher-Yates shuffling algorithm: implement the **fixed central anchor** structure suggested in the design audit to reduce visual fatigue.
* **Milestone 3**: Optimize the file size of the autogenerated SVGs so that their storage in on-chain metadata consumes minimal memory.

### Phase 3: Ecosystem Adoption and Closing (Days 61 - 90)
* **Milestone 1**: Promote the dApp on XRPL social media channels, inviting users to register their identity avatares and participate in the contest leaderboard.
* **Milestone 2**: Write and submit the official **XLS (XRP Ledger Standard)** proposal to the ecosystem amendment committee to suggest the mosaic as a native wallet standard.
* **Milestone 3**: Prepare the final pitch, metrics demonstration video, and apply for the incubation program at the **XRPL Commons Aquarium** in Paris.
