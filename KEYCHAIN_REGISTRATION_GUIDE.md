# Standard User Journey — Acquire & Register Your XRPL Keychain

**Audience:** End users with no technical background  
**Goal:** Go from zero to a registered Cryptographic Mosaic keychain anchored on the XRP Ledger  
**Live app:** https://mosaico-criptografico.vercel.app  
**Estimated total time:** 15–20 minutes (first time) · **Cost on Mainnet:** ~2 XRP reserve (recoverable) + minimal network fee

> **Before you start:** You must accept the [Terms of Use](TERMS.md). This is experimental software — you are solely responsible for every wallet action you approve.

---

## What you will have at the end

| Layer | What it is | Where it lives |
|-------|------------|----------------|
| **Visual keychain** | Unique 3×3 mosaic from your address | Generated in your browser (free, forever) |
| **Acoustic keychain** | 4-note melody tied to your address | Plays on demand in the app (free) |
| **On-chain anchor** | Soulbound NFT (taxon `1001`, non-transferable) | Your XRPL account on Mainnet |

The on-chain NFT is **optional** but recommended if you want public proof that *you* registered *your* address.

---

## Journey overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 0. Prepare   │ →  │ 1. Discover  │ →  │ 2. Register  │ →  │ 3. Verify &  │
│ wallet + XRP │    │ your mosaic  │    │ on XRPL      │    │ daily use    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
   ~5 min setup        ~3 min free         ~5 min Mainnet      ongoing
