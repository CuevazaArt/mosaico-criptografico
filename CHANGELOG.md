# Changelog

All notable changes to the **Cryptographic Mosaic** project are documented in this file.

---

## [3.9.1] - 2026-07-09

### Added
* **SOCIAL_KIT.md** — EN/ES narratives, ready-to-paste posts (X, Discord, LinkedIn, Reddit, wallet DMs).
* **assets/banners/** — OG, X header, Discord, and square SVG banners for campaign launch.
* **ADOPTION_PLAN.md** — ranked diffusion channels (Tier A/B/C).

### Changed
* **Demo video audio** — replaced sine drone with rhythmic bass groove; removed piercing high acoustic cues.

---

## [3.9.0] - 2026-07-09

### Added
* **Semi-anchored mosaic layout** (`src/core/layout.js`): topological anchor (cell type 4) stays fixed at the geometric center; only peripheral cells are Fisher-Yates shuffled — faster recognition, lower cognitive load.
* **Adoption campaign plan** (`ADOPTION_PLAN.md`): 30/60/90-day traction playbook for Make Waves.
* **Demo video v2** pipeline: tighter English narrative, phishing-first story, normalized audio + burned-in subtitles.

### Changed
* **Xaman trust:** false-positive scam label **RESOLVED** — UI panels, Help, `/verify`, and guides updated from warning → success messaging ([XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md)).
* **Version sync:** `package.json`, `app-config`, cache-bust (`?v=3.9.0`), GitHub Pages config aligned to **3.9.0**.
* **Audio / acoustic-export / extension generator** use the same semi-anchored layout as SVG.
* **SUBMISSION_DRAFT.md** refreshed for Make Waves (tests, video, trust resolved, potential framing).

### Fixed
* Version drift between git tags (v3.8.x) and `package.json` (3.1.6).

---

## [3.8.3] - 2026-07-08

### Added
* Make Waves demo video pipeline (`scripts/record-demo-video.mjs`) with ambient music + acoustic cues + English SRT.

---

## [3.8.2] - 2026-07-08

### Added
* **XAMAN_TRUST_ISSUE.md** / **OPERATOR_ACTIONS.md:** mitigation for Xaman false “scam” warning.
* **`/.well-known/xrp-ledger.toml`** generated at build.
* **`/verify`:** public on-chain Mosaic Keychain verification page.

### Changed
* Post-mint trust panel, Help modal, CSP / verify rewrite in `vercel.json`.

---

## [3.1.6] - 2026-07-07

### Fixed
* **GitHub Pages CI:** `npm ci` before icon generation; remove `node_modules` from Pages artifact.
* **CI cache:** Test workflow uses `package-lock.json` for dependency cache.

### Added
* **`npm run dev:mainnet`:** Local Vercel dev server with Xaman API routes.

---

## [3.1.5] - 2026-07-07

### Added
* **KEYCHAIN_REGISTRATION_GUIDE.md:** Standard end-user journey — prepare wallet, discover mosaic, register Soulbound NFT on XRPL, daily use.

---

## [3.1.4] - 2026-07-06

### Added
* **TERMS.md:** Binding Terms of Use — experimental tool, user sole responsibility, liability limits.
* **Terms acceptance modal:** Web app blocks usage until the user checks accept and continues (stored in `localStorage`, version `1.0`).
