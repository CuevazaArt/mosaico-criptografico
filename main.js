import { sha256, bytesToHex } from './src/core/crypto.js';
import { generateSvg } from './src/core/generator.js';
import { playMnemonicAudio, stopMnemonicAudio } from './src/core/audio.js';
import { CognitiveTestSession, generateRandomAddress, generateSimilarAddress } from './src/web/testing.js';

// Instanciar la sesión global de pruebas
const testSession = new CognitiveTestSession();

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initGenerator();
  initComparator();
  initTestingSuite();
});

/* ----------------------------------------------------
   1. CONTROLADOR DE PESTAÑAS (TABS)
   ---------------------------------------------------- */
function initTabs() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.tab-panel');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Parar cualquier audio corriendo al cambiar de pestaña
      stopMnemonicAudio();

      // Alternar clases activas en botones
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Alternar paneles de contenido
      panels.forEach(p => {
        if (p.id === targetTab) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    });
  });
}

/* ----------------------------------------------------
   2. SECCIÓN: GENERADOR INDIVIDUAL
   ---------------------------------------------------- */
function initGenerator() {
  const addressInput = document.getElementById('address-input');
  const randomAddressBtn = document.getElementById('random-address-btn');
  const overlayCheckbox = document.getElementById('toggle-overlay');
  const anchorsCheckbox = document.getElementById('toggle-anchors');
  const gridSizeSelect = document.getElementById('grid-size-select');
  const playAudioBtn = document.getElementById('play-audio-btn');
  const previewContainer = document.getElementById('identicon-preview');
  const fullHashCode = document.getElementById('full-hash-code');

  const updateGenerator = async () => {
    // Parar audio si hay uno corriendo
    stopMnemonicAudio();

    const rawValue = addressInput.value.trim() || '0x0000000000000000000000000000000000000000';
    
    // 1. Obtener hash criptográfico
    const hash = await sha256(rawValue);
    
    // 2. Mostrar el hash hexadecimal en la interfaz
    fullHashCode.textContent = bytesToHex(hash);

    // 3. Determinar el modo cromático activo
    const chromaMode = document.querySelector('input[name="chroma-mode"]:checked').value;
    
    // 4. Renderizar el SVG
    const svgString = generateSvg(hash, rawValue, {
      chaoticMode: (chromaMode === 'chaotic'),
      showOverlay: overlayCheckbox.checked,
      showAnchors: anchorsCheckbox.checked,
      gridSize: parseInt(gridSizeSelect.value) || 3
    });

    // 5. Inyectar SVG
    previewContainer.innerHTML = svgString;
  };

  // Event Listeners
  addressInput.addEventListener('input', updateGenerator);
  
  randomAddressBtn.addEventListener('click', () => {
    addressInput.value = generateRandomAddress();
    updateGenerator();
  });

  overlayCheckbox.addEventListener('change', updateGenerator);
  anchorsCheckbox.addEventListener('change', updateGenerator);
  gridSizeSelect.addEventListener('change', updateGenerator);
  
  document.querySelectorAll('input[name="chroma-mode"]').forEach(radio => {
    radio.addEventListener('change', updateGenerator);
  });

  // Reproducir firma auditiva
  playAudioBtn.addEventListener('click', async () => {
    const rawValue = addressInput.value.trim() || '0x0000000000000000000000000000000000000000';
    const hash = await sha256(rawValue);
    const chromaMode = document.querySelector('input[name="chroma-mode"]:checked').value;
    playMnemonicAudio(hash, {
      gridSize: parseInt(gridSizeSelect.value) || 3,
      chaoticMode: (chromaMode === 'chaotic')
    });
  });

  // Ejecución inicial
  updateGenerator();
}

/* ----------------------------------------------------
   3. SECCIÓN: COMPARADOR CARA A CARA
   ---------------------------------------------------- */
