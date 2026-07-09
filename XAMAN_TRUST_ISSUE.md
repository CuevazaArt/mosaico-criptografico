# Known Issue — Xaman “Scam” / Suspicious NFT Warning After Self-Mint

| Field | Value |
|-------|--------|
| **Status** | `RESOLVED` — false positive cleared for project domain / self-mint flow (2026-07) |
| **First reported** | 2026-07 |
| **Resolved** | 2026-07-09 |
| **Affects** | Historical: users who minted Mosaic Keychain via Xaman before safelisting |
| **Severity** | Was UX / trust (not a loss of funds) — **no longer expected on new mints** |
| **Owner** | CuevazaArt (Cryptographic Mosaic) |

**Live app:** https://mosaico-criptografico.vercel.app  
**Repository:** https://github.com/CuevazaArt/mosaico-criptografico  
**Verify:** https://mosaico-criptografico.vercel.app/verify

---

## Summary

Xaman previously applied anti-scam heuristics that could label a **self-minted** Mosaic Keychain NFT (taxon `1001`, `Issuer == Owner`) as suspicious after a successful mint from Cryptographic Mosaic.

**As of 2026-07-09 this false positive is resolved** for the project’s production domain and mint flow. New self-mints through [mosaico-criptografico.vercel.app](https://mosaico-criptografico.vercel.app) should appear as normal utility NFTs in Xaman.

If you still see a warning on an **old** NFT minted before resolution, re-check on-chain via `/verify` — the mint itself was always valid when Issuer = Owner and taxon = `1001`.

---

## What was going on (historical)

Xaman heuristics target unsolicited airdrops and unknown metadata domains. Our model is the opposite:

| Property | Value |
|----------|--------|
| Transaction | `NFTokenMint` (XLS-20) |
| `NFTokenTaxon` | `1001` |
| Issuer rule | **Issuer MUST equal Owner** |
| Metadata | `https://mosaico-criptografico.vercel.app/api/nft/{rAddress}` |

Mitigation completed: domain TOML + Bithomp registration + XRPL Labs / Xaman outreach → wallet no longer flags the self-mint pattern as scam for this project.

---

## If you still see a warning

1. Confirm you minted at https://mosaico-criptografico.vercel.app (you signed `NFTokenMint`).
2. Open https://mosaico-criptografico.vercel.app/verify?address=YOUR_r… → expect **✅ Valid Mosaic Keychain**.
3. Confirm Issuer = Owner = your address and taxon `1001` on Bithomp / xrpl.org.
4. If `/verify` is valid but Xaman still warns, open a [GitHub issue](https://github.com/CuevazaArt/mosaico-criptografico/issues) with screenshots + tx hash.

---

## Operator checklist (closed)

See [OPERATOR_ACTIONS.md](OPERATOR_ACTIONS.md) — definition of done marked complete.

---

## Related

- [SECURITY.md](SECURITY.md)
- [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md)
- [KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md)

*Last updated: 2026-07-09*
