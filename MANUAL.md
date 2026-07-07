# User Manual and Verification Protocol

> **New user?** Start with the standard journey: **[KEYCHAIN_REGISTRATION_GUIDE.md](KEYCHAIN_REGISTRATION_GUIDE.md)**  
> Or the full guide: **[USER_GUIDE.md](USER_GUIDE.md)** — what you need, costs, daily usage, and on-chain registration from scratch.

**Live demo:** https://mosaico-criptografico.vercel.app

This document covers the technical interface and the 3-step verification protocol for XRPL addresses.

---

## 1. Interface overview

Three tabs in the header:

| Tab | Purpose |
|-----|---------|
| **Generator** | Inspect how any address becomes a mosaic |
| **Comparator** | Side-by-side verification + XRPL NFT registry |
| **Field Testing** | Phishing simulator with reaction-time metrics |

### Generator

1. Paste an XRPL address (starts with `r`) or use 🎲 for a random sample.
2. **Chroma Mode:** Harmonious (daily use) or Chaotic (max entropy).
3. **Grid Size:** 3×3 (default), 4×4, or 5×5.
4. **🔊 Listen to Acoustic Key** — plays the 4-note signature.

### Comparator

1. **Address A** — trusted / expected destination.
2. **Address B** — pasted from clipboard or wallet UI.
3. Badges: ✅ match · ⚠️ phishing detected · ❓ no on-chain NFT.
4. XRPL panel below — connect wallet and mint Soulbound identity NFT.

### Field Testing

1. Choose grid size and chroma mode.
2. **Start Simulation** — find the correct mosaic among 6 options.
3. Right panel tracks success rate, reaction time, and streaks.

---

## 2. Three-step verification protocol

```
[ STEP 1: Generate ] ──► [ STEP 2: Compare ] ──► [ STEP 3: Confirm ]
   Paste trusted addr       Side-by-side mosaics     Audio + anchors OK?
```

### Step 1 — Secure copy

Copy the recipient address from a **trusted source** (official site, address book). Paste into Generator and memorize 2–3 visual cues (color family, anchor position, pattern shape).

### Step 2 — Layout comparison

Before signing in your wallet, paste both addresses into Comparator. If mosaics differ in color, cell layout, or anchor shape → **abort the transaction**.

### Step 3 — Anchor and audio check

1. Count vertices on the central anchor glyph (e.g., 5-pointed star).
2. Optionally play acoustic keys A and B — melodies must match.
3. If all checks pass → sign in your wallet.

---

## 3. Cost reference (XRPL Mainnet)

| Action | Cost |
|--------|------|
| Generator / Comparator / Simulator | **Free** |
| `NFTokenMint` network fee | ~0.000012 XRP |
| NFT owner reserve | 2 XRP (recoverable) |
| New account activation | 10 XRP base reserve (recoverable) |

See [USER_GUIDE.md](USER_GUIDE.md) for a full cost breakdown.

---

## 4. Related documentation

| Document | Audience |
|----------|----------|
| [USER_GUIDE.md](USER_GUIDE.md) | New users (step-by-step) |
| [NARRATIVE.md](NARRATIVE.md) | Keychain analogy + technical pipeline |
| [SECURITY.md](SECURITY.md) | Entropy model and credential policy |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Mainnet deploy and hackathon pitch |
| [LEGAL.md](LEGAL.md) | Permissions, disclaimers, and liability limits |

---

## Legal notice

**Acceptance of [TERMS.md](TERMS.md) is required** to use the web demo. This tool does **not** hold your keys or guarantee transaction safety. Use and application are **your sole responsibility**. Full terms: [TERMS.md](TERMS.md) · [LEGAL.md](LEGAL.md).
