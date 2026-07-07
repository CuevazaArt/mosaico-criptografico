# Submission Draft: Make Waves on XRPL

Copy the sections below directly into the Devpost or Make Waves submission form.

---

## Basic project information

| Field | Value |
|-------|-------|
| **Project name** | Cryptographic Mosaic (Sensory 2FA) |
| **Tagline** (≤140 chars) | Visual & acoustic identicons on XRPL that stop phishing and clipboard hijacking — with on-chain Soulbound identity. |
| **Track** | Make Waves — Web3 Security & Usability |
| **Live demo** | https://mosaico-criptografico.vercel.app |
| **Repository** | https://github.com/CuevazaArt/mosaico-criptografico |
| **NPM package** | https://www.npmjs.com/package/cryptographic_mosaic_keychain |

---

## Project story (Devpost)

### 1. What real-world problem does your project solve? Why does it matter?

Every day, XRPL users lose funds because they cannot verify 34-character addresses like `rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE`. Under pressure, people check only the first and last few characters — and attackers know it.

Two attacks dominate:

- **Vanity address phishing** — Scammers generate addresses that match the start and end of a legitimate one. The text *looks* right; the destination is wrong.
- **Clipboard hijacking** — Malware silently replaces a copied address between Ctrl+C and Ctrl+V. The user never notices.

Both exploit the same weakness: **humans are not built to compare long random strings.**

Cryptographic Mosaic turns each address into a **visual and acoustic fingerprint** you can recognize in under two seconds. Change one character in the middle of the address and the entire mosaic reshuffles — colors, shapes, and melody all change. Phishing becomes visible and audible before you sign.

This matters because XRPL settles value in 4 seconds. There is no undo button. Prevention at the UI layer is the last line of defense.

---

### 2. What is your solution?

**Cryptographic Mosaic** is a sensory second-factor layer for XRPL addresses:

| Layer | What it does |
|-------|--------------|
| **Visual mosaic** | SHA-256 hash → deterministic SVG grid (3×3 / 4×4 / 5×5) with Fisher-Yates cell shuffling and 12 discrete color families |
| **Acoustic key** | 4-note pentatonic arpeggio unique to each address; dissonant alarm on mismatch |
| **On-chain anchor** | Soulbound XLS-20 NFT (taxon `1001`) minted via `NFTokenMint` — self-issued proof where `Issuer == Owner` |
| **Browser extension** | Live mosaic badges injected next to XRPL addresses on block explorers |
| **Cognitive simulator** | Gamified phishing test measuring detection speed and accuracy |

**How a user protects a transfer in practice:**

1. Save the mosaic pattern of your trusted counterparty address.
2. Before signing, paste the destination and compare mosaics side by side.
3. If they match visually and acoustically → proceed.
4. If they differ → stop. Do not sign.

---

### 3. How did you build it?

- **Vanilla JavaScript** — No framework lock-in. Core crypto, SVG, and audio run entirely in the browser via Web Crypto API and Web Audio API.
- **XRPL.js** — Direct `NFTokenMint` transactions and `account_nfts` verification on Mainnet and Testnet.
- **Non-custodial wallets** — Gem Wallet, Crossmark, and Xaman (Xumm) handle all signing. Private keys never enter the dApp.
- **Vercel serverless** — A single API route (`/api/xumm/payload`) handles Xaman signing requests; the API secret lives only in Vercel's encrypted vault.
- **Security-first deploy pipeline** — `npm run audit` blocks deploys if secrets leak into client bundles; `.vercelignore` prevents local `.env` from being uploaded.

---

### 4. What challenges did you face?

| Challenge | Solution |
|-----------|----------|
| Screen color calibration varies across devices | Quantized HSL hues in 12 families (30° apart) so mosaics stay recognizable on any display |
| Attackers could mint fake identity NFTs for other users | Self-issued verification: valid only when NFT `Issuer == Owner` for taxon `1001` |
| Xaman API secret cannot live in browser code | Serverless payload route on Vercel; secret encrypted at rest in environment variables |
| Cognitive fatigue with complex visuals | Harmonious color mode + topological anchors (countable star vertices) for fast pattern memory |

---

### 5. What are you proud of?

- A **working Mainnet deployment** where judges can mint a real Soulbound NFT in under 60 seconds.
- A **browser extension** that makes mosaics appear automatically on XRPL explorers — zero user action required.
- A **cognitive testing suite** with measurable metrics (reaction time, success rate, streaks) proving the approach works under fatigue.
- An **XLS standard draft** proposing wallet-native identicons for the entire XRPL ecosystem.
- **$0 infrastructure cost** — no database, no always-on server, no admin overhead.

---

### 6. What did you learn?

Security on a ledger is not only about consensus and validators. The moment a human reads an address on a screen, the attack surface shifts to **cognitive psychology**. Tools that respect how memory and perception actually work — visual patterns, not hex strings — are as important as cryptographic primitives.

