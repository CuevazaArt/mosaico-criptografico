/**
 * Mnemonic Acoustic Synthesis Engine (Acoustic Key) for Accessibility.
 * Generates procedural and deterministic melodies based on SHA-256 hashes using the Web Audio API.
 */

let activeOscillators = [];
let audioCtx = null;

/**
 * Stops any actively playing audio.
 */
export function stopMnemonicAudio() {
  activeOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Ignore if already stopped
    }
  });
  activeOscillators = [];
}

/**
 * Schedules the playback of a deterministic arpeggio based on the hash starting at a specific time.
 * @param {Uint8Array} hash - The 32-byte SHA-256 hash.
 * @param {Object} options - Configuration options.
 * @param {number} options.gridSize - Grid size.
 * @param {boolean} options.chaoticMode - If true, uses a dissonant scale.
 * @param {number} startTime - Start time in the AudioContext.
 * @returns {number} The ending time in seconds when the arpeggio finishes.
 */
export function scheduleMnemonicAudio(hash, options = {}, startTime) {
  if (!audioCtx) return startTime;

  const gridSize = parseInt(options.gridSize) || 3;
  const numCells = gridSize * gridSize;
  const chaoticMode = !!options.chaoticMode;

  // 1. Define fundamental frequency (F0) from the final bytes
  const baseFreq = 160 + (hash[31] % 120);

  // 2. Define scale intervals
  const pentatonicIntervals = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const chaoticIntervals = [0, 1, 6, 7, 10, 11, 13, 16, 18, 22];
  const intervals = chaoticMode ? chaoticIntervals : pentatonicIntervals;

  const scale = intervals.map(semitones => {
    return baseFreq * Math.pow(2, semitones / 12);
  });

  // 3. Get the deterministic Fisher-Yates layout
  const layout = Array.from({ length: numCells }, (_, idx) => idx);
  for (let k = numCells - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = layout[k];
    layout[k] = layout[j];
    layout[j] = temp;
  }

  // 4. Sequence the notes (4-note snappy signature)
  const stepDuration = 0.16; // 160ms per note
  const maxNotes = Math.min(numCells, 4);
  let currentPlayTime = startTime;

  for (let step = 0; step < maxNotes; step++) {
    const logicalIndex = layout[step];
    const cellType = logicalIndex % 9;
    const cDataOffset = (logicalIndex * 3) % 26;

    const noteIndex = (hash[cDataOffset] + hash[(cDataOffset + 1) % 32]) % scale.length;
    const frequency = scale[noteIndex];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (cellType === 4) {
      osc.type = 'triangle';
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 2, currentPlayTime);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.type = hash[cDataOffset] % 2 === 0 ? 'sine' : 'triangle';
      osc.connect(gain);
    }

    osc.frequency.setValueAtTime(frequency, currentPlayTime);

    // Volume Envelope (Smooth ADSR to avoid clicks)
    gain.gain.setValueAtTime(0, currentPlayTime);
    gain.gain.linearRampToValueAtTime(0.2, currentPlayTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, currentPlayTime + stepDuration - 0.01);

    gain.connect(audioCtx.destination);

    try {
      osc.start(currentPlayTime);
      osc.stop(currentPlayTime + stepDuration);
    } catch (e) {
      console.warn("Web Audio API warning on starting/stopping oscillator:", e);
    }

    activeOscillators.push(osc);
    currentPlayTime += stepDuration;
  }

  return currentPlayTime;
}

/**
 * Plays a deterministic mnemonic arpeggio instantly.
 */
export function playMnemonicAudio(hash, options = {}) {
  stopMnemonicAudio();
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  scheduleMnemonicAudio(hash, options, audioCtx.currentTime + 0.05);
}

/**
 * Schedules the intermediate comparison failure sound (short pitch slide down).
 */
function scheduleComparisonFailureSound(startTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, startTime); // E4
  osc.frequency.exponentialRampToValueAtTime(147, startTime + 0.22); // D3 (pitch fall)
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  try {
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  } catch (e) {}
  
  activeOscillators.push(osc);
  return startTime + 0.3; // End time
}

/**
 * Schedules the final alarm/error sound for wallets (low pitch dissonant buzzer).
 */
function scheduleAlarmSound(startTime) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(110, startTime); // A2
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(115, startTime); // Dissonant beating
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);
  
  try {
    osc1.start(startTime);
    osc1.stop(startTime + 0.45);
    osc2.start(startTime);
    osc2.stop(startTime + 0.45);
  } catch (e) {}
  
  activeOscillators.push(osc1, osc2);
  return startTime + 0.5;
}

/**
 * Schedules the intermediate comparison success sound (short, sweet ascending major chord).
 */
function scheduleComparisonSuccessSound(startTime) {
  const notes = [392.00, 523.25, 659.25]; // G4, C5, E5
  let maxTime = startTime;
  
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const noteTime = startTime + idx * 0.04;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);
    
    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    try {
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    } catch (e) {}
    
    activeOscillators.push(osc);
    maxTime = Math.max(maxTime, noteTime + 0.4);
  });
  
  return maxTime + 0.05;
}

/**
 * Complete Mismatch / Failure Sequence:
 * 1. Own Key (Address A)
 * 2. Comparison Failure Sound (pitch fall)
 * 3. Wallet Error / Fraud Sound (dissonant alarm)
 */
export function playMismatchSequence(hashA, options = {}) {
  stopMnemonicAudio();
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  let time = audioCtx.currentTime + 0.02;
  // 1. Own key sound
  time = scheduleMnemonicAudio(hashA, options, time);
  time += 0.08; // Short pause
  
  // 2. Comparison failure sound
  time = scheduleComparisonFailureSound(time);
  time += 0.08; // Short pause
  
  // 3. Wallet error / fraud sound
  scheduleAlarmSound(time);
}

/**
 * Complete Match / Success Sequence:
 * 1. Own Key (Address A)
 * 2. Good Sound (bell chime)
 * 3. Destination Key (Address B)
 */
export function playMatchSequence(hashA, hashB, options = {}) {
  stopMnemonicAudio();
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  let time = audioCtx.currentTime + 0.02;
  // 1. Own key sound
  time = scheduleMnemonicAudio(hashA, options, time);
  time += 0.08; // Short pause
  
  // 2. Successful comparison sound
  time = scheduleComparisonSuccessSound(time);
  time += 0.08; // Short pause
  
  // 3. Destination key sound
  scheduleMnemonicAudio(hashB, options, time);
}
