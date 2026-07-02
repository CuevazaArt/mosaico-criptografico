# Technical Proposal: Mnemonic Acoustic Signature (Audio Mosaic)

This document details the feasibility, technical design, and development requirements for creating a **deterministic audio signature system** (Acoustic Key) designed specifically for blind or severely visually impaired individuals.

---

## 1. General Concept: Hearing the Address

In the same way the human eye can compare color and shape patterns in a mosaic, the human ear has high sensitivity to detect variations in:
* **Pitch and Harmony:** Identifying if a chord is major, minor, or dissonant.
* **Rhythm and Sequence:** Detecting if an arpeggio (sequence of notes) speeds up, breaks, or changes order.
* **Timbre:** Recognizing the "color" of the sound (soft like a flute, metallic, or bright).

By mapping the SHA-256 hash of an address to audio parameters, a visually impaired user can **hear their address** (a short 3-second arpeggio or melody) and verify if it sounds identical when pasted at the destination. If a virus alters the address, the resulting melody will sound in a different scale, with a broken rhythm, or in a dissonant tone.

---

## 2. Relationship and Synchronization with the Visual Mosaic

Since they derive from the same immutable hash, the visual and acoustic representations are **100% coupled**:

```
                                  ┌───────────────────────────┐
                                  │       Wallet Address      │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  SHA-256 Hash Buffer  │
                                    └───────────┬───────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [ Visual Mapping ]                                 [ Acoustic Mapping ]
         - HSL colors per cell                             - Scale and chords
         - Geometric shapes                                - Sequence of notes (Arpeggio)
         - Position by Fisher-Yates                        - Rhythm by Fisher-Yates
```