---

### 7. How can this scale beyond the hackathon?

| Phase | Milestone |
|-------|-----------|
| **Now** | Live dApp + NPM package + browser extension + XLS draft |
| **30 days** | PR to Xaman/Gem/Crossmark for native identicon rendering |
| **60 days** | XLS proposal submitted to XRPL standards committee |
| **90 days** | Wallet integrations generating verification queries before every outbound payment |

**Adoption multiplier:** If 3 major XRPL wallets embed the standard, every outbound transaction triggers an `account_nfts` check — turning security into recurring on-chain activity at ecosystem scale.

---

## Make Waves judging criteria — direct answers

### Idea (originality)

First sensory 2FA layer designed specifically for XRPL address verification, combining visual identicons, acoustic signatures, and Soulbound on-chain identity in a single zero-server dApp. Not a clone of existing wallet features — a proposed **ecosystem standard**.

### Implementation (code quality)

- 6 automated tests passing (crypto, generator, config)
- Pre-deploy security audit (`npm run audit`) prevents credential leaks
- Fault-tolerant XRPL node failover across 4 Mainnet WebSocket endpoints
- Strict Content Security Policy in `vercel.json`
- Modular NPM exports for third-party integration

### Demo (clarity)

**Live URL:** https://mosaico-criptografico.vercel.app

Judges can immediately:
1. See two similar addresses produce different mosaics (Comparator tab).
2. Connect Xaman on Mainnet (or Gem Wallet) and mint a Soulbound NFT.
3. Verify on-chain registration via the green badge.
4. Play acoustic signatures and run the phishing simulator.

**Suggested demo video structure (2–3 min):**
Problem → Comparator phishing detection → Generator + audio → Mainnet mint with tx hash → Extension on explorer.

### Potential (on-chain value)

| Metric | Conservative estimate |
|--------|----------------------|
| Identity NFTs minted | 1 per adopting user (one-time `NFTokenMint`) |
| Verification queries | 1–5 `account_nfts` calls per outbound payment if wallets integrate |
| At 10,000 active users × 2 tx/week | ~80,000–400,000 on-chain reads/month |
| Ecosystem impact | Prevents phishing losses; drives NFT adoption; proposes XLS standard for all XRPL wallets |

Even one prevented phishing attack (often worth thousands of XRP) justifies the entire project.

---

## XRPL features used

| Feature | Transaction / query | Purpose |
|---------|---------------------|---------|
| XLS-20 `NFTokenMint` | Write | Register Soulbound visual identity (taxon `1001`) |
| `account_nfts` | Read | Verify self-issued identity on-chain |
| Mainnet WebSockets | Connection | Live ledger interaction |
| Testnet Faucet | Write (dev only) | Developer sandbox |
| Gem / Crossmark / Xaman | Signing | Non-custodial transaction authorization |

---

## Security statement for reviewers

- Private keys are **never** collected, stored, or transmitted by this dApp.
- Production mode hides all seed/secret input fields.
- `XUMM_API_SECRET` exists only in Vercel's encrypted environment variables.
- `.env` and `config.runtime.js` are gitignored and blocked from Vercel uploads via `.vercelignore`.
- `npm run audit` runs automatically before every production deploy.

**Legal:** Open-source under [MIT](LICENSE). End users **must accept** [TERMS.md](TERMS.md) in the web app. Disclaimers and liability limits in [LEGAL.md](LEGAL.md). Not affiliated with Ripple, XRPL Foundation, or wallet vendors.

---

## Links checklist for submission form

- [x] Public GitHub repository
- [x] Live demo URL (Mainnet-ready)
- [ ] Demo video (2–3 min) — *record using pitch script in [DEPLOYMENT.md](DEPLOYMENT.md)*
- [ ] Screenshots of Comparator, Mainnet mint, and extension overlay

---

## 5-minute pitch outline

| Time | Content |
|------|---------|
| 0:00–0:30 | "Addresses are unhuman. Scammers exploit that." Show similar `r...` addresses. |
| 0:30–1:30 | Comparator demo — mosaics diverge on one-character change. Play mismatch audio. |
| 1:30–2:30 | Connect Xaman (mobile QR) or Gem Wallet → Mint Soulbound NFT on Mainnet → show tx hash. |
| 2:30–3:30 | Explain self-issued proof (`Issuer == Owner`). Show extension on xrpl.org. |
| 3:30–4:30 | Cognitive simulator results. XLS standard vision. Ecosystem scale. |
| 4:30–5:00 | "Every XRPL wallet should show a mosaic before you sign. We built the standard." |

---

## What's next

- Submit XLS proposal to the XRPL standards committee.
- Native integration PRs for Xaman, Gem Wallet, and Crossmark.
- Continuous cognitive testing metrics to publish detection-speed benchmarks.
- Aquarium incubation program at XRPL Commons (Paris).
