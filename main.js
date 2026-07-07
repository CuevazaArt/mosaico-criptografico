import { sha256, bytesToHex } from './src/core/crypto.js';
import { generateSvg } from './src/core/generator.js';
import { playMnemonicAudio, stopMnemonicAudio, playMismatchSequence, playMatchSequence } from './src/core/audio.js';
import { CognitiveTestSession, generateRandomAddress, generateSimilarAddress } from './src/web/testing.js';
import { checkAddressRegistration, registerMnemonicNft, generateFaucetWallet, setXrplNetwork, getXrplNetwork, connectWallet, registerMnemonicNftNonCustodial, burnMnemonicNftNonCustodial, burnMnemonicNft, findMosaicNft } from './src/core/xrpl.js';
import { getAppConfig, isLocalDemoEnabled } from './src/app-config.js';
import { initOnboarding, onTabChanged, onComparisonResult, showToast, registerWalletApproachHandlers, hasAcceptedTerms } from './src/web/onboarding.js';
import { initKeychainWizard } from './src/web/keychain-wizard.js';
import { initCostConfirmModal, confirmMintCosts, confirmBurnCosts } from './src/web/cost-confirm.js';
import { initFirstUseGuide } from './src/web/first-use-guide.js';

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
    xrplWalletSelect.value = hasOption ? config.defaultWallet : 'xaman';
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
  initOnboarding();
  initCostConfirmModal();
  initFirstUseGuide();
  initKeychainWizard();
  initTabs();
  initGenerator();
  initComparator();
  initTestingSuite();
});

/* ----------------------------------------------------
   1. TAB CONTROLLER
   ---------------------------------------------------- */
function initTabs() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.tab-panel');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Stop any playing audio when switching tabs
      stopMnemonicAudio();

      // Toggle active classes on buttons
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle content panels
      panels.forEach(p => {
        if (p.id === targetTab) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });

      onTabChanged(targetTab);
    });
  });
}

