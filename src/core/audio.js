/**
 * Mnemonic Acoustic Synthesis Engine (Acoustic Key) for Accessibility.
 * Generates procedural and deterministic melodies based on SHA-256 hashes using the Web Audio API.
 */

import { buildSemiAnchoredLayout } from './layout.js';

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
  if (!audioCtx || !hash || hash.length < 32) return startTime;

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

  // 3. Semi-anchored layout (matches generator.js)
  const layout = buildSemiAnchoredLayout(hash, numCells);

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

/**
 * Training feedback when user picks an option: target melody, then selection melody, then outcome cue.
 */
export function playTrainingSelectionFeedback(targetHash, selectedHash, isCorrect, options = {}) {
  stopMnemonicAudio();
  if (!targetHash || !selectedHash || targetHash.length < 32 || selectedHash.length < 32) return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  let time = audioCtx.currentTime + 0.02;
  time = scheduleMnemonicAudio(targetHash, options, time);
  time += 0.1;
  time = scheduleMnemonicAudio(selectedHash, options, time);
  time += 0.08;

  if (isCorrect) {
    scheduleComparisonSuccessSound(time);
  } else {
    scheduleComparisonFailureSound(time);
  }
}

/**
 * Triumphant registration fanfare — major ascending chord + sparkle notes.
 */
export function playRegistrationSuccessFanfare() {
  stopMnemonicAudio();
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const notes = [
    { freq: 523.25, time: 0, dur: 0.28, gain: 0.18 },
    { freq: 659.25, time: 0.12, dur: 0.28, gain: 0.16 },
    { freq: 783.99, time: 0.24, dur: 0.32, gain: 0.16 },
    { freq: 1046.5, time: 0.38, dur: 0.55, gain: 0.2 },
    { freq: 1318.5, time: 0.52, dur: 0.22, gain: 0.1 },
    { freq: 1568.0, time: 0.6, dur: 0.35, gain: 0.12 }
  ];

  const base = audioCtx.currentTime + 0.03;
  notes.forEach(({ freq, time, dur, gain: peak }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const start = base + time;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    try {
      osc.start(start);
      osc.stop(start + dur + 0.05);
    } catch (e) { /* ignore */ }
    activeOscillators.push(osc);
  });
}