```

**Recommended tab order in the app:** Generator → Comparator → Field Testing (optional practice)

---

## Phase 0 — Prepare (before opening the app)

### Step 0.1 — Get an XRPL wallet

You need a wallet that can sign transactions on **XRPL Mainnet**.

| Option | Best for | Install |
|--------|----------|---------|
| **Xaman** (recommended) | Mobile users, QR signing | [xaman.app](https://xaman.app) |
| **Gem Wallet** | Desktop browser (Chrome/Brave) | [gemwallet.app](https://gemwallet.app) |
| **Crossmark** | Desktop browser alternative | [crossmark.io](https://crossmark.io) |

> The app **never** asks for your seed phrase. You approve everything inside your wallet.

### Step 0.2 — Fund your account

| Situation | Minimum XRP needed | Notes |
|-----------|-------------------|--------|
| **Account already active** with XRP | **~2 XRP free** | For NFT owner reserve + tiny fee |
| **Brand-new account** | **~12 XRP** | 10 XRP base reserve + 2 XRP NFT reserve + fee |

The **2 XRP NFT reserve is recoverable** if you later burn the NFT. The network fee (~0.000012 XRP) is not recoverable.

### Step 0.3 — Know your public address

In Xaman (or your wallet), copy your **public** address — it starts with `r` (example: `rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE`).

**Never share your secret key (seed).** Only the public address is needed for the visual tool.

### Step 0.4 — Checklist

- [ ] Wallet installed and funded  
- [ ] Public address copied  
- [ ] Stable internet + modern browser (Chrome, Brave, Firefox, Edge)  
- [ ] Ready to accept [Terms of Use](TERMS.md)

---

## Phase 1 — Discover your keychain (Generator tab)

**Time:** ~3 minutes · **Cost:** $0

### Step 1.1 — Open the demo

1. Go to **https://mosaico-criptografico.vercel.app**
2. A **Terms of Use** dialog appears.
3. Read the summary, check **"I have read and accept the Terms of Use"**, then click **Accept and continue**.

> If you decline, the app will not load. This is intentional — use is at your own risk.

### Step 1.2 — Generate your mosaic

1. The **Generator** tab opens by default.
2. In **"Address / Cryptographic Key"**, paste your XRPL public address.
3. Your **mosaic** appears on the right — a grid of colors and geometric shapes unique to that address.

### Step 1.3 — Memorize 2–3 simple cues

You do not need to memorize the whole image. Pick easy anchors, for example:

- Color family (*"mostly red and pink"*)
- Central shape (*"cyan circle inside a pentagon"*)
- Corner pattern (*"checkerboard top-right"*)

### Step 1.4 — Listen to your acoustic key (optional but recommended)

1. Click **🔊 Listen to Acoustic Key**.
2. Hear the 4-note melody — it is deterministic and unique to your address.
3. Play it twice so your ear recognizes it.

### Step 1.5 — Optional: train in the simulator

1. Open the **Field Testing** tab.
2. Click **Start Simulation**.
3. Find the correct mosaic among 6 options (5 are phishing traps).
4. Repeat until you feel confident spotting mismatches.

---

## Phase 2 — Register on XRPL (Comparator tab)

**Time:** ~5 minutes · **Cost:** ~2 XRP reserve + minimal fee on Mainnet

This phase mints a **Soulbound NFT** — an on-chain record that your address registered its mosaic identity.

### Step 2.1 — Open the Comparator

1. Click the **Comparator** tab in the header.
2. Scroll to **"First approach — Register your identity on XRPL"** (blue panel).
3. Optionally paste your address in **Address A** so you see your mosaic while registering.

### Step 2.2 — Select Mainnet

1. In **XRPL identity registry**, open the **Network** dropdown.
2. Select **Mainnet (Production)**.

> Testnet is for developers only (free fake XRP). For a real keychain anchor, use Mainnet.

### Step 2.3 — Connect with Xaman (standard path)

**Recommended flow:**

1. Click **📱 Connect with Xaman** in the first-approach panel  
   *or* ensure **Signing method / Wallet** is set to **Xaman / Xumm (Mobile QR)**.
2. Click **📱 Connect Xaman (mobile / QR)**.
3. On your phone, open the **Xaman** app.
4. Scan the QR code or approve the push notification.
5. Authorize the connection request.

**Expected result:**

- Status changes to **🟢 XRPL Connected**
- Your address appears in the **XRPL Address** field

### Step 2.4 — Alternative: Gem Wallet (desktop)

If you prefer a browser extension:

1. Install Gem Wallet from [gemwallet.app](https://gemwallet.app).
2. Click **💎 Alternative: Gem Wallet** or select **Gem Wallet** in the dropdown.
3. Click **💎 Connect Gem Wallet** and approve in the extension.

### Step 2.5 — Mint your Mosaic Key (Soulbound NFT)

1. Confirm **🛡️ Mint Mosaic Key (Soulbound NFT)** is enabled (not greyed out).
2. Click the button.
3. Your wallet opens a signing request for an **`NFTokenMint`** transaction.
4. **Review carefully:**
   - Network: **Mainnet**
   - Action: mint NFT (taxon `1001`)
   - Fee: minimal XRP
   - Reserve: ~2 XRP locked while you own the NFT
5. **Sign** in Xaman or Gem Wallet.

### Step 2.6 — Save your proof

After ~4 seconds (XRPL confirmation):

1. The **Ledger console** in the app shows a **transaction hash** (example: `ABC123...`).
2. Copy and save this hash — it is your on-chain receipt.
3. Optional: open the hash on [Bithomp](https://bithomp.com) or [xrpl.org](https://xrpl.org) to view the NFT on the explorer.

### Step 2.7 — Confirm in Xaman (trust resolved)

After mint, open the NFT in Xaman. Self-minted Mosaic Keychains should appear as normal utility NFTs — the previous scam false-positive was **resolved in 2026-07**.

| Check | Expected |
|-------|----------|
| You initiated mint in this app | Yes |
| Issuer == Owner | Your `r…` address |
| Taxon | `1001` |
| Comparator badge | **✅ Registered** |
| Public verify | https://mosaico-criptografico.vercel.app/verify |

Historical notes: **[XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md)**

---

## Phase 3 — Verify your registration

**Time:** ~1 minute · **Cost:** $0

### Step 3.1 — In-app badge

1. Stay on the **Comparator** tab.
2. Paste your address in **Address B** (copied / destination address).
3. Look at the badge next to Address B:

| Badge | Meaning |
|-------|---------|
| **✅ Registered** | Your Soulbound identity NFT was found on-chain |
| **❓ Unregistered** | No valid NFT yet — retry mint or check network/wallet |

Valid registration requires a self-issued NFT: **Issuer == Owner** for taxon `1001`.

### Step 3.2 — Visual confirmation

1. Compare **Address A** and **Address B** mosaics — they must be **identical** when addresses match.
2. The center badge should show **✅ Perfect match** (green).

### Step 3.3 — Explorer confirmation (optional)

On any XRPL explorer:

1. Search your address.
2. Open **NFTs** / **account_nfts**.
3. Find an NFT with **taxon `1001`** where you are both issuer and owner.

---

## Phase 4 — Standard daily use (after registration)

Once your keychain exists, use this **10-second protocol** before every outbound payment:

```
  TRUSTED          COMPARE           DECIDE
  address    →     mosaics A & B  →   match?
  memorized        side by side       YES → sign in wallet
                                      NO  → STOP (phishing?)
