# Xaman Developer App Setup

Configuration guide for [apps.xumm.dev](https://apps.xumm.dev/) — Cryptographic Mosaic.

**Production app:** https://mosaico-criptografico.vercel.app

> **Known UX issue:** Users may see a false “scam” label on self-minted keychain NFTs in Xaman until domain safelisting. See [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md).

---

## Quick copy-paste (Xaman Developer Console)

### Webhook URL for callbacks

**Leave empty** — or paste this explanatory placeholder:

```
https://github.com/CuevazaArt/mosaico-criptografico/blob/main/XAMAN_WEBHOOK.md
```

See [XAMAN_WEBHOOK.md](XAMAN_WEBHOOK.md) for why we use polling instead of webhooks.

---

### Origin / Redirect URIs (OAuth2 / OpenID Connect)

**One per line.** These are the URLs Xaman may redirect back to after **Sign in with Xaman** (`xumm.authorize()`).

```
https://mosaico-criptografico.vercel.app
http://localhost:3000
http://localhost:3005
http://127.0.0.1:3000
```

> **Production (required):** `https://mosaico-criptografico.vercel.app`  
> **Local dev (optional):** add localhost lines only if you run `npm run dev:mainnet` locally.

Do **not** add trailing paths unless Xaman rejects bare origins — the SDK uses your site root as the return URL (same as `APP_URL` in `.env`).

---

### Legal & policy URLs

| Field | URL |
|-------|-----|
| **Homepage** | https://mosaico-criptografico.vercel.app |
| **Terms of Service** | https://github.com/CuevazaArt/mosaico-criptografico/blob/main/TERMS.md |
| **Privacy** | https://github.com/CuevazaArt/mosaico-criptografico/blob/main/LEGAL.md#12-privacy |
| **License** | https://github.com/CuevazaArt/mosaico-criptografico/blob/main/LICENSE |

---

## What are Origin / Redirect URIs?

When a user clicks **Connect with Xaman**, the [Xumm browser SDK](https://docs.xaman.dev/environments/browser-web3) runs an **OAuth2 / OpenID Connect** flow:

1. The browser redirects to `https://oauth2.xumm.app/auth`
2. The user approves in the **Xaman mobile app** (or QR on desktop)
3. Xaman redirects **back to your dApp** at a whitelisted URL
4. The SDK receives a **JWT** (valid ~24h) with the user's XRPL address

**Origin/Redirect URIs** are the allowlist of URLs Xaman is permitted to send users back to.  
If your production URL is missing, sign-in fails with a redirect / OAuth error.

Official docs: [Identity (OAuth2, OpenID)](https://docs.xaman.dev/environments/identity-oauth2-openid)

---

## How this maps to our code

| Xaman setting | Our project |
|---------------|-------------|
| **API Key** | `XUMM_API_KEY` in `.env` → `config.runtime.js` |
| **API Secret** | `XUMM_API_SECRET` → Vercel vault only |
| **Redirect / return URL** | `APP_URL` in `.env` (e.g. `https://mosaico-criptografico.vercel.app`) |
| **Payload return URL** | Set in `api/xumm/payload.js` → `return_url: { app, web }` |
| **Sign in** | `xumm.authorize()` in `src/core/xrpl.js` |
| **Transaction signing** | Payload + polling (no webhook) |

After changing `APP_URL` in production:

```bash
npm run vault:sync
npm run deploy
```

---

## Credentials checklist

- [ ] API Key = UUID from apps.xumm.dev ( **not** your `r...` wallet address)
- [ ] API Secret on one line in `.env`, synced to Vercel vault
- [ ] Origin/Redirect URIs include production URL
- [ ] Webhook left empty (see [XAMAN_WEBHOOK.md](XAMAN_WEBHOOK.md))
- [ ] `npm run xumm:validate` passes locally

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OAuth redirect error | Add exact site URL to Origin/Redirect URIs |
| Sign-in works on Vercel but not localhost | Add `http://localhost:PORT` for your dev port |
| Xaman opens but mint fails | Check `/api/xumm/payload` — run `npm run vault:sync` |
| Wrong network after sign-in | Select **Mainnet** in Comparator before connecting |

---

## Related docs

- [XAMAN_WEBHOOK.md](XAMAN_WEBHOOK.md) — Why no webhook
- [KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md) — End-user registration flow
- [DEPLOYMENT.md](DEPLOYMENT.md) — Deploy and vault sync