/* ----------------------------------------------------
   2. GENERATOR SECTION
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
    // Stop audio if something is playing
    stopMnemonicAudio();

    const rawValue = addressInput.value.trim() || getAppConfig().sampleXrplAddress;
    
    // 1. Compute cryptographic hash
    const hash = await sha256(rawValue);
    
    // 2. Display hex hash in the UI
    fullHashCode.textContent = bytesToHex(hash);

    // 3. Determine active chroma mode
    const chromaMode = document.querySelector('input[name="chroma-mode"]:checked').value;
    
    // 4. Render SVG
    const svgString = generateSvg(hash, rawValue, {
      chaoticMode: (chromaMode === 'chaotic'),
      showOverlay: overlayCheckbox.checked,
      showAnchors: anchorsCheckbox.checked,
      gridSize: parseInt(gridSizeSelect.value) || 3
    });

    // 5. Inject SVG into preview
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

  // Play acoustic signature
  playAudioBtn.addEventListener('click', async () => {
    const rawValue = addressInput.value.trim() || getAppConfig().sampleXrplAddress;
    const hash = await sha256(rawValue);
    const chromaMode = document.querySelector('input[name="chroma-mode"]:checked').value;
    playMnemonicAudio(hash, {
      gridSize: parseInt(gridSizeSelect.value) || 3,
      chaoticMode: (chromaMode === 'chaotic')
    });
  });

  // Initial render
  updateGenerator();
}

/* ----------------------------------------------------
   3. SIDE-BY-SIDE COMPARATOR
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

  // XRPL UI elements
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
  const xrplUnmintMosaicoBtn = document.getElementById('xrpl-unmint-mosaico-btn');
  const xrplConsoleLog = document.getElementById('xrpl-console-log');
  const xrplBadgeA = document.getElementById('xrpl-badge-a');
  const xrplBadgeB = document.getElementById('xrpl-badge-b');

  let currentHashA = null;
  let currentHashB = null;
  let isInitialLoad = true;
  let generatedSecret = null;

    // UI log console with transaction link support
    const logToXrplConsole = (msg) => {
      const timestamp = new Date().toLocaleTimeString();
      const cleanMsg = msg.replace(/\[red\]/g, '').replace(/\[info\]/g, '');
      let finalMsg = cleanMsg;
      
      // If message contains "Tx Hash: <hash>", append explorer link
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

  const updateRegistryMintBurnButtons = async (address) => {
    if (!xrplUnmintMosaicoBtn || !xrplRegisterMosaicoBtn) return;
    if (!address || xrplWalletSelect.value === 'local') {
      xrplUnmintMosaicoBtn.style.display = 'none';
      xrplUnmintMosaicoBtn.disabled = true;
      return;
    }
    try {
      const nft = await findMosaicNft(address, () => {});
      if (nft) {
        xrplUnmintMosaicoBtn.style.display = 'block';
        xrplUnmintMosaicoBtn.disabled = false;
        xrplRegisterMosaicoBtn.disabled = true;
      } else {
        xrplUnmintMosaicoBtn.style.display = 'none';
        xrplUnmintMosaicoBtn.disabled = true;
        if (xrplAddressOutput.value.trim()) {
          xrplRegisterMosaicoBtn.disabled = false;
        }
      }
    } catch {
      xrplUnmintMosaicoBtn.style.display = 'none';
    }
  };

  const updateComparison = async (userTriggered = false) => {
    // Stop active audio when inputs change
    stopMnemonicAudio();

    const valA = compareA.value.trim();
    const valB = compareB.value.trim();
    const gridSize = parseInt(compareGridSizeSelect.value) || 3;
    const netLabel = getXrplNetwork() === 'mainnet' ? 'Mainnet' : 'Testnet';

    // Update individual previews
    if (valA) {
      const hashA = await sha256(valA);
      currentHashA = hashA;
      previewA.innerHTML = generateSvg(hashA, valA, { chaoticMode: false, showOverlay: true, showAnchors: true, gridSize });
      playAudioABtn.disabled = false;
      
      // Query XRPL registration asynchronously
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

      // Query XRPL registration asynchronously
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

    if (userTriggered) {
      if (valA && valB) {
        if (valA === valB) {
          playMatchSequence();
          statusBadge.className = 'status-badge match';
          statusBadge.innerText = '✓ MATCH';
          statusMsg.innerText = 'Visual and acoustic signatures are identical. You may proceed with caution.';
          comparisonGrid.classList.remove('mismatch-detected');
          onComparisonResult(true);
        } else {
          playMismatchSequence();
          statusBadge.className = 'status-badge mismatch';
          statusBadge.innerText = '⚠️ MISMATCH';
          statusMsg.innerText = 'Alert! Mosaics differ. Possible phishing or corrupted address — do not sign.';
          comparisonGrid.classList.add('mismatch-detected');
          onComparisonResult(false);
        }
      } else {
        statusBadge.className = 'status-badge neutral';
        statusBadge.innerText = 'AWAITING INPUT';
        statusMsg.innerText = 'Paste two addresses to compare their sensory signatures instantly.';
        comparisonGrid.classList.remove('mismatch-detected');
      }
    }

    isInitialLoad = false;
  };

  // Handler for manual seed input on Mainnet (local demo only)
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

  // Unified function to update wallet interface layout
  const updateWalletUILayout = () => {
    const selectedNet = xrplNetworkSelect.value;
    const selectedWallet = xrplWalletSelect.value;

    // Reset state when options change
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
        xrplSecretBadge.textContent = "⚠️ Testnet only";
        xrplSecretOutput.value = "";
        xrplSecretOutput.placeholder = "Waiting for generation...";
        xrplSecretOutput.readOnly = true;
        xrplSecretOutput.setAttribute('readonly', 'true');

        xrplSecretOutput.removeEventListener('input', handleManualSecretInput);
      }
    } else {
      // Non-custodial wallets
      xrplSecretContainer.style.display = 'none';
      xrplGenWalletBtn.style.display = 'none';
      xrplMainnetWarning.style.display = 'none';
      xrplSecretOutput.removeEventListener('input', handleManualSecretInput);

      xrplConnectWalletBtn.style.display = 'block';
      xrplConnectWalletBtn.disabled = false;

      const walletName = selectedWallet === 'gem' ? 'Gem Wallet' : (selectedWallet === 'crossmark' ? 'Crossmark' : 'Xaman');
      const connectLabels = {
        xaman: '📱 Connect Xaman (mobile / QR)',
        gem: '💎 Connect Gem Wallet',
        crossmark: '🔗 Connect Crossmark'
      };
      xrplConnectWalletBtn.textContent = connectLabels[selectedWallet] || `🔗 Connect ${walletName}`;

      xrplAddressLabel.textContent = `Address linked via ${walletName}`;
      xrplAddressOutput.value = "";
      xrplAddressOutput.placeholder = selectedWallet === 'xaman'
        ? 'Press "Connect Xaman" and authorize on your phone...'
        : `Press connect ${walletName}...`;
    }
    updateComparison(false);
  };

  const requireTermsAccepted = () => {
    if (hasAcceptedTerms()) return true;
    showToast('Accept the Terms of Use before connecting a wallet or signing on-chain.', 'warn', 6000);
    return false;
  };

  const triggerWalletConnect = () => {
    if (!requireTermsAccepted()) return;
    xrplConnectWalletBtn.click();
  };

  const setWalletType = (type) => {
    if (xrplWalletSelect.querySelector(`option[value="${type}"]`)) {
      xrplWalletSelect.value = type;
      logToXrplConsole(`[info] Wallet selected: ${type}.`);
      updateWalletUILayout();
    }
  };

  const switchToComparatorTab = () => {
    const comparatorBtn = document.querySelector('.nav-btn[data-tab="comparator-tab"]');
    comparatorBtn?.click();
  };

  registerWalletApproachHandlers({
    switchToComparator: switchToComparatorTab,
    setWalletType,
    connectWallet: triggerWalletConnect
  });

  // Event listeners for wallet configuration selectors
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

  // XRPL panel event listeners
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
    if (!requireTermsAccepted()) return;
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
      updateRegistryMintBurnButtons(address);
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
    if (!requireTermsAccepted()) return;
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
        const accepted = await confirmMintCosts(address, logToXrplConsole);
        if (!accepted) {
          logToXrplConsole('[info] Mint cancelled by user.');
          return;
        }
        res = await registerMnemonicNftNonCustodial(address, walletType, logToXrplConsole);
      }

      if (res && res.success) {
        logToXrplConsole(`[info] Immutable ${netName} registration verified!`);
        updateComparison(false);
        updateRegistryMintBurnButtons(xrplAddressOutput.value.trim());
      }
    } catch (err) {
      logToXrplConsole(`[error] Registration error: ${err.message}`);
    } finally {
      xrplRegisterMosaicoBtn.disabled = false;
      updateRegistryMintBurnButtons(xrplAddressOutput.value.trim());
    }
  });

  xrplUnmintMosaicoBtn?.addEventListener('click', async () => {
    if (!requireTermsAccepted()) return;
    const walletType = xrplWalletSelect.value;
    const address = xrplAddressOutput.value.trim();
    if (!address || walletType === 'local') return;

    const accepted = await confirmBurnCosts(address, logToXrplConsole);
    if (!accepted) {
      logToXrplConsole('[info] Burn cancelled by user.');
      return;
    }

    xrplUnmintMosaicoBtn.disabled = true;
    try {
      let res;
      if (walletType === 'local') {
        res = await burnMnemonicNft(generatedSecret, logToXrplConsole);
      } else {
        res = await burnMnemonicNftNonCustodial(address, walletType, logToXrplConsole);
      }
      if (res?.success) {
        logToXrplConsole('[info] NFT burned — owner reserve returned to your account.');
        showToast('Reserve reclaimed. On-chain registration removed.', 'success', 6000);
        updateComparison(false);
      }
    } catch (err) {
      logToXrplConsole(`[error] Burn error: ${err.message}`);
      showToast(err.message || 'Burn failed.', 'warn', 6000);
    } finally {
      updateRegistryMintBurnButtons(address);
    }
  });

  // Comparator input events and buttons
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
      showToast('Phishing simulation: one center character was altered. Watch the mosaic change.', 'warn', 5500);
    }
  });

  forceMatchBtn.addEventListener('click', () => {
    if (compareA.value) {
      compareB.value = compareA.value.trim();
      updateComparison(true);
    }
  });

  // Initial wallet UI setup
  updateWalletUILayout();
}

/* ----------------------------------------------------
   4. FIELD TESTING SIMULATOR
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
    }, 41); // ~24 FPS — smooth millisecond animation without overload
  };

  const stopLiveTimer = () => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  };

  const updateStatsDisplay = () => {
    const stats = testSession.getStats();
    
    // Render harmonious stats
    statHarmCount.textContent = stats.harmonious.total;
    statHarmSuccess.textContent = `${stats.harmonious.successRate}%`;
    statHarmTime.textContent = `${stats.harmonious.avgTime}s`;

    // Render chaotic stats
    statChaoCount.textContent = stats.chaotic.total;
    statChaoSuccess.textContent = `${stats.chaotic.successRate}%`;
    statChaoTime.textContent = `${stats.chaotic.avgTime}s`;

    // Render perfect streak
    statCurrentStreak.textContent = stats.currentStreak;
    statStreakAvgTime.textContent = stats.avgStreakTime !== null ? `${stats.avgStreakTime}s` : 'N/A';
    
    // Visual highlight when streak reaches 5+
    if (stats.currentStreak >= 5) {
      statCurrentStreak.style.color = 'var(--secondary)';
      statCurrentStreak.style.textShadow = '0 0 10px var(--secondary-glow)';
    } else {
      statCurrentStreak.style.color = '#fff';
      statCurrentStreak.style.textShadow = 'none';
    }

    // Automated analysis text
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
    // Stop any active audio when advancing rounds
    stopMnemonicAudio();

    isLockingInput = false;
    const mode = modeSelect.value; // 'harmonious' | 'chaotic'
    const gridSize = parseInt(gameGridSizeSelect.value) || 3;
    
    // Start trial in session logic
    const trialData = testSession.startNewTrial(mode);
    const isChaotic = (trialData.mode === 'chaotic');

    // Hash target address for rendering
    const targetHash = await sha256(trialData.targetAddress);
    currentTargetHash = targetHash;

    // Render target without text overlay to force pure visual recognition
    targetPreview.innerHTML = generateSvg(targetHash, trialData.targetAddress, {
      chaoticMode: isChaotic,
      showOverlay: false,
      showAnchors: true,
      gridSize
    });

    // Clear options container
    optionsContainer.innerHTML = '';

    // Render 6 option cards
    for (const address of trialData.options) {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.address = address;

      const optHash = await sha256(address);
      const svgContainer = document.createElement('div');
      svgContainer.className = 'identicon-option-container';
      
      // Render option without overlay for pure visual comparison
      svgContainer.innerHTML = generateSvg(optHash, address, {
        chaoticMode: isChaotic,
        showOverlay: false,
        showAnchors: true,
        gridSize
      });

      const addrLabel = document.createElement('span');
      addrLabel.className = 'option-address';
      // Truncate address for display
      addrLabel.textContent = `${address.substring(0, 7)}...${address.substring(address.length - 4)}`;

      // Play acoustic signature for this option (ear-based comparison)
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
        e.stopPropagation(); // Prevent click from selecting the card and ending the round
        playMnemonicAudio(optHash, { gridSize, chaoticMode: isChaotic });
      });

      card.appendChild(svgContainer);
      card.appendChild(addrLabel);
      card.appendChild(playOptAudioBtn);

      // Option card click handler
      card.addEventListener('click', () => {
        if (isLockingInput) return;
        isLockingInput = true; // Block duplicate clicks
        
        // Stop timer immediately
        stopLiveTimer();
        stopMnemonicAudio();

        // Submit answer
        const result = testSession.submitAnswer(address);
        
        // Freeze exact final time on screen
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
          
          // Highlight correct option for cognitive learning
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
    
    // Start live reaction timer
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
    // Restart round if simulation is active and mode changed
    if (activeScreen.classList.contains('active')) {
      startNextRound();
    }
  });

  gameGridSizeSelect.addEventListener('change', () => {
    // Restart round if simulation is active and grid size changed
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

  // Initial stats display
  updateStatsDisplay();
}