```

### Daily steps

1. Open **Comparator**.
2. **Address A** — the address you trust (from your saved contact or official site).
3. **Address B** — the address you just copied from an email, chat, or wallet UI.
4. If mosaics differ → **do not sign**.
5. Optionally play **🔊 Listen to Key A** and **🔊 Listen to Key B** — melodies must match.
6. Only then confirm the transaction in Xaman / Gem / Crossmark.

---

## Quick reference — Standard vs alternative paths

| Step | Standard (recommended) | Alternative |
|------|------------------------|-------------|
| Wallet | Xaman (mobile + QR) | Gem Wallet or Crossmark (browser) |
| Network | Mainnet | Testnet (practice only, no real anchor) |
| Register | Mint Soulbound NFT in Comparator | Skip NFT — visual keychain only (free) |
| Proof | Tx hash + ✅ Registered badge | Mosaic comparison only |

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Terms modal won't go away | Check the acceptance box, then **Accept and continue** |
| **Connect Xaman** does nothing | Ensure Xaman app is installed; allow pop-ups; try refreshing |
| Mint button disabled | Connect wallet first; confirm Mainnet and sufficient XRP (~2 free) |
| `tecINSUFFICIENT_RESERVE` | Add more XRP to your account |
| Badge stays **❓ Unregistered** | Wait a few seconds; confirm Mainnet; paste exact same address in B |
| Xaman labels NFT **scam / suspicious** after you minted | Rare after 2026-07 fix — verify at `/verify`; see [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md) |
| Mosaics look different for "same" address | One character is different — **stop**, this may be phishing |
| GitHub Pages version | Visual demo only — use **Vercel** URL for Mainnet minting |

---

## Cost summary (Mainnet)

| Item | Approx. cost | Recoverable? |
|------|--------------|--------------|
| Generator + Comparator + Simulator | **Free** | — |
| `NFTokenMint` network fee | ~0.000012 XRP | No |
| NFT owner reserve | 2 XRP | **Yes** (if NFT burned) |
| New account base reserve | 10 XRP | **Yes** (account rules) |

---

## What you should never do

- **Never** paste your seed phrase or secret key into the website.
- **Never** sign a transaction if the mosaic or address does not match what you expect.
- **Never** assume the NFT alone proves a *third party* is trustworthy — it only proves *they* registered *their* address.
- **Never** skip wallet review — the app prepares payloads; **you** approve in your wallet.

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [USER_GUIDE.md](USER_GUIDE.md) | Full user guide (FAQ, extension, costs) |
| [MANUAL.md](MANUAL.md) | 3-step verification protocol |
| [TERMS.md](TERMS.md) | Terms of Use (required acceptance) |
| [LEGAL.md](LEGAL.md) | Disclaimers and liability limits |
| [NARRATIVE.md](NARRATIVE.md) | Simple keychain analogy |
| [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md) | Historical Xaman false-positive — **RESOLVED** |

---

## One-page cheat sheet

```
PREPARE     → Wallet + ~2 XRP + public address (r...)
DISCOVER    → Generator → paste address → memorize mosaic + melody
REGISTER    → Comparator → Mainnet → Connect Xaman → Mint Soulbound NFT
VERIFY      → ✅ Registered badge + save tx hash
DAILY USE   → Comparator A vs B → match? → sign in wallet
```

*Cryptographic Mosaic — Your visual keychain for the XRP Ledger. Verify with your eyes, not 34 characters.*
