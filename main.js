import { sha256, bytesToHex } from './src/core/crypto.js';
import { generateSvg } from './src/core/generator.js';
import { playMnemonicAudio, stopMnemonicAudio, playMismatchSequence, playMatchSequence } from './src/core/audio.js';
import { CognitiveTestSession, generateRandomAddress, generateSimilarAddress } from './src/web/testing.js';
import { checkAddressRegistration, registerMnemonicNft, generateFaucetWallet, setXrplNetwork, getXrplNetwork, connectWallet, registerMnemonicNftNonCustodial } from './src/core/xrpl.js';
import { getAppConfig, isLocalDemoEnabled } from './src/app-config.js';

const testSession = new CognitiveTestSession();

function applyDeploymentSettings() {
  const config = getAppConfig();
  const sample = config.sampleXrplAddress;

  const addressInput = document.getElementById('address-input');
  const compareA = document.getElementById('compare-a-input');
  const compareB = document.getElementById('compare-b-input');
  if (addressInput) addressInput.value = sample;
  if (compareA) compareA.value = sample;
  if (compareB) {
    compareB.value = generateSimilarAddress(sample, 1);
  }

  const xrplNetworkSelect = document.getElementById('xrpl-network-select');
  const xrplWalletSelect = document.getElementById('xrpl-wallet-select');
  const localOption = xrplWalletSelect?.querySelector('option[value="local"]');

  if (!isLocalDemoEnabled() && localOption) {
    localOption.remove();
  }

  if (xrplNetworkSelect) {
    xrplNetworkSelect.value = config.defaultNetwork;
    setXrplNetwork(config.defaultNetwork);
  }

  if (xrplWalletSelect) {
    const hasOption = Array.from(xrplWalletSelect.options).some(o => o.value === config.defaultWallet);
    xrplWalletSelect.value = hasOption ? config.defaultWallet : 'gem';
  }

  const prodBanner = document.getElementById('production-mode-banner');
  if (prodBanner && config.deploymentMode === 'production') {
    prodBanner.style.display = 'flex';
  }

  const xrplConsole = document.getElementById('xrpl-console-log');
  if (xrplConsole) {
    const netLabel = config.defaultNetwork === 'mainnet' ? 'Mainnet' : 'Testnet';
    xrplConsole.textContent = `[info] ${config.deploymentMode} mode — ${netLabel} ready. Connect a wallet to mint your Soulbound identity NFT.`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyDeploymentSettings();
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

    const rawValue = addressInput.value.trim() || getAppConfig().sampleXrplAddress;
    
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
    const rawValue = addressInput.value.trim() || getAppConfig().sampleXrplAddress;
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
      const txHashMatch = cleanMsg.match(/Tx Hash:\s*([A-F0-9]+)/i);
      if (txHashMatch) {
        const txHash = txHashMatch[1];
        const explorerUrl = getXrplNetwork() === 'mainnet' 
          ? `https://livenet.xrpl.org/transactions/${txHash}` 
          : `https://testnet.xrpl.org/transactions/${txHash}`;
        finalMsg += `\n[Explorer] ${explorerUrl}`;
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
          xrplBadgeA.innerHTML = `🛡️ Registered (${netLabel})`;
        } else {
          xrplBadgeA.className = 'xrpl-badge-unregistered';
          xrplBadgeA.innerHTML = '❓ Unregistered';
        }
      });
    } else {
      currentHashA = null;
      previewA.innerHTML = `
        <div class="empty-preview-placeholder">
          <span>🔑</span>
          <p>Waiting for Address A...</p>
        </div>
      `;
      playAudioABtn.disabled = true;
      xrplBadgeA.className = 'xrpl-badge-unregistered';
      xrplBadgeA.innerHTML = '❓ Unregistered';
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
          xrplBadgeB.innerHTML = `🛡️ Registered (${netLabel})`;
        } else {
          xrplBadgeB.className = 'xrpl-badge-unregistered';
          xrplBadgeB.innerHTML = '❓ Unregistered';
        }
      });
    } else {
      currentHashB = null;
      previewB.innerHTML = `
        <div class="empty-preview-placeholder">
          <span>🔑</span>
          <p>Waiting for Address B...</p>
        </div>
      `;
      playAudioBBtn.disabled = true;
      xrplBadgeB.className = 'xrpl-badge-unregistered';
      xrplBadgeB.innerHTML = '❓ Unregistered';
    }

    // Efecto de feedback auditivo al pegar/escribir direcciones
    if (userTriggered) {
      if (valA && valB) {
        if (valA === valB) {
          playMatchSequence();
          statusBadge.className = 'status-badge match';
          statusBadge.innerText = '✓ PERFECT MATCH';
          statusMsg.innerText = 'Both cryptographic and acoustic signatures are identical. Safe to proceed.';
          comparisonGrid.classList.remove('mismatch-detected');
        } else {
          playMismatchSequence();
          statusBadge.className = 'status-badge mismatch';
          statusBadge.innerText = '⚠️ DISCREPANCY DETECTED';
          statusMsg.innerText = 'Warning! Visual and audio signatures differ. Possible phishing attack or corrupted address.';
          comparisonGrid.classList.add('mismatch-detected');
        }
      } else {
        statusBadge.className = 'status-badge neutral';
        statusBadge.innerText = 'WAITING FOR INPUTS';
        statusMsg.innerText = 'Enter or paste two addresses to instantly compare their sensory signature.';
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
      xrplConnStatus.textContent = '🔴 XRPL Disconnected';
      return;
    }

    try {
      if (typeof window.xrpl === 'undefined') {
        throw new Error("XRPL SDK not available.");
      }
      
      const wallet = window.xrpl.Wallet.fromSeed(seed);
      xrplAddressOutput.value = wallet.address;
      generatedSecret = seed;
      
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Connected';
      xrplRegisterMosaicoBtn.disabled = false;
      
      logToXrplConsole(`[info] Valid secret key for: ${wallet.address}`);
    } catch (err) {
      xrplAddressOutput.value = "";
      generatedSecret = null;
      xrplRegisterMosaicoBtn.disabled = true;
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Invalid Secret Key';
    }
  };

  // Función unificada para actualizar el diseño de la interfaz de billeteras
  const updateWalletUILayout = () => {
    const selectedNet = xrplNetworkSelect.value;
    const selectedWallet = xrplWalletSelect.value;

    // Resetear estados al cambiar opciones
    xrplConnStatus.className = 'disconnected';
    xrplConnStatus.textContent = '🔴 XRPL Disconnected';
    xrplRegisterMosaicoBtn.disabled = true;
    generatedSecret = null;

    if (selectedWallet === 'local') {
      xrplSecretContainer.style.display = 'block';
      xrplConnectWalletBtn.style.display = 'none';

      if (selectedNet === 'mainnet') {
        xrplGenWalletBtn.style.display = 'none';
        xrplMainnetWarning.style.display = 'block';

        xrplAddressLabel.textContent = "Autoloaded XRPL Address (from Secret)";
        xrplAddressOutput.value = "";
        xrplAddressOutput.placeholder = "Will be calculated upon entering the Secret...";

        xrplSecretBadge.style.color = "#f43f5e";
        xrplSecretBadge.textContent = "⚠️ Input Required";
        xrplSecretOutput.value = "";
        xrplSecretOutput.placeholder = "Enter your Mainnet secret key (Secret/Seed)...";
        xrplSecretOutput.readOnly = false;
        xrplSecretOutput.removeAttribute('readonly');

        xrplSecretOutput.addEventListener('input', handleManualSecretInput);
      } else {
        xrplGenWalletBtn.style.display = 'block';
        xrplGenWalletBtn.disabled = false;
        xrplMainnetWarning.style.display = 'none';

        xrplAddressLabel.textContent = "XRPL Testnet Faucet Address";
        xrplAddressOutput.value = "";
        xrplAddressOutput.placeholder = "Waiting for generation...";

        xrplSecretBadge.style.color = "#fbbf24";
        xrplSecretBadge.textContent = "⚠️ Local Demo";
        xrplSecretOutput.value = "";
        xrplSecretOutput.placeholder = "Waiting for generation...";
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
      xrplConnectWalletBtn.textContent = `🔗 Connect Wallet (${walletName})`;

      xrplAddressLabel.textContent = `Address linked via ${walletName}`;
      xrplAddressOutput.value = "";
      xrplAddressOutput.placeholder = `Click 'Connect Wallet (${walletName})'...`;
    }
    updateComparison(false);
  };

  // Event Listeners para selectores de configuración de billetera
  xrplNetworkSelect.addEventListener('change', () => {
    const selectedNet = xrplNetworkSelect.value;
    setXrplNetwork(selectedNet);
    logToXrplConsole(`[info] Network changed to ${selectedNet === 'mainnet' ? 'Mainnet' : 'Testnet'}. Ready to connect.`);
    updateWalletUILayout();
  });

  xrplWalletSelect.addEventListener('change', () => {
    logToXrplConsole(`[info] Method changed to ${xrplWalletSelect.value}.`);
    updateWalletUILayout();
  });

  // Event Listeners del Panel XRPL
  xrplGenWalletBtn.addEventListener('click', async () => {
    xrplGenWalletBtn.disabled = true;
    xrplConnStatus.className = 'connecting';
    xrplConnStatus.textContent = '🟡 Connecting...';
    
    try {
      const walletData = await generateFaucetWallet(logToXrplConsole);
      
      xrplAddressOutput.value = walletData.address;
      xrplSecretOutput.value = walletData.seed;
      generatedSecret = walletData.seed;
      
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Connected';
      xrplRegisterMosaicoBtn.disabled = false;
    } catch (err) {
      logToXrplConsole(`[error] Connection or faucet failure: ${err.message}`);
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Connection Failed';
    } finally {
      xrplGenWalletBtn.disabled = false;
    }
  });

  xrplConnectWalletBtn.addEventListener('click', async () => {
    xrplConnectWalletBtn.disabled = true;
    xrplConnStatus.className = 'connecting';
    xrplConnStatus.textContent = '🟡 Connecting...';
    
    const walletType = xrplWalletSelect.value;
    const walletName = walletType === 'gem' ? 'Gem Wallet' : (walletType === 'crossmark' ? 'Crossmark' : 'Xaman');

    try {
      const address = await connectWallet(walletType, logToXrplConsole);
      
      xrplAddressOutput.value = address;
      xrplConnStatus.className = 'connected';
      xrplConnStatus.textContent = '🟢 XRPL Connected';
      xrplRegisterMosaicoBtn.disabled = false;
      
      logToXrplConsole(`[info] ${walletName} wallet connected: ${address}`);
    } catch (err) {
      logToXrplConsole(`[error] Wallet connection error: ${err.message}`);
      xrplConnStatus.className = 'disconnected';
      xrplConnStatus.textContent = '🔴 Connection Failed';
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
        logToXrplConsole(`[info] Submitting XLS-20 Soulbound NFT mint on ${netName}...`);
        res = await registerMnemonicNft(generatedSecret, logToXrplConsole);
      } else {
        const address = xrplAddressOutput.value.trim();
        if (!address) {
          throw new Error("No connected wallet address.");
        }
        res = await registerMnemonicNftNonCustodial(address, walletType, logToXrplConsole);
      }
      
      if (res && res.success) {
        logToXrplConsole(`[info] Immutable ${netName} registration verified!`);
        updateComparison(false);
      }
    } catch (err) {
      logToXrplConsole(`[error] Registration error: ${err.message}`);
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
      statsAnalysisText.innerHTML = `Perform at least <strong>3 tests in each mode</strong> to evaluate cognitive performance. <br>(Progress: Harmonious ${h.total}/3, Chaotic ${c.total}/3)`;
    } else {
      let analysis = "<strong>Field study conclusions:</strong><br>";
      
      if (h.successRate === c.successRate) {
        analysis += "Both modes achieved a similar success rate. ";
        if (h.avgTime < c.avgTime) {
          analysis += `However, **Harmonious Mode** allowed identifying the target **${Math.round((c.avgTime - h.avgTime)*100)/100}s faster**, suggesting less visual fatigue.`;
        } else if (c.avgTime < h.avgTime) {
          analysis += `However, **Chaotic Mode** was **${Math.round((h.avgTime - c.avgTime)*100)/100}s faster** due to high color contrast differences.`;
        } else {
          analysis += "Both recorded identical reaction times.";
        }
      } else if (h.successRate > c.successRate) {
        analysis += `**Harmonious Mode** achieved higher accuracy (**${h.successRate}% success** vs ${c.successRate}% for chaotic). Color unification helps structure and compare geometric patterns without overloading the mind with chromatic noise.`;
      } else {
        analysis += `**Chaotic Mode** achieved higher accuracy (**${c.successRate}% success** vs ${h.successRate}% for harmonious). Radical color contrast between cells helps quickly discard visual impostors.`;
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
      playOptAudioBtn.innerHTML = '<span>🔊</span> Listen';

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
    const text = `🎯 My success streak in the Cryptographic Mosaic Simulator is ${streak}! I completed ${total} security checks on XRPL addresses without falling for phishing. Test your visual speed! 💠 #XRPL #MakeWaves`;
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
