# Cryptographic Mosaic (3x3 Identicons)

A decentralized, deterministic, and immutable tool to generate visual identifiers in a 3x3 mosaic format from cryptographic addresses and keys. Its purpose is to mitigate spoofing (phishing) and clipboard hijacking attacks through high-entropy visual recognition.

---

## 📖 Additional Documentation

To dive deeper into the technical design, theory, and integration of the tool, refer to the following documents:
* **[SECURITY.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/SECURITY.md):** Security Justification, Entropy Model, and advanced attack resistance analysis.
* **[MANUAL.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/MANUAL.md):** User Manual and step-by-step instructions for the 3-Step Manual Verification Protocol.
* **[AUDIO_PROPOSAL.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/AUDIO_PROPOSAL.md):** Specification of the acoustic sensory layer and hardware mitigations.
* **[CRITIQUE.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/CRITIQUE.md):** Cognitive usability, calibration, and ergonomics audit report.
* **[DISCUSSION.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/DISCUSSION.md):** Threat modeling and technical integration in wallets and exchanges.
* **[xrpl_make_waves_proposal.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/xrpl_make_waves_proposal.md):** XLS-20 Immutable Registry technical architecture and 90-day Action Plan for the *Make Waves* program.
* **[XLS_PROPOSAL_DRAFT.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/XLS_PROPOSAL_DRAFT.md):** Technical standard draft for the XRP Ledger ecosystem.
* **[SUBMISSION_DRAFT.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/SUBMISSION_DRAFT.md):** Pitch and description draft ready for Devpost/Make Waves challenge submission.

---

## ✨ Main Features

* **Scalable Mosaics:** Native support for **3x3, 4x4, and 5x5** grids to scale visual entropy on demand.
* **Deterministic Fisher-Yates Shuffle (Layout Shuffling):** Complete random reorganization based on the address hash to break visual symmetries.
* **Topological Anchors:** Central glyph with white countable vertices and satellites to facilitate visual memory.
* **Snappy Acoustic Signature:** Quick deterministic melodic arpeggios (4 notes of 160ms) to prevent listener ear fatigue.
* **Orchestrated Audio Sequences:** Harmonious success sequences (Do Major ascending bell chime) or dissonant sawtooth dual-oscillator alarms (phishing alerts) for distinct audio feedback.
* **Immutable Registry on XRPL (XLS-20):** Integrated interactive panel supporting Testnet and Mainnet, allowing users to mint and validate immutable **Soulbound (non-transferable NFTs)** visual identity keys on the XRP Ledger non-custodially (Gem Wallet, Crossmark, Xaman).
* **Premium & Responsive Design:** Rounded cell corners at 16px, vertical pixel-perfect alignment, and glassmorphism styling.

---

## 🚀 How to run the project locally?

This is a **zero-server** and **zero-dependency** project at its core.

If you want to run it quickly:
1. Install dependencies and run integrity tests:
   ```bash
   npm install
   npm test
   ```
2. Start the local static development server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:3000` (or the port shown in console) in your web browser.

---

## 🌐 Autonomous Architecture and Security (For everyone)

### Simple Explanation (Non-Technical)
This project is designed to be **eternal and self-sustaining**. Once published online (e.g., on Vercel):
* **No maintenance required:** There is no 24/7 central server that can crash, get infected, or require costly software updates.
* **No central database:** We do not store your address or keys in a private database. Your visual identity is saved immutably on the **XRP Ledger** (Ripple's public decentralized network).
* **Absolute security:** The application never knows or stores your private keys; when signing, you do so directly through your own secure, isolated wallet (Gem Wallet, Crossmark, or Xaman).

### Architectural Detail (Technical)
* **100% Client-Side Architecture:** Mathematical calculations for Fisher-Yates layout shuffling, SHA-256 hashing, and SVG vector rendering run entirely on the user's browser CPU.
* **Security Headers (vercel.json):** The deployment configuration sets strict **Content Security Policy (CSP)** rules, limiting external scripts and network connections exclusively to public, redundant XRPL WebSockets (`wss://xrplcluster.com`, `wss://s1.ripple.com`, etc.).
* **Zero System Administration (Zero-Sysadmin):** By avoiding databases, Docker containers, or active backend processes, the infrastructure maintenance cost is $0, eliminating the need for a perpetual administrator. Code updates are pushed via GitHub and automatically deployed using CI/CD pipelines.

---

## 🛠️ Code Structure

* `index.html`: Structure of the dApp control panel (Dashboard).
* `styles.css`: CSS stylesheet featuring a dark premium look and glassmorphism.
* `main.js`: UI event orchestration and interface logic.
* `src/core/crypto.js`: Native deterministic hashing module (SHA-256).
* `src/core/generator.js`: SVG generator engine with cell layout shuffling.
* `src/core/audio.js`: Mnemonic acoustic synthesis engine (Audio Web API).
* `src/core/xrpl.js`: Non-custodial signature integration and network adapters.
* `src/web/testing.js`: Interactive usability and phishing field simulator.
