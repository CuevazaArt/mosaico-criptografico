# Integration Guide and Standards Proposal: "Mnemonic Keyring"

This document explains how to integrate the **Cryptographic Mosaic** into existing projects (dApps, wallets, extensions) and details the proposal to establish it as an industry-standard native validation protocol for keys and signatures.

---

## 1. Integration in Existing Projects

The Cryptographic Mosaic is a pure JavaScript library, free of external dependencies (Zero-Dependency) and entirely client-side (Client-Side). This makes its integration into existing platforms extremely simple.

### A. Web Applications (React, Vue, Svelte, Angular)
You can integrate the rendering engine as a reusable component.

#### React Component Example:
```jsx
import React, { useEffect, useState } from 'react';
import { sha256 } from './core/crypto.js';
import { generateSvg } from './core/generator.js';

export function MnemonicBadge({ address, gridSize = 3, chaoticMode = false }) {
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    async function loadSvg() {
      if (!address) return;
      const hash = await sha256(address);
      const svg = generateSvg(hash, address, {
        gridSize,
        chaoticMode,
        showOverlay: false, // Hide overlay on small avatars
        showAnchors: true
      });
      setSvgMarkup(svg);
    }
    loadSvg();
  }, [address, gridSize, chaoticMode]);

  return (
    <div 
      className="mnemonic-badge"
      style={{ width: '48px', height: '48px' }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }} 
    />
  );
}
```

### B. Browser Extensions (Brave, Chrome, Firefox)
A browser extension can act as an **isolated, secure validation layer (Zero-Trust Overlay)**:
1. **DOM Injection:** A *Content Script* scans common Web3 pages (Uniswap, Etherscan) searching for hexadecimal string patterns matching public keys or contract addresses.
2. **Visual Overlay:** Inserts the `MnemonicBadge` component right next to the address in a floating banner.
3. **Defense Against Hacked Websites:** Since it is injected directly by the user's secure browser extension, a malicious website cannot alter the mosaic image without the extension revealing the discrepancy with the actual transaction hash.

### C. Mobile Applications (React Native, Flutter, Swift, Kotlin)
* **React Native:** Integrates by rendering the SVG string using the `react-native-svg` library (`<SvgXml xml={svgMarkup} />`).
* **Flutter or Native Code:** As an open mathematical specification, the drawing formulas and coordinate systems in `generator.js` can be easily translated to native canvas primitives (Canvas in Android/SwiftUI in iOS) in under 400 lines of code, ensuring high-performance native rendering without Webviews.

---

## 2. Standards Proposal: "Native Mnemonic Keyring"

For this tool to become universally trusted and consistent, it should not rely on a single dApp. It should be promoted as an **Improvement Proposal (similar to an EIP on Ethereum or BIP on Bitcoin)**.

```
                  ┌──────────────────────────────────────────────┐
                  │   ERC Proposal: Visual Hash Specification    │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Wallets Integration ]                         [ Block Explorers ]
  - Mosaic on signature screens                    - Mosaic next to contract address
  - Mosaic on seed backups                         - Visual token validation
```

### 1. Creation of an EIP/ERC Proposal (Visual Hash Standard)
We propose registering an ERC titled: **"Visual Hash Specification for Blockchain Addresses"**.
* **Goal:** Mathematically define the mosaic algorithm: how the hash bytes are split, how the Fisher-Yates shuffle is executed, and the exact drawing coordinates for the 9 cell types.
* **Outcome:** As a standard, **any** wallet (MetaMask, Ledger, Trezor) or block explorer (Etherscan, Solscan) implementing the specification will render **exactly the same image** for any given address, creating a universal visual language for cryptographic identities.

### 2. The Mosaic as a Visual "Seed Backup"
Currently, wallets force users to write down 12 or 24 words on paper to back up their private keys.
* **The Problem:** Users can transpose words or make spelling errors without noticing until they attempt to restore the account.
* **Mnemonic Keyring Proposal:** Upon account creation, the wallet displays a dynamic and immutable 5x5 mosaic derived from the private key/seed.
* **Mnemonic Verification:** When the user re-enters the words to verify the backup, the wallet renders the mosaic in real-time. If the user made a single word spelling error, **the resulting mosaic will be drastically different**, alerting them visually and immediately before validating the backup copy.

### 3. Native Web3 API (`window.ethereum`)
We propose that the Web3 provider injected into the browser natively exposes the user's visual identity representation:
```javascript
// Retrieve the official mosaic of the user's active account directly from the secure wallet
const userVisualHash = await window.ethereum.request({
  method: 'eth_getMnemonicVisual',
  params: [address, { gridSize: 3 }]
});
```
This enables any website to consume and render the user's official mosaic directly from the secure wallet, reinforcing visual trust and consistency across the ecosystem.
