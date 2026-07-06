# Mainnet & Make Waves Deployment Guide

Production dApp: **https://mosaico-criptografico.vercel.app**

This guide covers credential setup, encrypted vault sync, and Vercel deployment.

---

## 1. Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
- XRPL wallet with **≥ 12 XRP** on Mainnet (10 base reserve + 2 NFT owner reserve)
- [Xumm Developer account](https://apps.xumm.dev/) for Xaman integration

---

## 2. Configure credentials (local only — never commit)

```bash
cp .env.example .env
```

| Variable | Where to get it | Safe in git? |
|----------|-----------------|--------------|
| `DEPLOYMENT_MODE` | Set to `production` | Template only (`.env.example`) |
| `DEFAULT_XRPL_NETWORK` | `mainnet` for hackathon demo | Template only |
| `APP_URL` | `https://mosaico-criptografico.vercel.app` | Template only |
| `XUMM_API_KEY` | [apps.xumm.dev](https://apps.xumm.dev/) | Public key — OK in build output |
| `XUMM_API_SECRET` | Xumm dashboard (shown once) | **Never** — Vercel vault only |
| `ENABLE_LOCAL_DEMO` | `false` for production | Template only |

Generate runtime config and verify security:

```bash
npm run config     # builds config.runtime.js (public values only)
npm run audit      # fails if secrets leak into client bundles
npm run icons
npm test
```

---

## 3. Sync credentials to Vercel vault (encrypted)

Local `.env` is your private notebook. Production secrets live in **Vercel's encrypted environment variables**:

```bash
npx vercel login
npx vercel link
npm run vault:sync   # pushes .env → Vercel vault (never touches git)
```

What `vault:sync` does:
- Uploads each variable to Vercel as **Encrypted** env vars
- `XUMM_API_SECRET` goes to **Production only** (serverless route)
- Never prints secret values to the console

---

## 4. Deploy to production

```bash
npm run deploy    # audit → build → vercel --prod
```

Or push to GitHub (Vercel auto-deploys with `npm run build`).

**Important:** `.vercelignore` blocks `.env` and `config.runtime.js` from upload. The build regenerates config from vault env vars on Vercel's servers.

---

## 5. Production behavior

When `DEPLOYMENT_MODE=production`:

| Setting | Value |
|---------|-------|
| Default network | Mainnet |
| Default wallet | Xaman (Gem Wallet alternative) |
| Seed/secret input | Hidden |
| Xaman signing | `/api/xumm/payload` (secret server-side) |
| Sample addresses | XRPL format (`rG1QQ...`) |
| Banner | "Production · XRPL Mainnet" |

---

## 6. Make Waves demo script (5 min)

1. **Problem** (30s): Comparator — two similar XRPL addresses, different mosaics.
2. **Generator** (60s): Paste address → visual mosaic + acoustic key.
3. **Mainnet mint** (90s): Xaman (mobile QR) or Gem Wallet → Mint Soulbound NFT (taxon 1001) → tx hash.
4. **Verification** (60s): Green on-chain badge; explain `Issuer == Owner`.
5. **Extension** (30s): Overlay on xrpl.org / Bithomp.
6. **Impact** (30s): Ecosystem standard → every wallet, every payment, on-chain verification.

Full pitch text: [SUBMISSION_DRAFT.md](SUBMISSION_DRAFT.md)

---

## 7. Browser extension

```bash
npm run icons
```

Chrome → `chrome://extensions` → Developer mode → Load unpacked → `/extension`

---

## 8. Security checklist (run before submission)

- [x] `.env` gitignored and blocked by `.vercelignore`
- [x] `config.runtime.js` gitignored (regenerated at build)
- [x] `npm run audit` passes
- [x] `XUMM_API_SECRET` in Vercel vault only
- [x] `ENABLE_LOCAL_DEMO=false` in production
- [x] Live demo: https://mosaico-criptografico.vercel.app
- [ ] Demo video with Mainnet tx hash recorded
- [ ] Screenshots for Devpost submission

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| Xaman "not configured" | Set `XUMM_API_KEY` in `.env` → `npm run config` |
| `/api/xumm/payload` 500 | Run `npm run vault:sync` to push `XUMM_API_SECRET` |
| Gem Wallet not found | Install from gemwallet.app (Chrome/Brave) |
| `tecINSUFFICIENT_RESERVE` | Fund wallet with ≥ 12 XRP |
| Wrong `appUrl` in production | Update `APP_URL` in Vercel vault → redeploy |