function initComparator() {
  const compareA = document.getElementById('compare-a-input');
  const compareB = document.getElementById('compare-b-input');
  const simulatePhishingBtn = document.getElementById('simulate-phishing-btn');
  const compareGridSizeSelect = document.getElementById('compare-grid-size-select');
  
  const previewA = document.getElementById('compare-a-preview');
  const previewB = document.getElementById('compare-b-preview');
  const statusBadge = document.getElementById('comparison-badge');
  const statusMsg = document.getElementById('comparison-msg');

  const updateComparison = async () => {
    const valA = compareA.value.trim();
    const valB = compareB.value.trim();
    const gridSize = parseInt(compareGridSizeSelect.value) || 3;

    // Generar hashes
    const hashA = await sha256(valA || 'A');
    const hashB = await sha256(valB || 'B');

    // Renderizar SVGs (por seguridad se usa modo armónico y overlays activos en comparador)
    previewA.innerHTML = generateSvg(hashA, valA, { chaoticMode: false, showOverlay: true, showAnchors: true, gridSize });
    previewB.innerHTML = generateSvg(hashB, valB, { chaoticMode: false, showOverlay: true, showAnchors: true, gridSize });

    // Comparación directa de cadenas
    if (valA && valB && valA === valB) {
      statusBadge.className = 'badge match';
      statusBadge.textContent = '✅';
      statusMsg.className = 'status-msg match';
      statusMsg.innerHTML = 'Coinciden Totalmente<br><span style="font-size:11px;color:#94a3b8;text-transform:none;">Direcciones idénticas</span>';
    } else {
      statusBadge.className = 'badge mismatch';
      statusBadge.textContent = '⚠️';
      statusMsg.className = 'status-msg mismatch';
      statusMsg.innerHTML = 'Discrepancia Detectada<br><span style="font-size:11px;color:#f43f5e;text-transform:none;">¡Alerta de phishing o error!</span>';
    }
  };

  // Event Listeners
  compareA.addEventListener('input', updateComparison);
  compareB.addEventListener('input', updateComparison);
  compareGridSizeSelect.addEventListener('change', updateComparison);

  simulatePhishingBtn.addEventListener('click', () => {
    if (compareA.value) {
      // Simular ataque mutando 1 o 2 caracteres del medio
      compareB.value = generateSimilarAddress(compareA.value.trim(), 1);
      updateComparison();
    }
  });

  // Ejecución inicial
  updateComparison();
}

/* ----------------------------------------------------
   4. SECCIÓN: SIMULADOR DE PRUEBAS DE CAMPO
   ---------------------------------------------------- */
