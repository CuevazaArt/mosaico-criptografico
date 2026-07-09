/**
 * Deterministic acoustic signature export (WAV) for NFT metadata packages.
 * Mirrors the browser arpeggio in audio.js without Web Audio API.
 */

import { buildSemiAnchoredLayout } from './layout.js';

const PENTATONIC_INTERVALS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const CHAOTIC_INTERVALS = [0, 1, 6, 7, 10, 11, 13, 16, 18, 22];

export function getAcousticNoteSequence(hash, options = {}) {
  const gridSize = parseInt(options.gridSize, 10) || 3;
  const chaoticMode = !!options.chaoticMode;
  const numCells = gridSize * gridSize;
  const baseFreq = 160 + (hash[31] % 120);
  const intervals = chaoticMode ? CHAOTIC_INTERVALS : PENTATONIC_INTERVALS;
  const scale = intervals.map(semitones => baseFreq * (2 ** (semitones / 12)));
  const layout = buildSemiAnchoredLayout(hash, numCells);
  const stepDuration = 0.16;
  const maxNotes = Math.min(numCells, 4);
  const notes = [];

  for (let step = 0; step < maxNotes; step++) {
    const logicalIndex = layout[step];
    const cellType = logicalIndex % 9;
    const cDataOffset = (logicalIndex * 3) % 26;
    const noteIndex = (hash[cDataOffset] + hash[(cDataOffset + 1) % 32]) % scale.length;
    notes.push({
      frequency: scale[noteIndex],
      start: step * stepDuration,
      duration: stepDuration,
      wave: cellType === 4 ? 'triangle' : (hash[cDataOffset] % 2 === 0 ? 'sine' : 'triangle')
    });
  }

  return notes;
}

function noteEnvelope(time, duration) {
  if (time < 0 || time >= duration) return 0;
  const attack = 0.02;
  const release = 0.01;
  if (time < attack) return time / attack;
  if (time > duration - release) return Math.max(0, (duration - time) / release);
  return 1;
}

function sampleWave(wave, phase) {
  if (wave === 'sine') return Math.sin(phase);
  return (2 / Math.PI) * Math.asin(Math.sin(phase));
}

export function synthesizeAcousticWav(hash, options = {}) {
  const sampleRate = 22050;
  const notes = getAcousticNoteSequence(hash, options);
  const totalDuration = notes.length
    ? notes[notes.length - 1].start + notes[notes.length - 1].duration + 0.08
    : 0.5;
  const numSamples = Math.ceil(totalDuration * sampleRate);
  const buffer = new Float32Array(numSamples);

  for (const note of notes) {
    const startIdx = Math.floor(note.start * sampleRate);
    const endIdx = Math.min(numSamples, Math.floor((note.start + note.duration) * sampleRate));
    for (let i = startIdx; i < endIdx; i++) {
      const t = (i / sampleRate) - note.start;
      const phase = 2 * Math.PI * note.frequency * t;
      buffer[i] += sampleWave(note.wave, phase) * noteEnvelope(t, note.duration) * 0.32;
    }
  }

  return encodeWavPcm16(buffer, sampleRate);
}

function encodeWavPcm16(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), offset);
    offset += 2;
  }

  return buffer;
}
