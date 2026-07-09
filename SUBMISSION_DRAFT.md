# Submission Draft: Make Waves on XRPL

Copy the sections below directly into the Devpost / Make Waves submission form.

**Version:** 3.9.0 · **Demo video:** `assets/demo-make-waves.mp4`

---

## Basic project information

| Field | Value |
|-------|-------|
| **Project name** | Cryptographic Mosaic (Sensory 2FA) |
| **Tagline** (≤140 chars) | Visual & acoustic identicons on XRPL that stop phishing — with on-chain Soulbound identity. |
| **Track** | Make Waves — Security & Usability / ecosystem growth |
| **Live demo** | https://mosaico-criptografico.vercel.app |
| **Verify** | https://mosaico-criptografico.vercel.app/verify |
| **Repository** | https://github.com/CuevazaArt/mosaico-criptografico |
| **NPM package** | https://www.npmjs.com/package/cryptographic_mosaic_keychain |
| **Demo video** | `assets/demo-make-waves.mp4` (English subtitles + audio) |

---

## Project story

### 1. What real-world problem does your project solve?

XRPL users lose funds because humans cannot reliably compare 34-character addresses. Attackers exploit vanity phishing and clipboard hijacking — matching the start/end of a legitimate `r…` while changing the middle.

Cryptographic Mosaic turns each address into a **visual mosaic** and **4-note acoustic signature**. Change one character → the entire pattern and melody change. Phishing becomes visible and audible before you sign.

### 2. What is your solution?

| Layer | What it does |
|-------|--------------|
| **Visual mosaic** | SHA-256 → deterministic SVG (3×3 / 4×4 / 5×5) with **semi-anchored layout** (center glyph fixed) |
| **Acoustic key** | 4-note pentatonic arpeggio unique to each address |
| **On-chain anchor** | Soulbound XLS-20 NFT (taxon `1001`, `Issuer == Owner`) |
| **Browser extension** | Live mosaic badges on explorers |
| **Public verify** | `/verify` queries Mainnet `account_nfts` |

### 3. How did you build it?

Vanilla JS (Web Crypto + Web Audio), `xrpl.js`, non-custodial wallets (Xaman / Gem / Crossmark), Vercel serverless for Xaman payloads + NFT metadata/image/audio. Pre-deploy `npm run audit` blocks secret leaks.

### 4. Challenges

| Challenge | Solution |
|-----------|----------|
| Cognitive load of full Fisher-Yates shuffle | **v3.9.0 semi-anchored layout** — anchor fixed at center |
| Xaman scam false-positive on self-mint | Domain TOML + Bithomp + XRPL Labs — **RESOLVED 2026-07** |
| Xaman API secret in browser | Serverless `/api/xumm/payload` only |

### 5. Proud of

- Working **Mainnet** mint/burn + public `/verify`
- Xaman trust false-positive **closed**
- Demo video with English subtitles + audible acoustic cues
- XLS draft for wallet-native identicons
- $0 always-on infrastructure (no DB)

### 6. Scale beyond the hackathon

| Phase | Milestone |
|-------|-----------|
| **Now** | Live dApp + NPM + extension + verify + demo video |
| **30 days** | Adoption campaign — target 50+ self-mints; wallet outreach |
| **60 days** | XLS proposal + PR sketches for Xaman/Gem/Crossmark |
| **90 days** | Native wallet rendering → `account_nfts` before every outbound payment |

**On-chain value:** 1 identity mint per user + recurring verification reads if wallets integrate — security that drives XRPL activity.

---

## Judging criteria

### Idea
First sensory 2FA layer for XRPL addresses combining visual, acoustic, and Soulbound identity — proposed as an **ecosystem standard**, not a one-off dApp.

### Implementation
- Automated unit tests (crypto, layout, SVG, NFT package, config) + Playwright UI audit
- Semi-anchored layout + CSP + secret audit + Mainnet node failover
- Modular NPM exports (`crypto`, `generator`, `layout`, `audio`, `xrpl`)

### Demo
Live URL + `assets/demo-make-waves.mp4`. Judges can: Comparator phishing → Generator + audio → mint path → `/verify`.

### Potential
Identity NFTs + verification queries before payments. Conservative path: wallet integrations turn every outbound transfer into an on-chain identity check.

---

## XRPL features used

| Feature | Purpose |
|---------|---------|
| `NFTokenMint` / `NFTokenBurn` | Soulbound identity register / reclaim |
| `account_nfts` | Verify taxon `1001` self-issued |
| Mainnet WebSockets | Live ledger |
| Xaman / Gem / Crossmark | Non-custodial signing |

---

## Links checklist

- [x] Public GitHub repository
- [x] Live demo (Mainnet)
- [x] Demo video (`assets/demo-make-waves.mp4`)
- [ ] Screenshots (Comparator, mint success, `/verify`) — capture for form
- [ ] Register on https://hackathons.xrpl-commons.org/

---

## 5-minute pitch

| Time | Content |
|------|---------|
| 0:00–0:30 | Addresses are unhuman. Show lookalike `r…` |
| 0:30–1:30 | Comparator — one wrong char → mosaics diverge + audio |
| 1:30–2:30 | Mint Soulbound NFT on Mainnet (Xaman) → tx hash |
| 2:30–3:30 | `/verify` + self-issued proof; Xaman trust resolved |
| 3:30–4:30 | Semi-anchored layout + XLS / wallet adoption path |
| 4:30–5:00 | “Every XRPL wallet should show a mosaic before you sign.” |