function initTestingSuite() {
  const startBtn = document.getElementById('start-game-btn');
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  const modeSelect = document.getElementById('game-mode-select');
  const gameGridSizeSelect = document.getElementById('game-grid-size-select');
  
  const startScreen = document.getElementById('game-start-screen');
  const activeScreen = document.getElementById('game-active-screen');
  
  const targetPreview = document.getElementById('game-target-preview');
  const optionsContainer = document.getElementById('game-options-container');

  // Stats DOM
  const statHarmCount = document.getElementById('stat-harm-count');
  const statHarmSuccess = document.getElementById('stat-harm-success');
  const statHarmTime = document.getElementById('stat-harm-time');
  
  const statChaoCount = document.getElementById('stat-chao-count');
  const statChaoSuccess = document.getElementById('stat-chao-success');
  const statChaoTime = document.getElementById('stat-chao-time');
  
  const statCurrentStreak = document.getElementById('stat-current-streak');
  const statStreakAvgTime = document.getElementById('stat-streak-avg-time');
  
  const statsAnalysisText = document.getElementById('stats-analysis-text');

  let isLockingInput = false;
  let timerIntervalId = null;
  const timerElement = document.getElementById('game-timer-ms');

  const startLiveTimer = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    const startTime = performance.now();
    timerElement.textContent = "0.000";
    timerIntervalId = setInterval(() => {
      const elapsed = performance.now() - startTime;
      timerElement.textContent = (elapsed / 1000).toFixed(3);
    }, 41); // ~24 FPS, ideal para animar milisegundos sin sobrecargar
  };

  const stopLiveTimer = () => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  };

  const updateStatsDisplay = () => {
    const stats = testSession.getStats();
    
    // Render stats armónicas
    statHarmCount.textContent = stats.harmonious.total;
    statHarmSuccess.textContent = `${stats.harmonious.successRate}%`;
    statHarmTime.textContent = `${stats.harmonious.avgTime}s`;

    // Render stats caóticas
    statChaoCount.textContent = stats.chaotic.total;
    statChaoSuccess.textContent = `${stats.chaotic.successRate}%`;
    statChaoTime.textContent = `${stats.chaotic.avgTime}s`;

    // Render racha perfecta
    statCurrentStreak.textContent = stats.currentStreak;
    statStreakAvgTime.textContent = stats.avgStreakTime !== null ? `${stats.avgStreakTime}s` : 'N/A';
    
    // Añadir efecto visual si alcanzan racha de 5 o más
    if (stats.currentStreak >= 5) {
      statCurrentStreak.style.color = 'var(--secondary)';
      statCurrentStreak.style.textShadow = '0 0 10px var(--secondary-glow)';
    } else {
      statCurrentStreak.style.color = '#fff';
      statCurrentStreak.style.textShadow = 'none';
    }

    // Análisis automatizado
    const h = stats.harmonious;
    const c = stats.chaotic;
    
    if (h.total < 3 || c.total < 3) {
      statsAnalysisText.innerHTML = `Realiza al menos <strong>3 pruebas en cada modo</strong> para evaluar el rendimiento. <br>(Llevas: Armónico ${h.total}/3, Caótico ${c.total}/3)`;
    } else {
      let analysis = "<strong>Conclusiones del estudio de campo:</strong><br>";
      
      if (h.successRate === c.successRate) {
        analysis += "Ambos modos lograron una tasa de acierto similar. ";
        if (h.avgTime < c.avgTime) {
          analysis += `Sin embargo, el <strong>Modo Armónico</strong> permitió identificar el objetivo <strong>${Math.round((c.avgTime - h.avgTime)*100)/100}s más rápido</strong>, sugiriendo menor fatiga visual.`;
        } else if (c.avgTime < h.avgTime) {
          analysis += `Sin embargo, el <strong>Modo Caótico</strong> fue <strong>${Math.round((h.avgTime - c.avgTime)*100)/100}s más rápido</strong> gracias a la alta diferencia de contraste de color.`;
        } else {
          analysis += "Ambos registraron idénticos tiempos de reacción.";
        }
      } else if (h.successRate > c.successRate) {
        analysis += `El <strong>Modo Armónico</strong> obtuvo mayor precisión (<strong>${h.successRate}% acierto</strong> vs ${c.successRate}% del caótico). La unificación de color ayuda a estructurar y comparar patrones geométricos sin saturar la mente con ruido cromático.`;
      } else {
        analysis += `El <strong>Modo Caótico</strong> obtuvo mayor precisión (<strong>${c.successRate}% acierto</strong> vs ${h.successRate}% del armónico). El contraste radical de colores entre celdas ayuda a descartar rápidamente impostores visuales.`;
      }
      
      statsAnalysisText.innerHTML = analysis;
    }
  };

  const startNextRound = async () => {
    isLockingInput = false;
    const mode = modeSelect.value; // 'harmonious' | 'chaotic'
    const gridSize = parseInt(gameGridSizeSelect.value) || 3;
    
    // Iniciar prueba en lógica
    const trialData = testSession.startNewTrial(mode);
    const isChaotic = (trialData.mode === 'chaotic');

    // Obtener hash del objetivo para renderizarlo
    const targetHash = await sha256(trialData.targetAddress);

    // Pintar objetivo sin overlay de texto para forzar el reconocimiento del patrón puramente visual
    targetPreview.innerHTML = generateSvg(targetHash, trialData.targetAddress, {
      chaoticMode: isChaotic,
      showOverlay: false,
      showAnchors: true,
      gridSize
    });

    // Limpiar contenedor de opciones
    optionsContainer.innerHTML = '';

    // Renderizar las 6 opciones
    for (const address of trialData.options) {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.address = address;

      const optHash = await sha256(address);
      const svgContainer = document.createElement('div');
      svgContainer.className = 'identicon-option-container';
      
      // Renderizar la opción sin overlay para forzar la comparación visual pura
      svgContainer.innerHTML = generateSvg(optHash, address, {
        chaoticMode: isChaotic,
        showOverlay: false,
        showAnchors: true,
        gridSize
      });

      const addrLabel = document.createElement('span');
      addrLabel.className = 'option-address';
      // Truncar para mostrar
      addrLabel.textContent = `${address.substring(0, 7)}...${address.substring(address.length - 4)}`;

      card.appendChild(svgContainer);
      card.appendChild(addrLabel);

      // Evento de clic en la tarjeta de opción
      card.addEventListener('click', () => {
        if (isLockingInput) return;
        isLockingInput = true; // Bloquear clicks repetidos
        
        // Detener el temporizador de inmediato
        stopLiveTimer();

        // Enviar respuesta
        const result = testSession.submitAnswer(address);
        
        // Mostrar el tiempo final congelado exacto
        if (result) {
          timerElement.textContent = result.timeTakenSec.toFixed(3);
        }
        
        if (result.isCorrect) {
          card.classList.add('correct-flash');
          setTimeout(() => {
            updateStatsDisplay();
            startNextRound();
          }, 800);
        } else {
          card.classList.add('wrong-flash');
          
          // Resaltar la correcta para aprendizaje cognitivo
          const cards = optionsContainer.querySelectorAll('.option-card');
          cards.forEach(c => {
            if (c.dataset.address === trialData.targetAddress) {
              c.classList.add('correct-flash');
            }
          });

          setTimeout(() => {
            updateStatsDisplay();
            startNextRound();
          }, 1600);
        }
      });

      optionsContainer.appendChild(card);
    }
    
    // Iniciar temporizador visual en caliente
    startLiveTimer();
  };

  // Event Listeners
  startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    activeScreen.classList.add('active');
    startNextRound();
  });

  resetStatsBtn.addEventListener('click', () => {
    stopLiveTimer();
    testSession.clearHistory();
    updateStatsDisplay();
    activeScreen.classList.remove('active');
    startScreen.classList.add('active');
  });

  modeSelect.addEventListener('change', () => {
    // Si la simulación está activa, reiniciar con el nuevo modo
    if (activeScreen.classList.contains('active')) {
      startNextRound();
    }
  });

  gameGridSizeSelect.addEventListener('change', () => {
    // Si la simulación está activa, reiniciar con la nueva grilla
    if (activeScreen.classList.contains('active')) {
      startNextRound();
    }
  });

  // Ejecución inicial de pantalla de estadísticas
  updateStatsDisplay();
}
