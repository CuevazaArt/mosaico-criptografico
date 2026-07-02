import { sha256, bytesToHex } from './src/core/crypto.js';
import { generateSvg } from './src/core/generator.js';
import { playMnemonicAudio, stopMnemonicAudio, playMismatchSequence, playMatchSequence } from './src/core/audio.js';
import { CognitiveTestSession, generateRandomAddress, generateSimilarAddress } from './src/web/testing.js';
import { checkAddressRegistration, registerMnemonicNft, generateFaucetWallet, setXrplNetwork, getXrplNetwork, connectWallet, registerMnemonicNftNonCustodial } from './src/core/xrpl.js';

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
  const forceMatchBtn = document.getElementById('force-match-btn');
  const compareGridSizeSelect = document.getElementById('compare-grid-size-select');
  const playAudioABtn = document.getElementById('play-audio-a-btn');
  const playAudioBBtn = document.getElementById('play-audio-b-btn');
  
  const previewA = document.getElementById('compare-a-preview');
  const previewB = document.getElementById('compare-b-preview');
  const statusBadge = document.getElementById('comparison-badge');
  const statusMsg = document.getElementById('comparison-msg');
  const comparisonGrid = document.querySelector('.comparison-grid');

  // Elementos de la UI de XRPL
  const xrplNetworkSelect = document.getElementById('xrpl-network-select');
  const xrplWalletSelect = document.getElementById('xrpl-wallet-select');
  const xrplConnStatus = document.getElementById('xrpl-connection-status');
  const xrplMainnetWarning = document.getElementById('xrpl-mainnet-warning');
  const xrplGenWalletBtn = document.getElementById('xrpl-generate-wallet-btn');
  const xrplConnectWalletBtn = document.getElementById('xrpl-connect-wallet-btn');
  const xrplAddressLabel = document.getElementById('xrpl-address-label');
  const xrplAddressOutput = document.getElementById('xrpl-address-output');
  const xrplSecretContainer = document.getElementById('xrpl-secret-container');
  const xrplSecretBadge = document.getElementById('xrpl-secret-badge');
  const xrplSecretOutput = document.getElementById('xrpl-secret-output');
  const xrplRegisterMosaicoBtn = document.getElementById('xrpl-register-mosaico-btn');
  const xrplConsoleLog = document.getElementById('xrpl-console-log');
  const xrplBadgeA = document.getElementById('xrpl-badge-a');
  const xrplBadgeB = document.getElementById('xrpl-badge-b');

  let currentHashA = null;
  let currentHashB = null;
  let isInitialLoad = true;
  let generatedSecret = null;

  // Consola de logs en UI con soporte para links de transacciones
  const logToXrplConsole = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const cleanMsg = msg.replace(/\[red\]/g, '').replace(/\[info\]/g, '');
    let finalMsg = cleanMsg;
    
    // Si contiene "Hash de Tx: <hash>", agregar link del explorador
    const txHashMatch = cleanMsg.match(/Hash de Tx:\s*([A-F0-9]+)/i);
    if (txHashMatch) {
      const txHash = txHashMatch[1];
      const explorerUrl = getXrplNetwork() === 'mainnet' 
        ? `https://livenet.xrpl.org/transactions/${txHash}` 
        : `https://testnet.xrpl.org/transactions/${txHash}`;
      finalMsg += `\n[Explorador] ${explorerUrl}`;
    }
    
    xrplConsoleLog.innerText += `\n[${timestamp}] ${finalMsg}`;
    xrplConsoleLog.scrollTop = xrplConsoleLog.scrollHeight;
  };

  const updateComparison = async (userTriggered = false) => {
    // Parar audio activo al cambiar entradas
    stopMnemonicAudio();

    const valA = compareA.value.trim();
    const valB = compareB.value.trim();
    const gridSize = parseInt(compareGridSizeSelect.value) || 3;
    const netLabel = getXrplNetwork() === 'mainnet' ? 'Mainnet' : 'Testnet';

    // Controlar vistas previas individuales
    if (valA) {
      const hashA = await sha256(valA);
      currentHashA = hashA;
      previewA.innerHTML = generateSvg(hashA, valA, { chaoticMode: false, showOverlay: true, showAnchors: true, gridSize });
      playAudioABtn.disabled = false;
      
      // Consultar registro XRPL de forma asíncrona
      checkAddressRegistration(valA, logToXrplConsole).then(isReg => {
        if (isReg) {
          xrplBadgeA.className = 'xrpl-badge-registered';
          xrplBadgeA.innerHTML = `🛡️ Registrado (${netLabel})`;
        } else {
          xrplBadgeA.className = 'xrpl-badge-unregistered';
          xrplBadgeA.innerHTML = '❓ No Registrado';
        }
      });
    } else {
      currentHashA = null;
      previewA.innerHTML = `
        <div class="empty-preview-placeholder">
          <span>🔑</span>
          <p>Esperando Dirección A...</p>
        </div>
      `;
      playAudioABtn.disabled = true;
      xrplBadgeA.className = 'xrpl-badge-unregistered';
      xrplBadgeA.innerHTML = '❓ No Registrado';
    }

    if (valB) {
      const hashB = await sha256(valB);
      currentHashB = hashB;
      previewB.innerHTML = generateSvg(hashB, valB, { chaoticMode: false, showOverlay: true, showAnchors: true, gridSize });
      playAudioBBtn.disabled = false;

      // Consultar registro XRPL de forma asíncrona
      checkAddressRegistration(valB, logToXrplConsole).then(isReg => {
        if (isReg) {
          xrplBadgeB.className = 'xrpl-badge-registered';
          xrplBadgeB.innerHTML = `🛡️ Registrado (${netLabel})`;
        } else {
          xrplBadgeB.className = 'xrpl-badge-unregistered';
          xrplBadgeB.innerHTML = '❓ No Registrado';
        }
      });
    } else {
      currentHashB = null;
      previewB.innerHTML = `
        <div class="empty-preview-placeholder">
          <span>🔑</span>
          <p>Esperando Dirección B...</p>
        </div>
      `;
      playAudioBBtn.disabled = true;
      xrplBadgeB.className = 'xrpl-badge-unregistered';
      xrplBadgeB.innerHTML = '❓ No Registrado';
    }

    // Efecto de feedback auditivo al pegar/escribir direcciones
    if (userTriggered) {
      if (valA && valB) {
        if (valA === valB) {
          playMatchSequence();
          statusBadge.className = 'status-badge match';
          statusBadge.innerText = '✓ COINCIDENCIA PERFECTA';
          statusMsg.innerText = 'Ambas firmas criptográficas y acústicas son idénticas. Es seguro proceder.';
          comparisonGrid.classList.remove('mismatch-detected');
        } else {
          playMismatchSequence();
          statusBadge.className = 'status-badge mismatch';
          statusBadge.innerText = '⚠️ DISCREPANCIA DETECTADA';
          statusMsg.innerText = '¡Alerta! Las firmas visuales y de audio difieren. Posible ataque de phishing o dirección corrupta.';
          comparisonGrid.classList.add('mismatch-detected');
        }
      } else {
        statusBadge.className = 'status-badge neutral';
        statusBadge.innerText = 'ESPERANDO ENTRADAS';
        statusMsg.innerText = 'Ingresa o pega dos direcciones para comparar instantáneamente su firma sensorial.';
        comparisonGrid.classList.remove('mismatch-detected');
      }
    }

    isInitialLoad = false;
  };

  // Manejador para entrada de semilla manual en Mainnet
  const handleManualSecretInput = () => {
    const seed = xrplSecretOutput.value.trim();
    if (!seed) {
      xrplAddressOutput.value = "";
      xrplRegisterMosaicoBtn.disabled = true;
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 XRPL Desconectado';
      return;
    }

    try {
      if (typeof window.xrpl === 'undefined') {
        throw new Error("SDK de XRPL no disponible.");
      }
      
      const wallet = window.xrpl.Wallet.fromSeed(seed);
      xrplAddressOutput.value = wallet.address;
      generatedSecret = seed;
      
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Conectado';
      xrplRegisterMosaicoBtn.disabled = false;
      
      logToXrplConsole(`[info] Clave secreta válida para: ${wallet.address}`);
    } catch (err) {
      xrplAddressOutput.value = "";
      generatedSecret = null;
      xrplRegisterMosaicoBtn.disabled = true;
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Clave Secreta Inválida';
    }
  };

  // Función unificada para actualizar el diseño de la interfaz de billeteras
  const updateWalletUILayout = () => {
    const selectedNet = xrplNetworkSelect.value;
    const selectedWallet = xrplWalletSelect.value;

    // Resetear estados al cambiar opciones
    xrplConnStatus.className = 'disconnected';
    xrplConnStatus.textContent = '🔴 XRPL Desconectado';
    xrplRegisterMosaicoBtn.disabled = true;
    generatedSecret = null;

    if (selectedWallet === 'local') {
      xrplSecretContainer.style.display = 'block';
      xrplConnectWalletBtn.style.display = 'none';

      if (selectedNet === 'mainnet') {
        xrplGenWalletBtn.style.display = 'none';
        xrplMainnetWarning.style.display = 'block';

        xrplAddressLabel.textContent = "Dirección XRPL Autocargada (desde Secret)";
        xrplAddressOutput.value = "";
        xrplAddressOutput.placeholder = "Se calculará al ingresar el Secret...";

        xrplSecretBadge.style.color = "#f43f5e";
        xrplSecretBadge.textContent = "⚠️ Entrada Requerida";
        xrplSecretOutput.value = "";
        xrplSecretOutput.placeholder = "Ingresa tu clave secreta (Secret/Seed) de Mainnet...";
        xrplSecretOutput.readOnly = false;
        xrplSecretOutput.removeAttribute('readonly');

        xrplSecretOutput.addEventListener('input', handleManualSecretInput);
      } else {
        xrplGenWalletBtn.style.display = 'block';
        xrplGenWalletBtn.disabled = false;
        xrplMainnetWarning.style.display = 'none';

        xrplAddressLabel.textContent = "Dirección XRPL Testnet Faucet";
        xrplAddressOutput.value = "";
        xrplAddressOutput.placeholder = "Esperando generación...";

        xrplSecretBadge.style.color = "#fbbf24";
        xrplSecretBadge.textContent = "⚠️ Demostración Local";
        xrplSecretOutput.value = "";
        xrplSecretOutput.placeholder = "Esperando generación...";
        xrplSecretOutput.readOnly = true;
        xrplSecretOutput.setAttribute('readonly', 'true');

        xrplSecretOutput.removeEventListener('input', handleManualSecretInput);
      }
    } else {
      // Billeteras no custodias
      xrplSecretContainer.style.display = 'none';
      xrplGenWalletBtn.style.display = 'none';
      xrplMainnetWarning.style.display = 'none';
      xrplSecretOutput.removeEventListener('input', handleManualSecretInput);

      xrplConnectWalletBtn.style.display = 'block';
      xrplConnectWalletBtn.disabled = false;

      const walletName = selectedWallet === 'gem' ? 'Gem Wallet' : (selectedWallet === 'crossmark' ? 'Crossmark' : 'Xaman');
      xrplConnectWalletBtn.textContent = `🔗 Conectar Billetera (${walletName})`;

      xrplAddressLabel.textContent = `Dirección vinculada via ${walletName}`;
      xrplAddressOutput.value = "";
      xrplAddressOutput.placeholder = `Haz clic en 'Conectar Billetera (${walletName})'...`;
    }
    updateComparison(false);
  };

  // Event Listeners para selectores de configuración de billetera
  xrplNetworkSelect.addEventListener('change', () => {
    const selectedNet = xrplNetworkSelect.value;
    setXrplNetwork(selectedNet);
    logToXrplConsole(`[info] Red cambiada a ${selectedNet === 'mainnet' ? 'Mainnet' : 'Testnet'}. Listo para conectar.`);
    updateWalletUILayout();
  });

  xrplWalletSelect.addEventListener('change', () => {
    logToXrplConsole(`[info] Método cambiado a ${xrplWalletSelect.value}.`);
    updateWalletUILayout();
  });

  // Event Listeners del Panel XRPL
  xrplGenWalletBtn.addEventListener('click', async () => {
    xrplGenWalletBtn.disabled = true;
    xrplConnStatus.className = 'connecting';
    xrplConnStatus.textContent = '🟡 Conectando...';
    
    try {
      const walletData = await generateFaucetWallet(logToXrplConsole);
      
      xrplAddressOutput.value = walletData.address;
      xrplSecretOutput.value = walletData.seed;
      generatedSecret = walletData.seed;
      
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Conectado';
      xrplRegisterMosaicoBtn.disabled = false;
    } catch (err) {
      logToXrplConsole(`[error] Falla de conexión o faucet: ${err.message}`);
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Conexión Fallida';
    } finally {
      xrplGenWalletBtn.disabled = false;
    }
  });

  xrplConnectWalletBtn.addEventListener('click', async () => {
    xrplConnectWalletBtn.disabled = true;
    xrplConnStatus.className = 'connecting';
    xrplConnStatus.textContent = '🟡 Conectando...';
    
    const walletType = xrplWalletSelect.value;
    const walletName = walletType === 'gem' ? 'Gem Wallet' : (walletType === 'crossmark' ? 'Crossmark' : 'Xaman');

    try {
      const address = await connectWallet(walletType, logToXrplConsole);
      
      xrplAddressOutput.value = address;
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Conectado';
      xrplRegisterMosaicoBtn.disabled = false;
      
      logToXrplConsole(`[info] Billetera ${walletName} conectada con dirección: ${address}`);
    } catch (err) {
      logToXrplConsole(`[error] Error conectando wallet: ${err.message}`);
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Conexión Fallida';
      xrplAddressOutput.value = "";
      xrplRegisterMosaicoBtn.disabled = true;
    } finally {
      xrplConnectWalletBtn.disabled = false;
    }
  });

  xrplRegisterMosaicoBtn.addEventListener('click', async () => {
    xrplRegisterMosaicoBtn.disabled = true;
    const walletType = xrplWalletSelect.value;
    const netName = getXrplNetwork() === 'mainnet' ? 'Mainnet' : 'Testnet';
    
    try {
      let res;
      if (walletType === 'local') {
        if (!generatedSecret) return;
        logToXrplConsole(`[info] Enviando minteo XLS-20 (Soulbound NFT) en ${netName}...`);
        res = await registerMnemonicNft(generatedSecret, logToXrplConsole);
      } else {
        const address = xrplAddressOutput.value.trim();
        if (!address) {
          throw new Error("No hay dirección de billetera conectada.");
        }
        res = await registerMnemonicNftNonCustodial(address, walletType, logToXrplConsole);
      }
      
      if (res && res.success) {
        logToXrplConsole(`[info] ¡Registro inmutable en ${netName} verificado!`);
        updateComparison(false);
      }
    } catch (err) {
      logToXrplConsole(`[error] Error al registrar: ${err.message}`);
    } finally {
      xrplRegisterMosaicoBtn.disabled = false;
    }
  });

  // Eventos de entrada y botones generales del comparador
  compareA.addEventListener('input', () => updateComparison(true));
  compareB.addEventListener('input', () => updateComparison(true));
  compareGridSizeSelect.addEventListener('change', () => updateComparison(false));

  playAudioABtn.addEventListener('click', () => {
    if (currentHashA) {
      const gridSize = parseInt(compareGridSizeSelect.value) || 3;
      playMnemonicAudio(currentHashA, { gridSize, chaoticMode: false });
    }
  });

  playAudioBBtn.addEventListener('click', () => {
    if (currentHashB) {
      const gridSize = parseInt(compareGridSizeSelect.value) || 3;
      playMnemonicAudio(currentHashB, { gridSize, chaoticMode: false });
    }
  });

  simulatePhishingBtn.addEventListener('click', () => {
    if (compareA.value) {
      compareB.value = generateSimilarAddress(compareA.value.trim(), 1);
      updateComparison(true);
    }
  });

  forceMatchBtn.addEventListener('click', () => {
    if (compareA.value) {
      compareB.value = compareA.value.trim();
      updateComparison(true);
    }
  });

  // Ejecución inicial
  updateWalletUILayout();
}

