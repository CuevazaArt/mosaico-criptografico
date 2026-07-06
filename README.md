# Cryptographic Mosaic — Sensory 2FA for XRPL

> **Every XRPL address gets a unique visual fingerprint.** If the address changes by one character, the mosaic changes completely — so you catch phishing and clipboard attacks before you sign.

| | |
|---|---|
| **Live Demo (Vercel)** | [mosaico-criptografico.vercel.app](https://mosaico-criptografico.vercel.app) |
| **GitHub Pages** | [cuevazaart.github.io/mosaico-criptografico](https://cuevazaart.github.io/mosaico-criptografico/) |
| **Repository** | [github.com/CuevazaArt/mosaico-criptografico](https://github.com/CuevazaArt/mosaico-criptografico) |
| **NPM Package** | [`cryptographic_mosaic_keychain`](https://www.npmjs.com/package/cryptographic_mosaic_keychain) |
| **Hackathon** | Make Waves on XRPL — Security & Usability track |

---

## The idea in 30 seconds

XRPL addresses like `rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE` are impossible to verify by eye. Most people only check the first and last few characters — exactly what scammers exploit.

**Cryptographic Mosaic** solves this with a **sensory second factor**:

1. **See it** — A deterministic 3×3 (or 4×4 / 5×5) SVG mosaic derived from the address hash.
2. **Hear it** — A 4-note acoustic signature unique to each address.
3. **Anchor it on-chain** — Mint a Soulbound NFT (XLS-20, taxon `1001`) on XRPL as immutable proof of identity.

Copy the wrong address? The mosaic **looks and sounds completely different**. No need to read 34 characters one by one.

---

## Why this fits Make Waves

Make Waves rewards projects that drive **real usage on the XRP Ledger**. Cryptographic Mosaic does exactly that:

| XRPL capability | How we use it |
|-----------------|---------------|
| **XLS-20 NFTs** | Soulbound identity mint (`NFTokenMint`, taxon `1001`) |
| **Mainnet + Testnet** | Live registration and on-chain verification |
| **Non-custodial wallets** | Gem Wallet, Crossmark, Xaman (Xumm) signing |
| **On-chain queries** | `account_nfts` to verify self-issued identity |

**Ecosystem growth path:** Every XRPL user who adopts the standard mints 1 identity NFT. If integrated into Xaman, Gem, or Crossmark natively, millions of `account_nfts` verification calls could run before every outbound payment — turning security into recurring on-chain activity.

---

## Try it now (3-minute judge walkthrough)

1. Open the **[live demo](https://mosaico-criptografico.vercel.app)** → tab **Comparator**.
2. Notice Address A and B look similar in text but produce **radically different mosaics** (red badge = phishing detected).
3. Switch to **Generator** → paste any XRPL address → click **Listen to Acoustic Key**.
4. In the Comparator panel, select **Mainnet** → connect **Gem Wallet** → **Mint Mosaic Key**.
5. Watch the ledger console for your `NFTokenMint` transaction hash.
6. Load the **browser extension** (`/extension` folder) on [xrpl.org](https://xrpl.org) to see live mosaic badges beside addresses.

---

## Main features

* **Scalable mosaics** — 3×3, 4×4, and 5×5 grids with Fisher-Yates layout shuffling.
* **Topological anchors** — Countable central glyphs that stick in human memory.
* **Acoustic signatures** — Deterministic 4-note arpeggios plus match/mismatch alert sequences.
* **XRPL Soulbound registry** — Self-issued NFT proof (`Issuer == Owner`) prevents identity impersonation.
* **Cognitive testing suite** — Gamified phishing simulator with reaction-time metrics.
* **Browser extension** — Injects mini-mosaics next to XRPL addresses on block explorers.
* **Zero-server core** — SHA-256, SVG, and audio run 100% in the browser; $0 maintenance cost.

---

## Security model

Your private keys **never touch this application**. All Mainnet signing goes through your own wallet.

| Asset | Where it lives | In git? |
|-------|----------------|---------|
| `.env` (local credentials) | Your machine only | **Never** |
| `XUMM_API_SECRET` | Vercel encrypted vault | **Never** |
| `XUMM_API_KEY` | Public OAuth key in `config.runtime.js` | Generated at build (public by design) |
| `config.runtime.js` | Auto-generated per deploy | **Never** committed |

Before every deploy:

```bash
npm run audit        # verifies no secrets leak into client bundles
npm run vault:sync   # pushes credentials to Vercel encrypted env vars
npm run deploy       # audit → build → production deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Mainnet deployment guide.

---

## Quick start (local development)

```bash
git clone https://github.com/CuevazaArt/mosaico-criptografico.git
cd mosaico-criptografico
cp .env.example .env    # fill credentials locally — never commit this file
npm install
npm run config          # generates config.runtime.js from .env
npm test
npm run dev             # http://localhost:3000
```

For Xaman API routes locally: `npx vercel dev`

---

## Documentation map

| Document | Audience | What you'll find |
|----------|----------|------------------|
| [USER_GUIDE.md](USER_GUIDE.md) | **New users** | Step-by-step: what you need, costs, daily usage, on-chain registration |
| [SUBMISSION_DRAFT.md](SUBMISSION_DRAFT.md) | Hackathon judges | Ready-to-paste Devpost story + judging criteria answers |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Developers / DevOps | Mainnet deploy, vault sync, 5-min pitch script |
| [NARRATIVE.md](NARRATIVE.md) | End-users + devs | Simple keychain analogy + technical pipeline |
| [MANUAL.md](MANUAL.md) | End-users | 3-step verification protocol |
| [SECURITY.md](SECURITY.md) | Security reviewers | Entropy model, attack resistance, credential policy |
| [xrpl_make_waves_proposal.md](xrpl_make_waves_proposal.md) | XRPL ecosystem | 90-day adoption plan for Make Waves |
| [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md) | Standards committee | XLS draft for wallet-native identicons |
| [DISCUSSION.md](DISCUSSION.md) | Integrators | Threat model + wallet integration paths |
| [INTEGRATION.md](INTEGRATION.md) | Wallet teams | Embedding mosaics in existing dApps |
| [AUDIO_PROPOSAL.md](AUDIO_PROPOSAL.md) | UX researchers | Acoustic layer specification |
| [CRITIQUE.md](CRITIQUE.md) | UX auditors | Cognitive ergonomics analysis |
| [CHANGELOG.md](CHANGELOG.md) | Contributors | Version history |

---

## Architecture

```
┌─────────────────┐    SHA-256     ┌──────────────┐    Fisher-Yates    ┌─────────────────┐
│  XRPL Address   ├───────────────►│  32-byte hash ├──────────────────►│  SVG Mosaic     │
└─────────────────┘                └──────┬───────┘                    └─────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ 4-note acoustic │
                                 │   signature     │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ NFTokenMint     │
                                 │ Soulbound NFT   │
                                 │ (taxon 1001)    │
                                 └─────────────────┘
```

* **Client-side:** `src/core/crypto.js`, `generator.js`, `audio.js`
* **XRPL layer:** `src/core/xrpl.js` — wallet connectors + on-chain verification
* **Serverless (Xaman only):** `api/xumm/payload.js` — secret never leaves Vercel vault
* **Extension:** `extension/` — DOM scanner for XRPL addresses on explorers

---

## Code structure

| File | Role |
|------|------|
| `index.html` | dApp dashboard (Generator, Comparator, Field Testing) |
| `main.js` | UI orchestration and XRPL panel logic |
| `styles.css` | Premium dark UI with glassmorphism |
| `src/core/crypto.js` | SHA-256 hashing (Web Crypto API) |
| `src/core/generator.js` | Deterministic SVG mosaic engine |
| `src/core/audio.js` | Web Audio API mnemonic synthesis |
| `src/core/xrpl.js` | Non-custodial wallet + XLS-20 minting |
| `src/web/testing.js` | Cognitive phishing simulator |
| `scripts/` | Config generation, vault sync, security audit |

---

## License

MIT — open source, deterministic, and built to last on the XRP Ledger.
