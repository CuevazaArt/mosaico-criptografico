# User Guide — Cryptographic Mosaic (XRPL)

**Live demo:** https://mosaico-criptografico.vercel.app

This guide is for someone who has **never used the tool before**. No programming knowledge required.

> **Want the full standard journey in one document?** See **[KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md)** — prepare wallet → discover mosaic → register on XRPL → daily use.

---

## What is this in one sentence?

Your XRPL address (for example `rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE`) is impossible to memorize. **Cryptographic Mosaic** turns it into a **unique drawing of colors and shapes** — like a visual keychain. If someone tricks you with a similar-looking address, the drawing changes completely and you notice instantly.

---

## What do you need?

### To use the visual tool (free)

| Requirement | Required? |
|-----------|---------------|
| Modern browser (Chrome, Brave, Firefox, Edge) | Yes |
| Internet connection | Yes |
| XRPL account or address to verify | Yes (public address only — never your secret key) |
| Install anything on your PC | No |

### To register your identity on the blockchain (optional)

| Requirement | Required? |
|-----------|---------------|
| XRPL wallet with funds | Yes |
| **Gem Wallet** or **Crossmark** browser extension (desktop), or **Xaman** app (mobile) | Yes |
| Minimum balance on Mainnet | See [How much does it cost?](#how-much-does-it-cost) |

> **Important:** The app **never** asks for your secret key (seed). You sign everything from your own wallet.

---

## How much does it cost?

### Using the generator and comparator — **$0**

View mosaics, compare addresses, listen to the acoustic signature, and practice with the phishing simulator: **completely free**. Everything runs in your browser; there is no subscription or paid server.

### Registering your mosaic on XRPL (identity NFT mint)

If you want **immutable on-chain proof** that your address has an official mosaic, you mint a Soulbound NFT (non-transferable) on Mainnet:

| Item | Approximate cost | Recoverable |
|----------|------------------|-------------|
| Network fee (`NFTokenMint`) | ~0.000012 XRP | No (burned) |
| Reserve for owning the NFT | 2 XRP | **Yes** — if you burn the NFT, you recover the reserve |
| New unactivated account | 10 XRP base reserve | **Yes** — minimum for your XRPL account |

**Real examples:**

- **You already have an active account with XRP:** you need at least **~2 XRP free** for the NFT + minimal fee.
- **New account:** you need **~12 XRP** (10 activation + 2 for NFT) plus the fee.

On Testnet (developer sandbox) the faucet gives fake XRP — **no real cost**.

---

## What do you end up with?

Using the full tool gives you three things:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. VISUAL KEYCHAIN    →  Unique pattern you memorize in 5 s   │
│  2. ACOUSTIC KEYCHAIN  →  4-note melody unique to your address │
│  3. XRPL ANCHOR        →  Soulbound NFT proving identity       │
│     (optional)            (taxon 1001, only you can issue it)  │
└─────────────────────────────────────────────────────────────────┘
```

| Result | Where it lives | What it's for |
|-----------|-------------|----------------|
| Mosaic SVG | On screen (deterministic) | Compare before sending XRP |
| Acoustic signature | Plays when you press 🔊 | Extra verification without looking |
| Identity NFT | On the XRP Ledger (on-chain) | Anyone can verify **you** registered **your** address |

---

## Step by step — First time (meet your mosaic)

**Estimated time: 2 minutes · Cost: $0**

### Step 1 — Open the app

1. Go to https://mosaico-criptografico.vercel.app
2. The **Generator** tab is active by default.

### Step 2 — Paste your XRPL address

1. In **"Address / Cryptographic Key"**, paste your public address (starts with `r`).
2. Your **mosaic** appears instantly on the right: a grid of colors and geometric shapes.

### Step 3 — Memorize something simple

You don't need to remember the whole drawing. Just notice **2 or 3 details**, for example:

- *"The tones are blue-green"*
- *"The star is top-right"*
- *"There are curved tubes at the bottom"*

### Step 4 — Listen to your signature (optional)

1. Press **🔊 Listen to Acoustic Key**.
2. You'll hear 4 short notes. That melody is unique to your address.

### Step 5 — Practice (recommended)

1. Go to the **Field Testing** tab (simulator).
2. Press **Start Simulation**.
3. Try to find the correct mosaic among 6 options (5 are phishing traps).
4. Repeat 3 times to measure your reaction speed.

---

## Step by step — Register your identity on XRPL (optional)

**Estimated time: 3–5 minutes · Cost: ~2 XRP on Mainnet**

This creates a Soulbound NFT that tells the world: *"this address registered its official mosaic"*.

### Step 1 — Go to the comparator

1. Open the **Comparator** tab.
2. Scroll to **"Immutable Identity Registry on XRPL"**.

### Step 2 — Configure network and wallet

1. Under **Network**, select **Mainnet (Production)**.
2. **Recommended:** press **📱 Connect with Xaman** in the "First approach" panel (or select Xaman in the dropdown).
3. **Alternative:** press **💎 Gem Wallet** if you prefer a browser extension (Chrome/Brave).

### Step 3 — Connect your wallet

**With Xaman (recommended):**
1. Press **📱 Connect with Xaman** or **Connect Xaman (mobile / QR)**.
2. Authorize in the Xaman app on your phone.
3. Your address appears in **XRPL Address** and the indicator changes to **🟢 XRPL Connected**.

**With Gem Wallet (alternative):**
1. Install the extension from [gemwallet.app](https://gemwallet.app).
2. Press **💎 Connect Gem Wallet** and accept the connection.

### Step 4 — Mint your identity NFT

1. Press **🛡️ Mint Mosaic Key (Soulbound NFT)**.
2. Your wallet will ask you to **sign** the `NFTokenMint` transaction.
3. Confirm the minimal fee.
4. The console shows the **transaction hash** — save it as proof.

### Step 5 — Verify registration

1. If the comparator address has a registered NFT, the badge changes to **✅ Registered**.
2. You can look up your hash on any XRPL explorer (Bithomp, xrpl.org).

> **Why is it safe?** Only an NFT whose issuer (`Issuer`) is the same address as the owner (`Owner`) is valid. No one can forge another user's mosaic.

---

## Step by step — Daily use before sending XRP

**Estimated time: 10 seconds · Cost: $0**

Repeat this protocol **every time** you send funds:

```
  COPY            COMPARE            DECIDE
  trusted     →   mosaics A & B  →   same?
  address         side by side        YES → sign
                                      NO → STOP
```

### Step 1 — Save the trusted mosaic

When you save a trusted address (exchange, friend, contract), open it in the **Generator** and memorize its visual pattern.

### Step 2 — Before signing in your wallet

1. Open the **Comparator** tab.
2. Paste the **expected** address in **Address A** (the one you memorized).
3. Paste the **address you will send to** in **Address B** (the one you just copied).

### Step 3 — Read the result

| Badge | Meaning | Action |
|-------|-------------|--------|
| ✅ Perfect | Identical addresses, matching mosaics | You may sign |
| ⚠️ Phishing | Addresses differ | **Do not sign** — check for malware or error |
| ❓ Unregistered | Address B has no on-chain NFT | Normal if recipient didn't mint; trust the visual mosaic |

### Step 4 — Acoustic double-check (optional)

1. Press **🔊 Listen to Key A** then **🔊 Listen to Key B**.
2. If the melodies sound different → **stop**.

### Step 5 — Sign in your wallet

Only if the mosaic and (optionally) audio match, confirm the transaction in Gem, Crossmark, or Xaman.

---

## Browser extension (automatic use)

When visiting XRPL explorers (Bithomp, xrpl.org), install the extension to see mini-mosaics **next to each address** without opening the dApp:

1. In Chrome: `chrome://extensions` → Developer mode → **Load unpacked**
2. Select the `extension` folder from the repository
3. Browse an XRPL explorer — mosaics appear automatically

---

## Frequently asked questions

### Can I use it without minting the NFT?

**Yes.** The generator and comparator work without any on-chain transaction. The NFT is optional and serves as public proof of identity.

### What happens if I change a single character of the address?

The mosaic **changes completely**: colors, shape positions, and melody. That's what detects phishing.

### Does the tool store my keys?

**No.** Never. All visual processing happens in your browser. Only your wallet performs signatures.

### Does it work with Ethereum or other networks?

The generator accepts any text or address. On-chain registration (NFT) is **XRPL-specific**.

### Can I transfer my identity NFT to someone else?

**No.** It's Soulbound (non-transferable). It's tied to your address forever.

### How long does minting take on Mainnet?

XRPL confirms in ~4 seconds. You'll see the hash in the dApp console.

### Xaman says my NFT is a scam or suspicious — did something go wrong?

**Often no.** This is a [known false positive](XAMAN_TRUST_ISSUE.md) when wallets flag self-minted utility NFTs from domains that are not yet safelisted.

Your mint is probably legitimate if **you** signed it in our app, taxon is `1001`, **Issuer == Owner** (your address), and the Comparator shows **✅ Registered**. Verify the transaction on [Bithomp](https://bithomp.com) or [xrpl.org](https://xrpl.org).

See **[XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md)** for the full checklist and what the project team is doing until Xaman fixes it.

---

## Quick summary

| Question | Answer |
|----------|-----------|
| **What do I need?** | Browser + XRPL address. For NFT: wallet with ~2 XRP free. |
| **How do I use it?** | Paste address → memorize mosaic → compare before each send. |
| **What do I get?** | A unique visual pattern (and optionally on-chain NFT) for your address. |
| **How much does it cost?** | Visual use: **free**. NFT on Mainnet: **~2 XRP** reserve (recoverable) + minimal fee. |
| **Daily workflow?** | Comparator → Address A vs B → if drawings match, sign; if not, stop. |

---

## Help and additional documentation

| Resource | Link |
|---------|--------|
| **Standard registration journey** | [KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md) |
| Full demo (Mainnet + NFT) | https://mosaico-criptografico.vercel.app |
| Visual demo (GitHub Pages) | https://cuevazaart.github.io/mosaico-criptografico/ |
| In-app guide | **❓ Help** button inside the tool |
| Technical manual | [MANUAL.md](MANUAL.md) |
| Simple + technical narrative | [NARRATIVE.md](NARRATIVE.md) |
| Security and credentials | [SECURITY.md](SECURITY.md) |
| Xaman scam warning after mint | [XAMAN_TRUST_ISSUE.md](XAMAN_TRUST_ISSUE.md) |
| Developer deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Legal & disclaimer** | [LEGAL.md](LEGAL.md) |
| **Terms of Use (required)** | [TERMS.md](TERMS.md) |
| Open-source license | [LICENSE](LICENSE) |

---

## Legal notice

**You must accept the [Terms of Use](TERMS.md) before using the web demo.** Cryptographic Mosaic is **experimental, non-custodial software** provided **"AS IS"** without warranty. Visual mosaics are a **helper tool**, not a guarantee against phishing or fund loss. **You alone** are responsible for how you use this tool and for every transaction you sign in your wallet. See [TERMS.md](TERMS.md) and [LEGAL.md](LEGAL.md).

*Cryptographic Mosaic — Your visual keychain for the XRP Ledger. Verify with your eyes, not 34 characters.*
