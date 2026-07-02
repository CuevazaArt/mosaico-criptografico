/**
 * Módulo de Pruebas Cognitivas
 * Gestiona la simulación de ataques de suplantación (phishing) y mide el rendimiento visual humano.
 */

/**
 * Genera una dirección criptográfica falsa (tipo Ethereum/EVM) de forma aleatoria.
 * @returns {string} Dirección hexadecimal ficticia de 42 caracteres.
 */
export function generateRandomAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * 16)];
  }
  return address;
}

/**
 * Muta una dirección existente para simular un ataque de phishing (suplantación).
 * Mantiene intactos el prefijo 0x y los primeros/últimos caracteres, variando la parte intermedia.
 * @param {string} address - La dirección original a clonar.
 * @param {number} level - Nivel de dificultad (cuántos caracteres cambian en el medio).
 * @returns {string} Dirección mutada.
 */
export function generateSimilarAddress(address, level = 2) {
  if (!address.startsWith('0x') || address.length < 15) {
    // Si no es dirección estándar, mutar texto de forma genérica
    const arr = address.split('');
    const pos = Math.floor(Math.random() * (arr.length - 2)) + 1;
    arr[pos] = String.fromCharCode(arr[pos].charCodeAt(0) + 1);
    return arr.join('');
  }

  const hexChars = '0123456789abcdef';
  const prefix = address.substring(0, 7); // Mantiene "0x" y 5 caracteres
  const suffix = address.substring(address.length - 4); // Mantiene los últimos 4
  const middle = address.substring(7, address.length - 4).split('');

  // Mutar 'level' cantidad de caracteres aleatorios en la parte media
  for (let i = 0; i < level; i++) {
    const idxToMutate = Math.floor(Math.random() * middle.length);
    let newChar;
    do {
      newChar = hexChars[Math.floor(Math.random() * 16)];
    } while (newChar === middle[idxToMutate]);
    middle[idxToMutate] = newChar;
  }

  return prefix + middle.join('') + suffix;
}

/**
 * Mezcla (shuffle) un array en su lugar (algoritmo Fisher-Yates).
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Clase que controla una sesión de juego/prueba cognitiva local.
 */
export class CognitiveTestSession {
  constructor() {
    this.trials = [];
    this.targetAddress = '';
    this.currentMode = 'harmonious'; // 'harmonious' | 'chaotic'
    this.options = [];
    this.startTime = null;
    this.currentStreak = 0;
    this.streakTimes = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('mosaico_game_trials');
      if (stored) {
        this.trials = JSON.parse(stored);
      }
      const storedStreak = localStorage.getItem('mosaico_game_streak');
      if (storedStreak) {
        this.currentStreak = parseInt(storedStreak) || 0;
      }
    } catch (e) {
      console.warn("No se pudo cargar historial de localStorage:", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('mosaico_game_trials', JSON.stringify(this.trials));
      localStorage.setItem('mosaico_game_streak', this.currentStreak.toString());
    } catch (e) {
      console.warn("No se pudo guardar historial en localStorage:", e);
    }
  }

  /**
   * Inicia una nueva ronda de prueba.
   * @param {string} mode - El modo de renderizado visual ('harmonious' | 'chaotic').
   * @returns {Object} Datos de la prueba para pintar en el frontend.
   */
  startNewTrial(mode) {
    this.currentMode = mode === 'chaotic' ? 'chaotic' : 'harmonious';
    this.targetAddress = generateRandomAddress();
    
    // Generar 5 direcciones maliciosas similares
    const fakeAddresses = [];
    for (let i = 0; i < 5; i++) {
      // Dificultades variadas (mutaciones de 1 a 3 caracteres)
      const diffLevel = 1 + (i % 3); 
      let fakeAddr;
      // Asegurarse de que no sea idéntica a la real u otra falsa
      do {
        fakeAddr = generateSimilarAddress(this.targetAddress, diffLevel);
      } while (fakeAddr === this.targetAddress || fakeAddresses.includes(fakeAddr));
      fakeAddresses.push(fakeAddr);
    }

    // Unir la real con las falsas y mezclarlas
    this.options = [this.targetAddress, ...fakeAddresses];
    shuffleArray(this.options);
    
    this.startTime = performance.now();

    return {
      targetAddress: this.targetAddress,
      options: this.options,
      mode: this.currentMode
    };
  }

  /**
   * Envía la respuesta del usuario para validación.
   * @param {string} selectedAddress - La dirección seleccionada por el usuario.
   * @returns {Object} Resultado de la ronda.
   */
  submitAnswer(selectedAddress) {
    if (!this.startTime) return null;
    
    const endTime = performance.now();
    const timeTakenMs = endTime - this.startTime;
    const isCorrect = (selectedAddress === this.targetAddress);
    const timeTakenSec = timeTakenMs / 1000;

    // Actualizar racha y tiempos de la racha actual
    if (isCorrect) {
      this.currentStreak++;
      this.streakTimes.push(timeTakenSec);
    } else {
      this.currentStreak = 0;
      this.streakTimes = [];
    }

    // Guardar registro
    const trialRecord = {
      mode: this.currentMode,
      time: timeTakenSec, // en segundos
      correct: isCorrect,
      timestamp: Date.now()
    };
    
    this.trials.push(trialRecord);
    this.startTime = null; // Reiniciar timer
    this.saveToStorage();

    return {
      isCorrect,
      timeTakenSec
    };
  }

  /**
   * Calcula y devuelve las estadísticas agregadas por modo.
   */
  getStats() {
    const stats = {
      harmonious: { count: 0, correct: 0, totalTime: 0 },
      chaotic: { count: 0, correct: 0, totalTime: 0 }
    };

    this.trials.forEach(t => {
      const modeStats = stats[t.mode];
      if (modeStats) {
        modeStats.count++;
        if (t.correct) {
          modeStats.correct++;
          modeStats.totalTime += t.time;
        }
      }
    });

    const calculateAverages = (mode) => {
      const s = stats[mode];
      return {
        total: s.count,
        successRate: s.count > 0 ? Math.round((s.correct / s.count) * 100) : 0,
        avgTime: s.correct > 0 ? parseFloat((s.totalTime / s.correct).toFixed(2)) : 0
      };
    };

    // Calcular promedio de la racha perfecta si es >= 5
    let avgStreakTime = null;
    if (this.streakTimes.length >= 5) {
      const sum = this.streakTimes.reduce((a, b) => a + b, 0);
      avgStreakTime = parseFloat((sum / this.streakTimes.length).toFixed(3));
    }

    return {
      harmonious: calculateAverages('harmonious'),
      chaotic: calculateAverages('chaotic'),
      totalTrials: this.trials.length,
      currentStreak: this.currentStreak,
      avgStreakTime: avgStreakTime
    };
  }

  /**
   * Borra el historial de pruebas.
   */
  clearHistory() {
    this.trials = [];
    this.currentStreak = 0;
    this.streakTimes = [];
    try {
      localStorage.removeItem('mosaico_game_trials');
      localStorage.removeItem('mosaico_game_streak');
    } catch (e) {
      console.warn("No se pudo limpiar localStorage:", e);
    }
  }
}