/* ----------------------------------------------------
   4. SECCIÓN: SIMULADOR DE PRUEBAS DE CAMPO
   ---------------------------------------------------- */
function initTestingSuite() {
  const startBtn = document.getElementById('start-game-btn');
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  const shareStatsBtn = document.getElementById('share-stats-btn');
  const modeSelect = document.getElementById('game-mode-select');
  const gameGridSizeSelect = document.getElementById('game-grid-size-select');
  const playGameTargetAudioBtn = document.getElementById('play-game-target-audio-btn');
  
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
  let currentTargetHash = null;

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
    // Parar cualquier audio activo al pasar de ronda
    stopMnemonicAudio();

    isLockingInput = false;
    const mode = modeSelect.value; // 'harmonious' | 'chaotic'
    const gridSize = parseInt(gameGridSizeSelect.value) || 3;
    
    // Iniciar prueba en lógica
    const trialData = testSession.startNewTrial(mode);
    const isChaotic = (trialData.mode === 'chaotic');

    // Obtener hash del objetivo para renderizarlo
    const targetHash = await sha256(trialData.targetAddress);
    currentTargetHash = targetHash;

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

      // Botón para reproducir la firma acústica de esta opción específica (para comparación por oído)
      const playOptAudioBtn = document.createElement('button');
      playOptAudioBtn.className = 'btn-tiny';
      playOptAudioBtn.style.marginTop = '0.3rem';
      playOptAudioBtn.style.padding = '2px 8px';
      playOptAudioBtn.style.fontSize = '0.75rem';
      playOptAudioBtn.style.display = 'flex';
      playOptAudioBtn.style.alignItems = 'center';
      playOptAudioBtn.style.gap = '0.25rem';
      playOptAudioBtn.innerHTML = '<span>🔊</span> Oír';

      playOptAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevenir que el click active la selección y termine el turno
        playMnemonicAudio(optHash, { gridSize, chaoticMode: isChaotic });
      });

      card.appendChild(svgContainer);
      card.appendChild(addrLabel);
      card.appendChild(playOptAudioBtn);

      // Evento de clic en la tarjeta de opción
      card.addEventListener('click', () => {
        if (isLockingInput) return;
        isLockingInput = true; // Bloquear clicks repetidos
        
        // Detener el temporizador de inmediato
        stopLiveTimer();
        stopMnemonicAudio();

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
    stopMnemonicAudio();
    testSession.clearHistory();
    updateStatsDisplay();
    activeScreen.classList.remove('active');
    startScreen.classList.add('active');
  });

  shareStatsBtn.addEventListener('click', () => {
    const stats = testSession.getStats();
    const total = stats.totalTrials;
    const streak = stats.currentStreak;
    const text = `🎯 ¡Mi racha en el Simulador de Mosaico Criptográfico es de ${streak} aciertos! He completado ${total} evaluaciones de seguridad de direcciones de XRPL sin caer en phishing. ¡Mide tu velocidad visual! 💠 #XRPL #MakeWaves`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
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

  playGameTargetAudioBtn.addEventListener('click', () => {
    if (currentTargetHash) {
      const mode = modeSelect.value;
      const gridSize = parseInt(gameGridSizeSelect.value) || 3;
      playMnemonicAudio(currentTargetHash, {
        gridSize,
        chaoticMode: (mode === 'chaotic')
      });
    }
  });

  // Ejecución inicial de pantalla de estadísticas
  updateStatsDisplay();
}
