# Xaman Webhook Policy — Not Used

**Project:** Cryptographic Mosaic  
**App URL:** https://mosaico-criptografico.vercel.app  
**Last updated:** July 2026

---

## Why this page exists

The [Xaman Developer Console](https://apps.xumm.dev/) has an optional **Webhook URL for callbacks** field.  
**Cryptographic Mosaic intentionally leaves this field empty** and points here for transparency.

---

## We do not use webhooks

This application **does not register a webhook endpoint** and **does not rely on server-side callback URLs** from Xumm/Xaman.

Instead, after a user opens a signing request in the Xaman app, our dApp uses **client-side polling**:

1. The browser creates a payload via `/api/xumm/payload` (Vercel serverless).
2. The user signs in Xaman (mobile / QR).
3. The browser repeatedly checks payload status: `GET /api/xumm/payload?uuid=...`
4. When `signed`, `cancelled`, or `expired` is returned, the UI updates.

Implementation: `pollXamanPayload()` in `src/core/xrpl.js`.

---

## Why polling is enough for this project

| Reason | Explanation |
|--------|-------------|
| **User is in the browser** | The demo waits for the signature while the tab is open — no backend job queue needed. |
| **Simpler architecture** | No webhook secret validation, no replay handling, no extra public endpoint to secure. |
| **Non-custodial flow** | We only need the tx hash after signing; polling the Xumm API via our serverless route is sufficient. |
| **Hackathon / demo scope** | Zero-server core; one serverless route for payload creation already covers Xaman integration. |

---

## When a webhook would be needed

Consider adding a webhook only if you later need:

- Server-side automation **after** signing (without the user's browser open)
- Database logging of all payload events
- Push notifications to your own backend
- Multi-step workflows decoupled from the frontend

That is **out of scope** for the current public demo.

---

## Testing webhooks (not applicable here)

Xumm suggests [webhook.site](https://webhook.site) for **testing** webhook integrations during development.  
**We do not use that** in this project because we do not implement webhooks at all.

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [XAMAN_DEVELOPER_SETUP.md](XAMAN_DEVELOPER_SETUP.md) | Full Xaman app configuration (OAuth URIs, legal links) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel vault, credentials, production deploy |
| [api/xumm/payload.js](api/xumm/payload.js) | Serverless payload + status polling API |

---

*Cryptographic Mosaic — Independent community project. Not affiliated with Xaman/Xumm or XRPL Foundation.*
