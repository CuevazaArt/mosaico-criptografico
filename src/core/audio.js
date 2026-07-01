/**
 * Motor de Síntesis Auditiva Mnemónica (Llavero Sonoro) para Accesibilidad.
 * Genera melodías procedimentales y deterministas basadas en hashes SHA-256 usando Web Audio API.
 */

let activeOscillators = [];
let audioCtx = null;

/**
 * Detiene cualquier audio en reproducción activa.
 */
export function stopMnemonicAudio() {
  activeOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Ignorar si ya se había detenido
    }
  });
  activeOscillators = [];
}

/**
 * Genera y reproduce un arpegio determinista basado en el hash.
 * @param {Uint8Array} hash - El hash SHA-256 de 32 bytes.
 * @param {Object} options - Configuración.
 * @param {number} options.gridSize - Tamaño de la grilla (3, 4 o 5).
 * @param {boolean} options.chaoticMode - Si es verdadero, usa intervalos disonantes.
 */
/**
 * Programa la reproducción de un arpegio determinista basado en el hash a partir de un tiempo específico.
 * @param {Uint8Array} hash - El hash SHA-256 de 32 bytes.
 * @param {Object} options - Configuración.
 * @param {number} options.gridSize - Tamaño de la grilla.
 * @param {boolean} options.chaoticMode - Si es verdadero, usa escala disonante.
 * @param {number} startTime - Tiempo de inicio en el AudioContext.
 * @returns {number} El tiempo final en segundos al terminar el arpegio.
 */
export function scheduleMnemonicAudio(hash, options = {}, startTime) {
  if (!audioCtx) return startTime;

  const gridSize = parseInt(options.gridSize) || 3;
  const numCells = gridSize * gridSize;
  const chaoticMode = !!options.chaoticMode;

  // 1. Definir frecuencia fundamental (F0) a partir de los bytes finales
  const baseFreq = 160 + (hash[31] % 120);

  // 2. Definir escalas de intervalos
  const pentatonicIntervals = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const chaoticIntervals = [0, 1, 6, 7, 10, 11, 13, 16, 18, 22];
  const intervals = chaoticMode ? chaoticIntervals : pentatonicIntervals;

  const scale = intervals.map(semitones => {
    return baseFreq * Math.pow(2, semitones / 12);
  });

  // 3. Obtener el layout Fisher-Yates determinista
  const layout = Array.from({ length: numCells }, (_, idx) => idx);
  for (let k = numCells - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = layout[k];
    layout[k] = layout[j];
    layout[j] = temp;
  }

  // 4. Secuenciar las notas (firma acústica de 4 notas)
  const stepDuration = 0.16; // 160ms por nota
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

    // Envolvente de volumen (ADSR suave para evitar clics)
    gain.gain.setValueAtTime(0, currentPlayTime);
    gain.gain.linearRampToValueAtTime(0.2, currentPlayTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, currentPlayTime + stepDuration - 0.01);

    gain.connect(audioCtx.destination);

    try {
      osc.start(currentPlayTime);
      osc.stop(currentPlayTime + stepDuration);
    } catch (e) {
      console.warn("Advertencia de Web Audio API al iniciar/parar oscilador:", e);
    }

    activeOscillators.push(osc);
    currentPlayTime += stepDuration;
  }

  return currentPlayTime;
}

/**
 * Reproduce un arpegio mnemónico determinista de inicio directo.
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
 * Programa el sonido de alerta de discrepancia intermedia (barrido descendente corto).
 */
function scheduleComparisonFailureSound(startTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, startTime); // Mi4
  osc.frequency.exponentialRampToValueAtTime(147, startTime + 0.22); // Re3 (caída de tono)
  
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
  return startTime + 0.3; // Tiempo de término
}

/**
 * Programa el sonido final de alarma/error de wallet (buzzer disonante grave).
 */
function scheduleAlarmSound(startTime) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(110, startTime); // La2
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(115, startTime); // Batido disonante
  
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
 * Programa el sonido de concordancia intermedia (acorde mayor ascendente corto y dulce).
 */
function scheduleComparisonSuccessSound(startTime) {
  const notes = [392.00, 523.25, 659.25]; // Sol4, Do5, Mi5
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
 * Secuencia Completa de Fallo / Discrepancia:
 * 1. Llavero Propio (Address A)
 * 2. Sonido Falla Comparación (descendente)
 * 3. Sonido Wallet Error / Fraude (alarma disonante)
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
  // 1. Sonido llavero propio
  time = scheduleMnemonicAudio(hashA, options, time);
  time += 0.08; // Pausa corta
  
  // 2. Sonido de falla de comparación
  time = scheduleComparisonFailureSound(time);
  time += 0.08; // Pausa corta
  
  // 3. Sonido de error de wallet / fraude
  scheduleAlarmSound(time);
}

/**
 * Secuencia Completa de Éxito / Concordancia:
 * 1. Llavero Propio (Address A)
 * 2. Sonido Bueno (chime campana)
 * 3. Llavero Destino Bueno (Address B)
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
  // 1. Sonido llavero propio
  time = scheduleMnemonicAudio(hashA, options, time);
  time += 0.08; // Pausa corta
  
  // 2. Sonido de comparación exitosa
  time = scheduleComparisonSuccessSound(time);
  time += 0.08; // Pausa corta
  
  // 3. Sonido de llavero destino bueno
  scheduleMnemonicAudio(hashB, options, time);
}
