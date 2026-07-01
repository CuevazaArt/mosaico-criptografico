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
export function playMnemonicAudio(hash, options = {}) {
  // Asegurar detener reproducción previa
  stopMnemonicAudio();

  // Inicializar el contexto de audio en demanda (política de seguridad de navegadores)
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const gridSize = parseInt(options.gridSize) || 3;
  const numCells = gridSize * gridSize;
  const chaoticMode = !!options.chaoticMode;

  // 1. Definir frecuencia fundamental (F0) a partir de los bytes finales
  const baseFreq = 160 + (hash[31] % 120); // Rango de 160Hz (Re3) a 280Hz (Do#4)

  // 2. Definir escalas de intervalos
  // Escala Pentatónica Mayor (consonante y agradable)
  const pentatonicIntervals = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  // Escala Disonante Tritónica/Semitonal (para modo Caótico / Alarmas)
  const chaoticIntervals = [0, 1, 6, 7, 10, 11, 13, 16, 18, 22];

  const intervals = chaoticMode ? chaoticIntervals : pentatonicIntervals;
  
  // Calcular frecuencias correspondientes de la escala a partir de la fundamental
  const scale = intervals.map(semitones => {
    return baseFreq * Math.pow(2, semitones / 12);
  });

  // 3. Obtener el mismo layout Fisher-Yates determinista de las celdas
  const layout = Array.from({ length: numCells }, (_, idx) => idx);
  for (let k = numCells - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = layout[k];
    layout[k] = layout[j];
    layout[j] = temp;
  }

  // 4. Secuenciar las notas (firma acústica corta de 4 notas representativas)
  let startTime = audioCtx.currentTime + 0.05; // Margen de inicio
  const stepDuration = 0.16; // Duración corta de nota en segundos (160ms)
  const maxNotes = Math.min(numCells, 4);

  for (let step = 0; step < maxNotes; step++) {
    const logicalIndex = layout[step];
    const cellType = logicalIndex % 9;
    const cDataOffset = (logicalIndex * 3) % 26;

    // Seleccionar nota de la escala
    const noteIndex = (hash[cDataOffset] + hash[(cDataOffset + 1) % 32]) % scale.length;
    const frequency = scale[noteIndex];

    // Sintetizar
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Tipo de oscilador determinista
    // El anclaje central (cellType 4) usa onda cuadrada con filtro o diente de sierra para destacar
    if (cellType === 4) {
      osc.type = 'triangle';
      // Añadir un filtro para suavizar armónicos
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 2, startTime);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.type = hash[cDataOffset] % 2 === 0 ? 'sine' : 'triangle';
      osc.connect(gain);
    }

    osc.frequency.setValueAtTime(frequency, startTime);

    // Envolvente de volumen (ADSR simplificado para evitar clics de audio)
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration - 0.01); // Decay/Release

    gain.connect(audioCtx.destination);

    // Iniciar y detener
    osc.start(startTime);
    osc.stop(startTime + stepDuration);

    activeOscillators.push(osc);

    // Siguiente paso en la secuencia
    startTime += stepDuration;
  }
}
