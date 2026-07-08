# Known Issue — Xaman “Scam” / Suspicious NFT Warning After Self-Mint

| Field | Value |
|-------|--------|
| **Status** | `OPEN` — under active mitigation; no definitive wallet fix yet |
| **First reported** | 2026-07 |
| **Affects** | Users who mint their own Mosaic Keychain NFT via Xaman on Mainnet |
| **Severity** | UX / trust (not a loss of funds or protocol bug) |
| **Owner** | CuevazaArt (Cryptographic Mosaic) |
| **Tracking** | This document + GitHub Issues label `xaman-trust` |

**Live app:** https://mosaico-criptografico.vercel.app  
**Repository:** https://github.com/CuevazaArt/mosaico-criptografico

---

## Summary

After a user **successfully self-mints** their Mosaic Keychain Soulbound NFT through our guided wizard and Xaman signing, Xaman may still label the NFT as **suspicious**, **scam-like**, or similar in the wallet UI.

This is a **false positive** for our product model:

- The user **initiated** the mint seconds earlier in Cryptographic Mosaic.
- The NFT is **self-issued** (`Issuer == Owner`).
- It is **non-transferable** utility identity (taxon `1001`), **not** an unsolicited airdrop or “beta pass”.

Until XRPL Labs / Xaman safelist our metadata domain and/or recognize the self-mint utility pattern, users and operators should follow the guidance below.

---

## Symptoms

| What you see | When |
|--------------|------|
| Warning banner or “scam” / suspicious label on the new NFT | Immediately after mint, in Xaman NFT view |
| NFT still visible on explorers (Bithomp, xrpl.org) | Usually yes — on-chain mint succeeded |
| App shows **✅ Registered** in Comparator | Yes, if `account_nfts` finds taxon `1001` with `Issuer == Owner` |
| Transaction hash in wizard **Step Done** | Present when mint completed |

