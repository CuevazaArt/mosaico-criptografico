# Legal Notice, Permissions & Disclaimer

**Project:** Cryptographic Mosaic (Sensory 2FA for XRPL)  
**Copyright holder:** CuevazaArt  
**Repository:** [github.com/CuevazaArt/mosaico-criptografico](https://github.com/CuevazaArt/mosaico-criptografico)  
**Live demo:** [mosaico-criptografico.vercel.app](https://mosaico-criptografico.vercel.app)

> **Read this before using the software, demo, NPM package, or browser extension.**  
> By accessing, cloning, installing, deploying, or interacting with this project in any way, you agree to the [Terms of Use](TERMS.md) and the disclaimers below.

**Binding terms for end users:** [TERMS.md](TERMS.md) (acceptance required in the web app).

---

## 1. What this project is

Cryptographic Mosaic is an **open-source, educational, and experimental** tool that:

- Generates **deterministic visual and acoustic identifiers** (identicons) from XRPL addresses.
- Offers a **non-custodial** web demo and browser extension for address comparison.
- May optionally trigger **on-chain XRPL transactions** (e.g., Soulbound NFT minting) **only through your own wallet** — never through this project's servers holding your keys.

It is **not** a wallet, exchange, custodian, financial product, security audit, or certified identity service.

---

## 2. Open-source license (code)

The **source code** of this repository is released under the **[MIT License](LICENSE)**.

### You may

| Permission | Details |
|------------|---------|
| **Use** | Run locally, use the public demo, or embed the library in your own projects. |
| **Study** | Read, review, and learn from the source code. |
| **Modify** | Fork and adapt the code for your own purposes. |
| **Distribute** | Share copies and derivatives under MIT terms. |
| **Commercial use** | Use in commercial products, subject to MIT and this disclaimer. |
| **Sublicense** | Include in larger works, provided MIT notice is preserved. |

### You must

- Include the **MIT copyright notice** and license text in copies or substantial portions of the Software.
- **Not imply endorsement** by CuevazaArt, Ripple, XRPL Foundation, Xaman, Gem Wallet, Crossmark, or Make Waves without written permission.
- **Accept all risk** of using modified or unmodified versions of this software.

The MIT License's **"AS IS"** warranty disclaimer and limitation of liability apply to the **code**. Sections 3–12 below apply to **all use of the project** (demo, docs, branding, and deployments).

---

## 3. Branding, assets, and reserved rights

| Asset | License / status |
|-------|------------------|
| **Source code** | MIT — see [LICENSE](LICENSE) |
| **Documentation** | MIT — same terms as code unless stated otherwise |
| **Name "Cryptographic Mosaic"** | Used descriptively; no trademark registration claimed. Third parties must not use it to imply official XRPL or wallet endorsement. |
| **Logo / mosaic artwork** (`assets/logo.png` and derivatives) | © CuevazaArt. MIT applies to **code that generates** mosaics; the **sample brand logo** may not be used to misrepresent affiliation. Generated per-address mosaics are deterministic outputs of the algorithm. |
| **Third-party marks** | XRPL, XRP, Xaman, Xumm, Gem, Crossmark, Ripple, Vercel, and related names are trademarks of their respective owners. This project is **not affiliated** with them. |

---

## 4. No professional advice

Nothing in this repository, demo, documentation, or communications constitutes:

- **Financial, investment, or tax advice**
- **Legal advice**
- **Security certification or audit results**
- **A guarantee** that any address, NFT, or transaction is safe, legitimate, or recoverable

**Always verify transactions in your own wallet.** Consult qualified professionals for financial, legal, or security decisions involving real funds.

---

## 5. Security disclaimer (critical)

Visual and acoustic identicons are **human-assistance tools**, not cryptographic proofs.

| Topic | Disclaimer |
|-------|------------|
| **Phishing resistance** | Mosaics help detect address tampering but **do not eliminate** all attack vectors (malware, social engineering, compromised wallets, look-alike domains, etc.). |
| **Algorithm changes** | Updates to grid size, palette, or shuffle logic may change how an address renders. Do not rely on a single screenshot as permanent proof without on-chain verification. |
| **Soulbound NFTs** | On-chain identity mints are **experimental**. Taxon `1001` and metadata are project conventions, not an adopted XLS standard. NFT presence does **not** prove legitimacy of a third party. |
| **Private keys** | This software **never requests your seed phrase or secret keys**. If any site or fork asks for them, **do not provide them** — that is not this project. |
| **Serverless routes** | The Xaman payload API holds **only** Xumm API credentials server-side. Payload creation does not give the operator access to your wallet keys. |
| **Production demo** | The public deployment is a **demonstration** for the XRPL ecosystem and hackathon context. Use at your own risk on Mainnet. |

**You are solely responsible** for verifying recipient addresses, transaction details, and wallet prompts before signing.

---

## 6. On-chain transactions and funds

If you connect a wallet and sign transactions (e.g., `NFTokenMint`):

- **You** authorize every transaction in your wallet app.
- **Network fees and reserves** (XRP) are charged by the XRPL ledger, not by this project.
- **Failed, reversed, or mistaken transactions** are your responsibility.
- **CuevazaArt does not custody, control, or recover** your XRP, NFTs, or keys.
- Reserves may be **recoverable** per XRPL rules when NFTs are burned, but recovery is **not guaranteed** by this project.

---

## 7. Third-party services

This project integrates with or is hosted on services governed by **their own terms**:

| Service | Role |
|---------|------|
| **Xaman / Xumm** | Wallet connection and transaction signing |
| **Gem Wallet, Crossmark** | Optional browser wallet connectors |
| **XRPL public nodes** | Ledger access (WebSocket) |
| **Vercel** | Hosting and encrypted environment variables |
| **GitHub / GitHub Pages** | Source hosting and static mirror |
| **NPM** | Package distribution |
| **Google Fonts, unpkg CDN** | Frontend assets |

CuevazaArt is **not responsible** for outages, policy changes, data handling, or security incidents in third-party services.

---

## 8. Deployments and forks

If you **fork, clone, or deploy** this project:

- You are the **operator** of your deployment and responsible for your own `.env`, vault secrets, and compliance.
- You **must not** present your fork as the official Cryptographic Mosaic demo without clear attribution.
- You **inherit** this disclaimer for end users of your deployment.
- Run `npm run audit` before production deploy; credential leaks from misconfiguration are **your liability**.

---

## 9. Limitation of liability

**To the fullest extent permitted by applicable law:**

CuevazaArt and contributors **shall not be liable** for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages, including but not limited to:

- Loss of XRP, NFTs, or other digital assets  
- Unauthorized transactions or wallet compromise  
- Incorrect address verification or false sense of security  
- Downtime, data loss, or deployment failures  
- Reputational harm or lost profits  
- Personal injury or property damage arising from use of the software  

**Total aggregate liability** for any claim relating to this project shall not exceed **the greater of (a) zero (US $0) or (b) the amount you paid to CuevazaArt for this software in the twelve (12) months preceding the claim** (which, for the public open-source release, is typically **$0**).

Some jurisdictions do not allow certain limitations; in those cases, liability is limited to the **minimum extent permitted by law**.

---

## 10. Indemnification

You agree to **indemnify, defend, and hold harmless** CuevazaArt and contributors from any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from:

- Your use or misuse of the software, demo, or extension  
- Your on-chain transactions or wallet operations  
- Your deployment or fork of the project  
- Your violation of these terms or applicable law  
- Content or transactions you submit through a wallet you control  

---

## 11. No warranty

The software, documentation, demo, and extension are provided **"AS IS"** and **"AS AVAILABLE"**, without warranty of any kind, whether express, implied, or statutory, including but not limited to warranties of:

- Merchantability  
- Fitness for a particular purpose  
- Non-infringement  
- Accuracy, reliability, or uninterrupted availability  
- Freedom from vulnerabilities or bugs  

---

## 12. Privacy

- The core identicon engine runs **client-side** in your browser.
- The public demo may log **standard hosting analytics** (e.g., Vercel) without storing your private keys.
- Wallet providers (Xaman, Gem, etc.) process connection data under **their** privacy policies.
- **Do not** commit `.env` or secrets to git. See [SECURITY.md](SECURITY.md).

---

## 13. Changes and contact

- Terms may be updated in [TERMS.md](TERMS.md) and this file without prior notice; the version in the **repository default branch** governs. Web app users may be prompted to re-accept.
- For security issues, see [SECURITY.md](SECURITY.md).
- For bugs and feature requests, use [GitHub Issues](https://github.com/CuevazaArt/mosaico-criptografico/issues).

**No oral or written statement** by CuevazaArt shall create any warranty or obligation not expressly stated in [LICENSE](LICENSE) and this document.

---

## 14. Summary (non-binding shorthand)

| Question | Answer |
|----------|--------|
| Is the code open source? | **Yes** — MIT License |
| Can I fork and commercialize? | **Yes** — keep MIT notice; you assume liability |
| Does this guarantee my funds are safe? | **No** |
| Does CuevazaArt hold my keys? | **No** — ever |
| Is this official XRPL / Xaman software? | **No** — independent community project |
| Who is responsible if I lose XRP? | **You**, after your own wallet verification |

*This summary is for convenience only. [LICENSE](LICENSE) and sections 1–13 above are authoritative.*