The deterministic Fisher-Yates shuffling that changes the layout of the 9 cells on the screen controls the **temporal order of the notes** (the arpeggio's melody), linking the visual and auditory physics mathematically.

---

## 3. Architecture and Technical Operation

To implement this in a lightweight and universal way, we use the native HTML5 **Web Audio API**. This eliminates the need to load heavy `.mp3` audio files or use external servers. The sound is synthesized procedurally in real-time.

### A. Sound Parameter Mapping
We split the 32 bytes of the hash to feed the synthesizer:

1. **The Musical Scale (Key) - Bytes 30 and 31:**
   * Maps the bytes to a scale of guaranteed consonance, such as the **major or minor pentatonic scale**. This prevents unpleasant noises and produces "pleasant" yet highly distinctive acoustic signatures.
2. **The Instrument (Timbre) - Byte 29:**
   * Configures the browser's oscillators (`OscillatorNode`). An even byte generates triangle waves (soft flute-like timbre) and an odd byte generates sawtooth waves (bright, analog synth-like timbre).
3. **The Rhythm (Sequential Arpeggio) - Shuffled Layout:**
   * Uses the same cell array shuffled by Fisher-Yates.
   * For example, if the resulting layout is `[4, 0, 7, 1, 8, 3, 2, 6, 5]`, the arpeggio plays the frequencies associated with each cell in that exact sequential order. Cell `4` (topological anchor) can have a characteristic vibrato or volume accent in the melody.

### B. Theoretical Code Example
```javascript
// Conceptual structure for generator_audio.js
export function playMnemonicAudio(hash) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 1. Determine scale and fundamental frequency (Key)
  const fundamentalFreq = 220 + (hash[0] % 220); // Range: 220Hz to 440Hz
  const scale = getPentatonicScale(fundamentalFreq, hash[1]);
  
  // 2. Get the sequential Fisher-Yates layout
  const layout = getShuffledLayout(hash); // E.g.: [4, 0, 2, ...]
  
  // 3. Synthesize notes in sequence
  let time = audioCtx.currentTime;
  layout.forEach((cellIdx, step) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Assign frequency based on scale and cell index
    osc.frequency.value = scale[cellIdx % scale.length];
    
    // Timbre modulation based on cell bytes
    osc.type = hash[cellIdx] % 2 === 0 ? 'triangle' : 'sine';
    
    // Volume envelope (ADSR: Attack, Decay, Release)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // Release
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.3);
    
    time += 0.25; // Next step in time (2.25 seconds total arpeggio)
  });
}
```

---

## 4. Development Requirements and Challenges

### A. Native Accessibility (Screen Readers)
* **ARIA Attributes:** Interactive elements must possess descriptions for screen readers. For example:
  `<button aria-label="Listen to the address audio signature" onclick="playAudio()">🔊 Listen to Signature</button>`
* **Redundant Textual Transcription:** The screen reader must announce the key (e.g., *"Audio signature: C sharp minor key, Fast tempo"*).

### B. Cross-Platform Consistency
* Web Audio API sound synthesizers can sound slightly different across browsers (e.g., Firefox vs Safari on iOS) due to variations in frequency interpolation curves. The engine must be calibrated with rigid, discrete mathematical values to ensure an address sounds **exactly the same** on a mobile phone as on a desktop computer.

---

## 5. Vulnerability Analysis and Critique of the Acoustic Key

Although the acoustic proposal adds an indispensable inclusion layer, the system presents physical and cognitive weaknesses inherent to the human auditory channel that must be analyzed critically:

### A. Limits of Auditory Memory and Attention
* **Transient Nature:** Unlike the visual mosaic (which is static and allows the user to inspect it calmly for as long as they need), sound is **transient**. It requires active attention during its 3-second playback.
* **Lack of Absolute Pitch:** Most users do not accurately distinguish semitone intervals (e.g., passing from a note in E to F) unless they have musical training. An attacker could search for an address that produces a very similar arpeggio in key and rhythm, betting that the user won't notice the subtle harmonic deviation.
* *Mitigative Action:* Limit arpeggios to wider tonal jumps (such as thirds or fifths of the scale) to force coarse, highly obvious melodic differences in case of collisions.

### B. Environment and Output Hardware Dependencies
* **Background Noise:** Transacting in noisy environments (streets, public transit) completely negates the utility of the sound signature, forcing the user to rely on headphones.
* **Speaker Frequency Response:** Built-in speakers on laptops or low-end phones often cut off low frequencies below 200Hz. If the fundamental frequency of the hash is very low, parts of the arpeggio will be inaudible.
* *Mitigative Action:* Calibrate the synthesizer to operate solely in mid-high ranges (300Hz to 1200Hz), where any mobile speaker responds clearly.

### C. Vulnerability to Replay Attacks (Frontend Tampering)
* **Audio Spoofing:** If the browser dApp is compromised via XSS, the malicious script can simply play a previously captured legitimate audio clip while injecting a fraudulent address into the transaction.
* *Mitigative Action:* The audio trigger must reside in the **Isolated Wallet Context** (the MetaMask popup or the Ledger screen). The user must only trust the sound emitted by the wallet's native interface, never that played by the exchange/dApp website.

---

## 6. Evolution of the Standard: Modular Layer and Future Hardware Mitigations

To avoid overloading most users with acoustic noise or auditory fatigue, while simultaneously guaranteeing the inalienability of the system for those who need it, the evolutionary roadmap of the standard is defined under the following pillars of modularity and physical isolation:

### A. Off-by-Default (Disabled by default)
* **Native yet Silent:** Each Cryptographic Mosaic and address specification on the blockchain calculates its hash and acoustic frequencies natively and immutably.
* **On-Demand Activation:** By default, wallets emit no sound. The functionality remains disabled until the user explicitly activates it in the accessibility panel or advanced settings, respecting the simplicity of the digital financial environment.

### B. On-Demand Modular App Layer (Wallet Plugins / Snaps)
* **MetaMask Snaps and Safe Modules:** Instead of increasing the core wallet's weight with synthesizers, acoustic playback is offered as an installable **modular Snap** on demand.
* **Clean Integration:** Only users who require or benefit from audio support (blind, low-vision, or high-security accounts) install this module. The modular app subscribes to the wallet's signing events to generate the procedural arpeggio in an isolated browser environment.

### C. Mitigations Through Dedicated Hardware and Wearables
To completely nullify the malware attack vector on the PC/mobile (audio spoofing), sound processing and emission must occur in trusted hardware isolated from the host:

1. **Hardware Wallets with Speaker / Piezoelectric Buzzer:**
   * Auditory confirmation is generated inside the isolated processor of the cold wallet (e.g., next-generation Ledger or Trezor).
   * Upon pressing "Sign", the physical device emits the melody or arpeggio directly from its internal hardware-secured speaker, guaranteeing that what the user hears comes directly from the real private key and not from a hacked PC screen.
2. **Bone Conduction Headphones and Crypto Headsets:**
   * Specialized user devices (such as Bluetooth headphones with secure cryptographic enclaves or discrete buzzers) linked directly via an encrypted local Bluetooth channel to the Hardware Wallet.
   * The arpeggio is transmitted directly to the user's auditory canal via bone conduction without ever passing through the sound card of the compromised computer. This creates a physically unbreachable **Trusted Audio Path** against viruses and cyberattacks.
