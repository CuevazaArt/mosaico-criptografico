# User Manual and Verification Protocol

This manual describes the operation of the interactive **Cryptographic Mosaic** dApp and establishes the step-by-step protocol for secure manual verification of addresses and hashes in Web3 environments.

---

## 1. Interface User Guide

The application is split into three main sections accessible from the tab navigation bar in the header:

### A. Generator Panel (Individual Visualization)
Allows you to inspect in detail how a mosaic is composed from any text input.
1. **Address Input:** Type or paste any public key, private key, or contract address into the text field. You can use the die button (🎲) to generate random mock addresses.
2. **Chroma Mode:**
   * **Harmonious (Recommended for daily use):** Groups cells under a complementary color palette. This reduces cognitive fatigue and makes it easy to remember the "visual identity" of an address as a whole.
   * **Chaotic (Recommended for maximum entropy):** Generates independent colors in each cell. It is visually louder but maximizes visual differences between similar hashes.
3. **Security and Scalability Controls:**
   * **Grid Size:** Set the grid to **3x3** (default), **4x4**, or **5x5** sectors. Larger grids exponentially increase spatial complexity and are recommended for signing high-value contracts.
   * **Text Overlay:** Toggle the bottom bar displaying the readable characters of the address.
   * **Topological Anchors:** Show/hide countable vertices on the central glyph.
4. **Seed Breakdown:** The bottom of the page displays the derived SHA-256 hexadecimal hash of your input.

### B. Comparator Panel (Face-to-Face Verification)
Designed for immediate visual comparison of two addresses before sending funds or signing transactions.
1. Paste the expected address (Address A) into the left box.
2. Paste the copied address or the one displayed in your transaction interface (Address B) into the right box.
3. Observe the generated mosaics:
   * **Green Badge (✅):** The addresses and their identicons match 100%. It is safe to proceed.
   * **Red Badge (⚠️):** There is a discrepancy. The mosaics will look markedly different in colors and shape arrangement. **Stop the transaction immediately!**
4. Click **"Phishing"** to see how a single-character change in Address B completely alters the layout and colors of its mosaic.

### C. Simulator Panel (Cognitive Field Testing)
An interactive environment to train and evaluate the human eye's capacity to recognize cryptographic patterns.
1. Select the visual mode to evaluate (Harmonious or Chaotic).
2. Click **"Start Simulation"**.
3. A **Target Mosaic** will be presented at the top, along with 6 option cards below.
4. 5 of the cards contain fake addresses mimicking the start and end of the target address (phishing). Only 1 is identical.
5. Click the mosaic you believe matches the target.
6. The right panel will record your success rate and average reaction time in seconds. Click **"Reset"** to clear the history.

---

## 2. Manual Address Verification Protocol (Step-by-Step)

To integrate this security layer into your daily Web3 operations, implement this 3-step protocol:

```
[ STEP 1: Generate ] ──► [ STEP 2: Compare ] ──► [ STEP 3: Confirm ]
   Paste address            Observe the Mosaic       Verify Anchors
   in the comparator        (Colors in position?)    (Match number of points?)
```

### Step 1: Secure Copy and Generation
Before sending funds to a contract or wallet:
1. Copy the recipient's address from a trusted source (e.g., the official token site or your saved address book).
2. Paste it into your dApp or wallet integrating the Cryptographic Mosaic renderer. Memorize the resulting mosaic.

### Step 2: Layout and Color Comparison
When confirming the transaction in the wallet interface (e.g., the signing confirmation popup):
1. Look at the mosaic rendered by the wallet and compare it with the one you memorized in Step 1.
2. Verify the **general distribution of the cells**: Is the star in the same cell? Do the truchet (labyrinth) and wave patterns occupy the same physical positions in the 3x3 grid?
3. If the colors do not match or a cell has a different pattern, abort.

### Step 3: Anchor and Overlay Validation
As a final check:
1. Locate the geometric anchor cell in the center. Count the number of vertices or white dots (e.g., *"it is a pentagon with 5 vertices"*).
2. Read the printed characters in the bottom overlay of the image. Verify that they correspond to the start and end of your destination address.
3. If all checks match, you can sign the transaction with peace of mind, knowing you are not a victim of clipboard hijacking or a malicious vanity address.