**If the mint failed** (no tx hash, badge stays **❓ Unregistered**), this document does **not** apply — troubleshoot connection, reserve, and signing instead ([KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md#troubleshooting)).

---

## Root cause (technical)

Xaman applies **heuristic anti-scam filters** against common NFT phishing patterns:

- Unsolicited inbound “pass” / airdrop NFTs
- Unknown issuers and unknown metadata domains
- Taxons associated with scam campaigns

Cryptographic Mosaic uses:

| Property | Value |
|----------|--------|
| Transaction | `NFTokenMint` (XLS-20) |
| `NFTokenTaxon` | `1001` |
| Transfer | Non-transferable (`Flags: 0`) |
| Issuer rule | **Issuer MUST equal Owner** (per-user self-mint) |
| Metadata URI | `https://mosaico-criptografico.vercel.app/api/nft/{rAddress}` |
| Image | `…/api/nft/{rAddress}/image` (PNG) |
| Audio | `…/api/nft/{rAddress}/audio` (WAV) |

Each user mints **their own** NFT on **their own** account. There is no single collection issuer to whitelist globally — mitigation requires **domain safelisting** and **protocol-pattern recognition** by the wallet team.

This is **not** evidence that Cryptographic Mosaic is malicious. It is a **wallet UX heuristic** conflicting with a legitimate self-mint utility flow.

See also: [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md), [SECURITY.md](SECURITY.md).

---

## What end users should do (until fixed)

### 1. Confirm you minted it yourself

You are safe to **ignore the scary label** only if **all** of these are true:

- [ ] You opened https://mosaico-criptografico.vercel.app and used **Mint Mosaic Key**
- [ ] You **signed** the `NFTokenMint` in Xaman (you were not sent an unexpected inbound NFT)
- [ ] **Issuer** and **Owner** on the NFT are **your** `r…` address
- [ ] Taxon is **`1001`**
- [ ] The app Comparator shows **✅ Registered** for your address

### 2. Verify on an independent explorer

1. Copy your transaction hash from the app (Step Done / ledger console).
2. Open [Bithomp](https://bithomp.com) or [xrpl.org](https://xrpl.org) and search the hash or your address.
3. Under **NFTs**, confirm taxon `1001`, issuer = owner = your address.

### 3. Do not panic-delete unless you intend to burn

Burning recovers the ~2 XRP NFT reserve but removes your on-chain anchor. The warning alone does **not** mean your account is compromised.

### 4. Optional: use Gem Wallet or Crossmark on desktop

The false positive is reported primarily in **Xaman**. Desktop wallets may display the NFT without the same label (behavior can change).

### 5. Report your experience (helps the fix)

Open a GitHub issue with label context `xaman-trust`:

https://github.com/CuevazaArt/mosaico-criptografico/issues/new

Include: your **tx hash** (not your seed), screenshot of the Xaman warning, and date.

---

## What operators / maintainers should do

### Mitigation roadmap (recommended order)

```
Phase 0 — Prepare (1–3 days)
    ├── Publish /.well-known/xrp-ledger.toml on production domain
    ├── Public /verify page explaining self-mint pattern
    └── Stable metadata JSON + PNG image endpoints

Phase 1 — Bithomp (week 1)
    ├── Register project / service
    ├── Verify domain (two-way link)
    └── Register Bithomp username for project operator account

Phase 2 — XRPL Labs / Xaman (week 1–2, after Phase 1)
    ├── Email support@xrpl-labs.com (formal package)
    └── Open case via Xaman Support xApp (user false-positive report)

Phase 3 — Follow-up
    └── Polite public follow-up on @XamanWallet only after formal contact
```

**Do not** contact Xaman before Bithomp + domain transparency are in place — reviewers ask for proof you operate the service.

### Phase 0 — Prerequisites

| Item | URL / path |
|------|------------|
| Production domain | `mosaico-criptografico.vercel.app` |
| `xrp-ledger.toml` | `https://mosaico-criptografico.vercel.app/.well-known/xrp-ledger.toml` |
| Verify page | `https://mosaico-criptografico.vercel.app/verify` |
| Operator checklist | [OPERATOR_ACTIONS.md](OPERATOR_ACTIONS.md) |
| Domain verification guide | https://bithomp.com/learn/verified-domain |
| User guide | [USER_GUIDE.md](USER_GUIDE.md) |
| XLS draft | [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md) |

`[[ACCOUNTS]]` in TOML should list the **project operator** XRPL account (service identity), not every end-user wallet.

### Phase 1 — Bithomp registration

| Step | Action | Link |
|------|--------|------|
| 1 | Submit project / service registration | https://bithomp.com/submit-account-information |
| 2 | Publish `xrp-ledger.toml` on production domain | https://bithomp.com/learn/verified-domain |
| 3 | Complete domain verification from project account | Same guide |
| 4 | Register Bithomp username (e.g. `mosaickeychain`) | https://bithomp.com/username |
| 5 | (Optional) API key for explorer integrations | https://docs.bithomp.com |

**Note:** Bithomp registers the **service operator**, not each user’s self-minted NFT. It improves explorer trust and supports wallet data providers.

### Phase 2 — XRPL Labs / Xaman

There is **no public NFT allowlist form**. Use:

| Channel | Purpose |
|---------|---------|
| **support@xrpl-labs.com** | Formal technical review request |
| **Xaman Support** xApp (inside Xaman) | False-positive case with screenshots + tx hash |
| **@XamanWallet** (X) | Follow-up only — does not replace support email |

**Request specifically:**

1. Safelist / review metadata domain `mosaico-criptografico.vercel.app`
2. Recognize taxon `1001` + `Issuer == Owner` as legitimate **utility identity**, not airdrop pass
3. Guidance to reduce false positives for **user-initiated** self-mints via our app

---

## Email templates (English)

Copy, fill `[brackets]`, attach one example mainnet tx hash + screenshot.

### Email A — XRPL Labs / Xaman

**To:** support@xrpl-labs.com  
**Subject:** Request: whitelist / false-positive review — Cryptographic Mosaic Keychain (self-issued utility NFT, taxon 1001)

<details>
<summary>Full email body (click to expand in GitHub)</summary>

```
Dear XRPL Labs / Xaman team,

I am writing on behalf of Cryptographic Mosaic (Mosaic Keychain), an open-source
XRPL utility that helps users verify addresses through deterministic visual and
acoustic identifiers, anchored on-chain via self-minted Soulbound NFTs.

We are seeing a critical UX problem: users who successfully mint their own
keychain in Xaman immediately see the NFT flagged as suspicious/scam-like.
For our product, this is antithetical to the trust model — the user minted
the NFT themselves seconds earlier through our guided flow.

────────────────────────────────────────────────────────────
PROJECT OVERVIEW
────────────────────────────────────────────────────────────

Name:          Cryptographic Mosaic — Mosaic Keychain
Purpose:       Anti-phishing sensory 2FA for XRPL public addresses
Live app:      https://mosaico-criptografico.vercel.app
Source code:   https://github.com/CuevazaArt/mosaico-criptografico
User guide:    https://github.com/CuevazaArt/mosaico-criptografico/blob/main/USER_GUIDE.md
This issue:    https://github.com/CuevazaArt/mosaico-criptografico/blob/main/XAMAN_TRUST_ISSUE.md
XLS draft:     https://github.com/CuevazaArt/mosaico-criptografico/blob/main/XLS_PROPOSAL_DRAFT.md
License:       MIT (CuevazaArt)

────────────────────────────────────────────────────────────
ON-CHAIN IDENTITY MODEL (NOT AN AIRDROP / PASS)
────────────────────────────────────────────────────────────

Transaction:   NFTokenMint (XLS-20)
NFTokenTaxon:    1001
Transfer:        Non-transferable (Flags: 0, soulbound-style)
Issuer rule:     Issuer MUST equal Owner (self-issued only)

Metadata URI pattern:
  https://mosaico-criptografico.vercel.app/api/nft/{rAddress}

Metadata endpoints:
  JSON:   /api/nft/{rAddress}
  Image:  /api/nft/{rAddress}/image   (PNG 512×512)
  Audio:  /api/nft/{rAddress}/audio   (deterministic WAV)

────────────────────────────────────────────────────────────
WHAT WE ARE REQUESTING
────────────────────────────────────────────────────────────

1. Review and whitelist (or safelist) our metadata domain:
     mosaico-criptografico.vercel.app

2. Review taxon 1001 + self-issued pattern (Issuer == Owner) as a
   legitimate utility identity convention.

3. Guidance on reducing false-positive labels for user-initiated self-mints.

Example mint tx hash: [PASTE_HASH]
Example NFTokenID:     [PASTE_NFT_ID]

We are NOT affiliated with Xaman or XRPL Labs.

Thank you,
[Your name]
CuevazaArt — Cryptographic Mosaic
[your email]
```

</details>

### Email B — Bithomp project registration

**To:** via https://bithomp.com/submit-account-information (paste in additional info)  
**Subject:** Project registration — Cryptographic Mosaic Keychain (XRPL utility, taxon 1001)

<details>
<summary>Full email body (click to expand in GitHub)</summary>

```
Dear Bithomp team,

I would like to register Cryptographic Mosaic (Mosaic Keychain) as a
public XRPL service/project on Bithomp Explorer and API surfaces.

Service name:     Cryptographic Mosaic — Mosaic Keychain
Type:             Open-source XRPL utility (dApp + NPM package)
Operator:         CuevazaArt
Website:          https://mosaico-criptografico.vercel.app
GitHub:           https://github.com/CuevazaArt/mosaico-criptografico
Trust issue doc:  https://github.com/CuevazaArt/mosaico-criptografico/blob/main/XAMAN_TRUST_ISSUE.md

Project XRPL account: [rYOUR_PROJECT_ADDRESS]

Each user mints a self-issued Soulbound NFT (taxon 1001, Issuer == Owner).
This is NOT an airdrop, pass, or third-party mint.

We are completing:
  1. xrp-ledger.toml at /.well-known/xrp-ledger.toml
  2. Domain verification per your guide
  3. Bithomp username for the project account

Thank you,
[Your name]
[your email]
```

</details>

---

## Definition of done (issue closed)

Mark this issue **resolved** when **all** applicable items are met:

- [ ] Xaman no longer shows scam/suspicious label for **new** self-mints via our app (or official guidance published)
- [ ] Metadata domain `mosaico-criptografico.vercel.app` safelisted or equivalent documented exception
- [ ] Bithomp project registered + domain verified
- [ ] `xrp-ledger.toml` live on production
- [ ] User-facing docs updated ([USER_GUIDE.md](USER_GUIDE.md), [KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md))
- [ ] In-app post-mint reassurance panel shipped (optional UX enhancement)

**Operator manual steps:** [OPERATOR_ACTIONS.md](OPERATOR_ACTIONS.md)

Update the **Status** field at the top of this file when closing.

---

## Related documentation

| Document | Role |
|----------|------|
| [KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md) | End-user journey + troubleshooting |
| [USER_GUIDE.md](USER_GUIDE.md) | FAQ and daily use |
| [XAMAN_DEVELOPER_SETUP.md](XAMAN_DEVELOPER_SETUP.md) | OAuth / redirect URIs for our Xaman app |
| [XAMAN_WEBHOOK.md](XAMAN_WEBHOOK.md) | Why we do not use webhooks |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Operator deploy + troubleshooting index |
| [TERMS.md](TERMS.md) | No official Xaman endorsement |

---

*Last updated: 2026-07-08 — CuevazaArt / Cryptographic Mosaic*
