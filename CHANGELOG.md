# Changelog

All notable changes to the **Cryptographic Mosaic** project are documented in this file.

---

## [1.1.0] - 2026-07-02

### Added
* **XRPL Non-Custodial Connectors:** Support for secure wallet connection and transaction signing via Gem Wallet, Crossmark, and Xaman (Xumm) on both Testnet and Mainnet.
* **XLS-20 Soulbound NFT Identity Registry:** Added native integration with the XRP Ledger, enabling users to mint and register their visual mosaic identity on-chain as a Soulbound NFT.
* **Mosaico Browser Extension:** Created a Manifest V3 browser extension located in `/extension` that dynamically scans web pages for XRPL addresses and injects real-time, tamper-proof mini identicon badges.
* **Gamification & Persistence:** Integrated persistent session tracking (streaks, success rates, average times) using `localStorage` in the Cognitive Testing Suite simulator, along with a button to share results on Twitter.
* **XLS Proposal Draft:** Redacted `XLS_PROPOSAL_DRAFT.md` proposing the Cryptographic Mosaic as a standardized visual address hashing spec for the XRPL ecosystem.
* **Make Waves Submission Draft:** Created `SUBMISSION_DRAFT.md` detailing the Devpost pitch story, problem description, stack, challenges, and future milestones.
* **Vercel Serverless Hosting Config:** Added `vercel.json` with strict Content Security Policy (CSP) headers to support serverless zero-sysadmin hosting.

### Changed
* **Premium Cyberpunk UI:** Refined dApp dashboard with custom styles, responsive layouts, 16px border radii, glow effects, and unified XRPL connect buttons.
* **NPM Package Export Structure:** Configured `package.json` with standard modular exports (`files`, `exports`, `main`) for third-party imports of `crypto`, `generator`, `audio`, and `xrpl` libraries.
* **Project-wide English Localization:** Translated the entire project codebase into English:
  * User Interfaces (`index.html`, `main.js`)
  * Business & Integration Logic (`src/core/xrpl.js`, `src/web/testing.js`)
  * Core Code Comments (`generator.js`, `audio.js`, `crypto.js`)
  * Full Documentation Suite (`README.md`, `MANUAL.md`, `SECURITY.md`, `AUDIO_PROPOSAL.md`, `CRITIQUE.md`, `DISCUSSION.md`, `INTEGRATION.md`, `NARRATIVE.md`, `xrpl_make_waves_proposal.md`)
  * Test Suite and Scripts (`tests/mosaico.test.js`)
