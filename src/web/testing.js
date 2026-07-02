/**
 * Cognitive Testing Module.
 * Manages the spoofing (phishing) simulation and measures human visual performance.
 */

/**
 * Generates a mock cryptographic address (Ethereum/EVM style) randomly.
 * @returns {string} Fictional 42-character hexadecimal address.
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
 * Mutates an existing address to simulate a phishing (spoofing) attack.
 * Keeps the '0x' prefix and the first/last characters intact, varying the middle section.
 * @param {string} address - The original address to clone.
 * @param {number} level - Difficulty level (how many characters change in the middle).
 * @returns {string} Mutated address.
 */
export function generateSimilarAddress(address, level = 2) {
  if (!address.startsWith('0x') || address.length < 15) {
    // If not standard address, mutate text generically
    const arr = address.split('');
    const pos = Math.floor(Math.random() * (arr.length - 2)) + 1;
    arr[pos] = String.fromCharCode(arr[pos].charCodeAt(0) + 1);
    return arr.join('');
  }

  const hexChars = '0123456789abcdef';
  const prefix = address.substring(0, 7); // Keeps "0x" and 5 characters
  const suffix = address.substring(address.length - 4); // Keeps the last 4 characters
  const middle = address.substring(7, address.length - 4).split('');

  // Mutate 'level' amount of random characters in the middle section
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
 * Shuffles an array in place (Fisher-Yates algorithm).
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Class controlling a local cognitive test/game session.
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
      console.warn("Could not load history from localStorage:", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('mosaico_game_trials', JSON.stringify(this.trials));
      localStorage.setItem('mosaico_game_streak', this.currentStreak.toString());
    } catch (e) {
      console.warn("Could not save history to localStorage:", e);
    }
  }

  /**
   * Starts a new test round.
   * @param {string} mode - The visual rendering mode ('harmonious' | 'chaotic').
   * @returns {Object} Test data to render in the frontend.
   */
  startNewTrial(mode) {
    this.currentMode = mode === 'chaotic' ? 'chaotic' : 'harmonious';
    this.targetAddress = generateRandomAddress();
    
    // Generate 5 similar malicious addresses
    const fakeAddresses = [];
    for (let i = 0; i < 5; i++) {
      // Varied difficulty (mutations of 1 to 3 characters)
      const diffLevel = 1 + (i % 3); 
      let fakeAddr;
      // Ensure it is not identical to the real or other fake addresses
      do {
        fakeAddr = generateSimilarAddress(this.targetAddress, diffLevel);
      } while (fakeAddr === this.targetAddress || fakeAddresses.includes(fakeAddr));
      fakeAddresses.push(fakeAddr);
    }

    // Join real with fake addresses and shuffle them
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
   * Submits the user's answer for validation.
   * @param {string} selectedAddress - The address selected by the user.
   * @returns {Object} Round result.
   */
  submitAnswer(selectedAddress) {
    if (!this.startTime) return null;
    
    const endTime = performance.now();
    const timeTakenMs = endTime - this.startTime;
    const isCorrect = (selectedAddress === this.targetAddress);
    const timeTakenSec = timeTakenMs / 1000;

    // Update streak and current streak times
    if (isCorrect) {
      this.currentStreak++;
      this.streakTimes.push(timeTakenSec);
    } else {
      this.currentStreak = 0;
      this.streakTimes = [];
    }

    // Save record
    const trialRecord = {
      mode: this.currentMode,
      time: timeTakenSec, // in seconds
      correct: isCorrect,
      timestamp: Date.now()
    };
    
    this.trials.push(trialRecord);
    this.startTime = null; // Reset timer
    this.saveToStorage();

    return {
      isCorrect,
      timeTakenSec
    };
  }

  /**
   * Calculates and returns aggregated statistics by mode.
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

    // Calculate perfect streak average if >= 5
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
   * Clears the test history.
   */
  clearHistory() {
    this.trials = [];
    this.currentStreak = 0;
    this.streakTimes = [];
    try {
      localStorage.removeItem('mosaico_game_trials');
      localStorage.removeItem('mosaico_game_streak');
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
  }
}
