/**
 * Onboarding, contextual help, and user feedback for new users.
 */

const STORAGE_WELCOME = 'mosaico_welcome_dismissed';
const STORAGE_TOUR = 'mosaico_tour_completed';
const STORAGE_WALLET_APPROACH = 'mosaico_wallet_approach_seen';

let switchToComparatorCallback = null;
let connectWalletCallback = null;
let setWalletTypeCallback = null;

const TAB_GUIDES = {
  'generator-tab': {
    icon: '⚡',
    title: 'Generador — Conoce tu llavero visual',
    summary: 'Pega cualquier dirección XRPL y obtén al instante su mosaico único y su melodía.',
    steps: [
      'Pega tu dirección (empieza con r) en el campo de la izquierda.',
      'Observa el mosaico generado: colores, formas y posición del ancla central.',
      'Pulsa 🔊 para escuchar la firma acústica — es otra forma de reconocer la dirección.',
      'Memoriza 2 o 3 detalles simples (ej.: "azul, estrella arriba-derecha").'
    ]
  },
  'comparator-tab': {
    icon: '⚖️',
    title: 'Comparador — Verifica antes de firmar',
    summary: 'Compara dos direcciones lado a lado. Para registrar tu identidad on-chain, empieza con Xaman (móvil) o Gem Wallet (alternativa).',
    steps: [
      'Address A: la dirección que esperas (de confianza).',
      'Address B: la que acabas de copiar o pegar en tu billetera.',
      'Badge verde ✅ = seguro · Badge rojo ⚠️ = posible phishing — no firmes.',
      'Primer abordaje: conecta Xaman → mintea NFT Soulbound → verifica badge verde.'
    ]
  },
  'testing-tab': {
    icon: '🎯',
    title: 'Simulador — Entrena tu ojo',
    summary: 'Juego de 6 opciones: 5 son trampas de phishing. ¿Puedes encontrar el mosaico correcto?',
    steps: [
      'Elige tamaño de cuadrícula y modo de color.',
      'Pulsa "Start Simulation" y memoriza el mosaico objetivo.',
      'Selecciona entre las 6 opciones la que coincide visualmente.',
      'Revisa tus estadísticas a la derecha: tiempo de reacción y racha.'
    ]
  }
};

const ELEMENT_TIPS = {
  'address-input': 'Tu dirección pública XRPL. Nunca pegues aquí tu clave secreta (seed).',
  'random-address-btn': 'Genera una dirección de prueba para explorar cómo cambia el mosaico.',
  'play-audio-btn': 'Reproduce 4 notas únicas derivadas del hash de tu dirección.',
  'compare-a-input': 'Dirección de confianza — la que guardaste o conoces de antemano.',
  'compare-b-input': 'Dirección a verificar — la que vas a usar en la transacción real.',
  'simulate-phishing-btn': 'Demostración: altera un carácter para ver cómo cambia el mosaico.',
  'force-match-btn': 'Copia Address A en B para ver el badge verde de coincidencia perfecta.',
  'xrpl-register-mosaico-btn': 'Mintea un NFT Soulbound en XRPL (~2 XRP de reserva recuperable en Mainnet).',
  'xaman-connect-btn': 'Abre Xaman en tu móvil, autoriza la conexión y firma el NFT con QR.',
  'gem-connect-btn': 'Alternativa: extensión Gem Wallet en Chrome o Brave.',
  'start-game-btn': 'Inicia el reto de detección visual contra direcciones falsificadas.'
};

export function registerWalletApproachHandlers({ switchToComparator, setWalletType, connectWallet }) {
  switchToComparatorCallback = switchToComparator;
  setWalletTypeCallback = setWalletType;
  connectWalletCallback = connectWallet;
}

