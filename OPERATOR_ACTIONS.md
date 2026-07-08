# Operator Actions — Xaman Trust Mitigation

**Audience:** CuevazaArt / project operator (you)  
**Technical work:** mostly automated in this repo  
**Your manual steps:** wallet, forms, emails — **cannot** be done by the AI agent

**Live checklist after deploy:**

| URL | Purpose |
|-----|---------|
| https://mosaico-criptografico.vercel.app/verify | Public on-chain verification |
| https://mosaico-criptografico.vercel.app/.well-known/xrp-ledger.toml | Bithomp domain proof |

Full issue context: [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md)

---

## Timeline — who does what

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 0 — Technical (agent / CI)          │ YOU: configure .env + deploy │
├─────────────────────────────────────────────────────────────────────────┤
│ PHASE 1 — Bithomp                         │ YOU: forms + ~9 XRP          │
├─────────────────────────────────────────────────────────────────────────┤
│ PHASE 2 — XRPL Labs / Xaman               │ YOU: emails + xApp case      │
├─────────────────────────────────────────────────────────────────────────┤
│ PHASE 3 — Follow-up                       │ YOU: reply within 7 days     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 0 — You act now (before Bithomp)

### Step 0.1 — Set project operator address in `.env`

Edit your local `.env` (never commit):

```env
XRPL_WALLET_ADDRESS=rYOUR_PROJECT_OPERATOR_ADDRESS
PROJECT_CONTACT_EMAIL=your@email.com
PROJECT_TWITTER=@YourHandle
APP_URL=https://mosaico-criptografico.vercel.app
```

This is the **service operator** wallet (treasury/dev), **not** each user’s mint address.

### Step 0.2 — Redeploy so TOML includes your account

```bash
npm run vault:sync    # if Xaman credentials changed
npm run deploy
```

Verify:

- https://mosaico-criptografico.vercel.app/.well-known/xrp-ledger.toml  
  → must show `[[ACCOUNTS]]` with your `r…` address  
- https://mosaico-criptografico.vercel.app/verify  
  → paste a minted address → **✅ Valid Mosaic Keychain**

### Step 0.3 — Set Domain on your XRPL account (wallet action)

Bithomp **verified domain** requires a **two-way link**:

1. TOML hosted at `/.well-known/xrp-ledger.toml` ✅ (after deploy)
2. Your XRPL account’s **Domain** field set to the hex encoding of your site domain

**You must sign this in Xaman / Gem / Crossmark:**

| Item | Value |
|------|--------|
| Transaction | `AccountSet` |
| Field | `Domain` |
| Value (hex) | ASCII hex of `mosaico-criptografico.vercel.app` |

Hex for `mosaico-criptografico.vercel.app`:

```
6D6F736169636F2D63726970746F6772616669636F2E76657263656C2E617070
```

Guide: https://bithomp.com/learn/verified-domain

> **When:** After Step 0.2 confirms TOML is live. **Cost:** one `AccountSet` network fee (~0.000012 XRP).

---

## PHASE 1 — Bithomp (you act — week 1)

Do these **in order**, after Phase 0 is complete.

| # | Action | Link | You need |
|---|--------|------|----------|
| 1 | Register project / service | https://bithomp.com/submit-account-information | Operator `r…` address, project URLs |
| 2 | Confirm TOML URL in form | `/.well-known/xrp-ledger.toml` | Already deployed |
| 3 | Complete domain verification | https://bithomp.com/learn/verified-domain | Domain field set (Step 0.3) |
| 4 | Register Bithomp username | https://bithomp.com/username | ~9 XRP from operator account |

**Paste into Bithomp “additional info”:** use **Email B** from [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md#email-b--bithomp-project-registration).

**When you act:** As soon as TOML shows your account and Domain is set on-chain.  
**Wait time:** Typically a few days; follow up via @bithomp if no reply in 7 days.

---

## PHASE 2 — XRPL Labs / Xaman (you act — after Bithomp submitted)

| # | Action | Channel |
|---|--------|---------|
| 1 | Send formal request | **support@xrpl-labs.com** |
| 2 | Open user false-positive case | **Xaman Support** xApp (inside Xaman) |
| 3 | Attach evidence | Screenshot of scam label + mainnet tx hash + link to `/verify?address=r…` |

**Paste:** **Email A** from [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md#email-a--xrpl-labs--xaman).

Fill in:

- `[PASTE_HASH]` — your test mint transaction
- `[PASTE_NFT_ID]` — NFTokenID from Bithomp or `/verify`
- `[your email]` — same as `PROJECT_CONTACT_EMAIL`

**When you act:** Same day or day after Bithomp submission (so you can say “Bithomp registration in progress”).

---

## PHASE 3 — Follow-up (you act)

| Trigger | Action |
|---------|--------|
| 7 days, no Bithomp reply | Polite follow-up on registration form / @bithomp |
| 7 days, no XRPL Labs reply | Resend email with `/verify` link + TOML URL |
| Xaman asks questions | Reply with GitHub repo + [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md) |

Do **not** burn test NFTs used as evidence until the case is closed.

---

## What the codebase already does (no action needed)

| Deliverable | Location |
|-------------|----------|
| `xrp-ledger.toml` generation | `scripts/generate-toml.js` → `npm run build` |
| Public verify page | `/verify` |
| Post-mint reassurance panel | Wizard Step Done |
| Help modal link | `index.html` |
| Documentation | `XAMAN_TRUST_ISSUE.md`, guides |

---

## Definition of done — you close the issue when

- [ ] TOML live with operator `[[ACCOUNTS]]`
- [ ] Domain field set on operator account
- [ ] Bithomp project registered + domain verified
- [ ] Email sent to support@xrpl-labs.com
- [ ] Xaman Support case opened
- [ ] New self-mints no longer show scam label (or official guidance received)

Update status in [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md) when resolved.

---

*Last updated: 2026-07-08*
