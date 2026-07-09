# Adoption Campaign Plan — Cryptographic Mosaic

**Goal:** Turn a polished Mainnet demo into measurable XRPL traction for Make Waves (Jun–Sep 2026).  
**Product version:** 3.9.0 · **Live:** https://mosaico-criptografico.vercel.app

---

## North-star metrics

| Metric | 30 days | 60 days | 90 days |
|--------|---------|---------|---------|
| Self-minted Mosaic Keychains (taxon 1001) | **50** | **150** | **400** |
| `/verify` checks (approx.) | 100 | 400 | 1,000 |
| Wallet / integrator conversations | 3 | 6 | 10 |
| Public mentions (Twitter/X, Discord, Reddit) | 10 | 25 | 50 |

Track mints via Bithomp / explorer filters on taxon `1001` + self-issued pattern, or a simple public counter later.

---

## Week 0 — Launch readiness (done / do now)

- [x] Xaman scam false-positive **RESOLVED**
- [x] Semi-anchored layout (v3.9.0)
- [x] Demo video with English subtitles + audio
- [x] `/verify` + TOML + operator Domain
- [ ] Submit Make Waves form ([hackathons.xrpl-commons.org](https://hackathons.xrpl-commons.org/))
- [ ] Capture 4 screenshots: Comparator mismatch, Generator, mint success, `/verify` valid
- [ ] Pin tweet + Discord one-pager linking demo + video

---

## Where to diffuse — priority channels

Copy-paste posts and banners: **[SOCIAL_KIT.md](SOCIAL_KIT.md)** · **[assets/banners/](assets/banners/)**

### Tier A — do this week (highest ROI for Make Waves)

| Channel | Why | Action |
|---------|-----|--------|
| **Make Waves form** | Official judging entry | Paste [SUBMISSION_DRAFT.md](SUBMISSION_DRAFT.md) + upload MP4 |
| **XRPL Commons Discord / hackathon channels** | Judges + mentors hang out here | Post Discord blurb from SOCIAL_KIT |
| **X (Twitter)** `@` XRPL / Commons / Xaman circles | Fast awareness | Pin launch tweet + header banner |
| **10 seeded Mainnet mints** | Traction metric | Friends / operators with real wallets |

### Tier B — high value (weeks 1–4)

| Channel | Why | Action |
|---------|-----|--------|
| **r/Ripple, r/XRP, r/crypto** (careful: no spam)** | XRPL users who fear phishing | One thoughtful post + demo link |
| **XRPL Dev Discord / Telegram** | Builders | Ask for Comparator feedback |
| **Dev.to / Hashnode article** | SEO + shareable long-form | “Why XRPL needs sensory address 2FA” |
| **Xaman / Gem / Crossmark DMs or Discord** | Integration path | Integrator DM from SOCIAL_KIT |
| **Spanish LATAM Discords / Telegram** (crypto MX, AR, CO) | Your language advantage | Narrativa ES from SOCIAL_KIT |
| **Bithomp / xrpscan communities** | Explorer users | Extension CTA |

### Tier C — stretch (after 20+ mints)

| Channel | Why |
|---------|-----|
| **Aquarium / XRPL Commons office hours** | Mentors + incubation narrative |
| **YouTube Short / TikTok** (cut from MP4) | Reach beyond crypto Twitter |
| **Product Hunt / Show HN** | One-day spike; prepare assets first |
| **University / hackathon alumni groups** | Security & UX students |
| **LinkedIn** (fintech / payments) | Institutional framing of phishing risk |
| **GitHub Discussions + Topics** (`xrpl`, `identicon`) | Discoverability for integrators |

### Avoid / low priority early

- Paid ads before organic proof (waste until 50 mints).
- Generic “NFT drop” Discords (wrong audience; you’re utility Soulbound, not flip).
- Spamming every XRPL reply with links (gets muted).

---

## Phase 1 — Days 1–30 (awareness → first 50 mints)

### Channels
1. **XRPL Discord / Commons** — “mint your sensory keychain in 60s” thread + demo video.
2. **Twitter/X** — tip posts: phishing lookalike → mosaic diverge (Comparator screenshot).
3. **Bithomp / explorer users** — extension install CTA.
4. **Friends & operators** — 10 seeded mints with real wallets (not only operator account).
5. **LATAM ES communities** — narrativa corta from SOCIAL_KIT.

### Offer
- Free visual use; mint costs ~owner reserve (recoverable via burn).
- Link: app → `/verify` after mint → share badge screenshot.

### Content kit
| Asset | Use |
|-------|-----|
| `assets/demo-make-waves.mp4` | Submission + social |
| `assets/banners/*` | Headers / OG / Discord / square posts |
| [SOCIAL_KIT.md](SOCIAL_KIT.md) | Ready-to-paste copy EN/ES |
| `/verify` screenshot | Trust proof |
| [USER_GUIDE.md](USER_GUIDE.md) | Support |

---

## Phase 2 — Days 31–60 (integrators)

1. Open GitHub Discussions: “Wallet-native mosaic before sign”.
2. Send short integration brief ([INTEGRATION.md](INTEGRATION.md) + NPM exports) to Xaman / Gem / Crossmark contacts.
3. Submit or advance [XLS_PROPOSAL_DRAFT.md](XLS_PROPOSAL_DRAFT.md).
4. Publish cognitive-training results (reaction time / accuracy) from the in-app trainer.

---

## Phase 3 — Days 61–90 (ecosystem narrative)

1. Case study: “N mints, 0 reported phishing misses in training cohort”.
2. Aquarium / Commons office hours — pitch recurring `account_nfts` volume.
3. Optional: public mint leaderboard page (read-only explorer queries).

---

## Messaging (Make Waves framing)

**Do say:**  
“Every protected payment can trigger an on-chain identity check. We mint Soulbound keychains and propose wallet-native mosaics so XRPL users stop signing to lookalike addresses.”

**Don’t say:**  
“We’re only an identicon toy.” / “Ignore Xaman scam warnings” (issue is closed).

---

## Operator weekly checklist

- [ ] Reply to support / GitHub issues within 48h
- [ ] Post 2–3 social pieces
- [ ] Log new mint count
- [ ] One outreach email to a wallet or community lead

---

## Definition of “campaign ready”

| Gate | Status |
|------|--------|
| Product trust (Xaman) | ✅ Resolved |
| Layout usability fix | ✅ Semi-anchored |
| Demo video + EN subs | ✅ |
| Docs / submission draft | ✅ |
| Version sync 3.9.0 | ✅ |
| Hackathon form submitted | ⬜ You |
| First 10 external mints | ⬜ You |
| Social kit + banners in repo | ✅ |
| Demo audio (rhythmic bass) | ✅ |

*Last updated: 2026-07-09 · v3.9.1*