function scrollToWalletApproach() {
  document.getElementById('wallet-approach-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function startXamanApproach(autoConnect = false) {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  switchToComparatorCallback?.();
  setWalletTypeCallback?.('xaman');
  scrollToWalletApproach();
  showToast('Abordaje con Xaman: autoriza en tu móvil → conecta → mintea el NFT Soulbound.', 'info', 6500);
  if (autoConnect) {
    setTimeout(() => connectWalletCallback?.(), 400);
  }
}

export function startGemApproach(autoConnect = false) {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  switchToComparatorCallback?.();
  setWalletTypeCallback?.('gem');
  scrollToWalletApproach();
  showToast('Alternativa Gem Wallet: instala la extensión y pulsa Conectar.', 'info', 5500);
  if (autoConnect) {
    setTimeout(() => connectWalletCallback?.(), 400);
  }
}

function dismissWalletApproachPanel() {
  localStorage.setItem(STORAGE_WALLET_APPROACH, '1');
  document.getElementById('wallet-approach-panel')?.classList.add('collapsed');
}


let toastTimer = null;

export function showToast(message, type = 'info', durationMs = 4500) {
  let container = document.getElementById('ui-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ui-toast-container';
    container.className = 'ui-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `ui-toast ui-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="ui-toast-icon">${type === 'success' ? '✅' : type === 'warn' ? '⚠️' : '💡'}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}

function updateTabGuide(tabId) {
  const guide = TAB_GUIDES[tabId];
  const panel = document.getElementById('tab-guide-panel');
  if (!panel || !guide) return;

  panel.innerHTML = `
    <div class="tab-guide-header">
      <span class="tab-guide-icon">${guide.icon}</span>
      <div>
        <h3 class="tab-guide-title">${guide.title}</h3>
        <p class="tab-guide-summary">${guide.summary}</p>
      </div>
    </div>
    <ol class="tab-guide-steps">
      ${guide.steps.map(s => `<li>${s}</li>`).join('')}
    </ol>
  `;
}

function bindTooltips() {
  document.querySelectorAll('[data-tip]').forEach(el => {
    const key = el.getAttribute('data-tip');
    const text = ELEMENT_TIPS[key] || el.getAttribute('data-tip-text');
    if (!text) return;

    el.classList.add('has-tip');
    el.setAttribute('aria-describedby', `tip-${key}`);

    const tip = document.createElement('span');
    tip.className = 'ui-tooltip';
    tip.id = `tip-${key}`;
    tip.setAttribute('role', 'tooltip');
    tip.textContent = text;
    el.appendChild(tip);
  });
}

function openHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function dismissWelcome() {
  localStorage.setItem(STORAGE_WELCOME, '1');
  const banner = document.getElementById('welcome-banner');
  if (banner) banner.classList.add('hidden');
  showToast('¡Bienvenido! Usa el botón ❓ Ayuda en cualquier momento.', 'success');
}

function detectHostPlatform() {
  const host = window.location.hostname;
  if (host.includes('github.io')) return 'github-pages';
  if (host.includes('vercel.app')) return 'vercel';
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'unknown';
}

function showHostNotice() {
  const platform = detectHostPlatform();
  const notice = document.getElementById('host-platform-notice');
  if (!notice) return;

  if (platform === 'github-pages') {
    notice.style.display = 'flex';
    notice.innerHTML = `
      <span>📄</span>
      <span>Estás en <strong>GitHub Pages</strong> (modo visual). Para mintear NFTs en Mainnet usa la
      <a href="https://mosaico-criptografico.vercel.app" target="_blank" rel="noopener">demo completa en Vercel</a>.</span>
    `;
  } else if (platform === 'vercel') {
    notice.style.display = 'flex';
    notice.innerHTML = `
      <span>🌊</span>
      <span>Versión completa con registro XRPL en Mainnet. Primer abordaje: <strong>Xaman</strong> (móvil) o Gem Wallet (alternativa).</span>
    `;
  }
}

export function initOnboarding() {
  bindTooltips();
  showHostNotice();

  const activeTab = document.querySelector('.tab-panel.active')?.id || 'generator-tab';
  updateTabGuide(activeTab);

  const welcome = document.getElementById('welcome-banner');
  if (welcome && !localStorage.getItem(STORAGE_WELCOME)) {
    welcome.classList.remove('hidden');
  }

  document.getElementById('welcome-dismiss-btn')?.addEventListener('click', dismissWelcome);
  document.getElementById('welcome-start-tour-btn')?.addEventListener('click', () => {
    dismissWelcome();
    openHelpModal();
  });
  document.getElementById('welcome-xaman-btn')?.addEventListener('click', () => {
    dismissWelcome();
    startXamanApproach(true);
  });
  document.getElementById('welcome-gem-btn')?.addEventListener('click', () => {
    dismissWelcome();
    startGemApproach(true);
  });

  document.getElementById('xaman-connect-btn')?.addEventListener('click', () => {
    setWalletTypeCallback?.('xaman');
    connectWalletCallback?.();
  });
  document.getElementById('gem-connect-btn')?.addEventListener('click', () => {
    setWalletTypeCallback?.('gem');
    connectWalletCallback?.();
  });
  document.getElementById('wallet-approach-dismiss')?.addEventListener('click', dismissWalletApproachPanel);

  document.getElementById('help-open-btn')?.addEventListener('click', openHelpModal);
  document.getElementById('help-close-btn')?.addEventListener('click', closeHelpModal);
  document.getElementById('help-modal-backdrop')?.addEventListener('click', closeHelpModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHelpModal();
  });

  if (!localStorage.getItem(STORAGE_TOUR)) {
    setTimeout(() => {
      showToast('Tip: primer abordaje con 📱 Xaman (móvil) o alternativa 💎 Gem Wallet en el Comparador.', 'info', 7500);
    }, 1200);
  }

  if (!localStorage.getItem(STORAGE_WALLET_APPROACH)) {
    document.getElementById('wallet-approach-panel')?.classList.remove('collapsed');
  }
}

export function onTabChanged(tabId) {
  updateTabGuide(tabId);
  const guide = TAB_GUIDES[tabId];
  if (guide) {
    showToast(`${guide.icon} ${guide.title}`, 'info', 3200);
  }
}

export function onAddressGenerated() {
  showToast('Mosaico actualizado. Si cambias un solo carácter de la dirección, el dibujo cambia por completo.', 'info');
}

export function onComparisonResult(isMatch) {
  if (isMatch) {
    showToast('Las direcciones coinciden — los mosaicos son idénticos. Puedes proceder con cautela.', 'success');
  } else {
    showToast('¡Atención! Las direcciones difieren — revisa posible phishing antes de firmar.', 'warn', 6000);
  }
}
