/**
 * Content Script de Mosaico Criptográfico Overlay
 * Escanea el DOM en busca de direcciones XRPL e inyecta la insignia visual.
 */

// Expresión regular para direcciones XRPL estándar
const XRPL_ADDRESS_REGEX = /\b(r[1-9A-HJ-NP-Za-km-z]{25,35})\b/g;

// Evitar inyectar múltiples veces en el mismo nodo
const MARKER_CLASS = 'mosaico-processed';

/**
 * Calcula el hash SHA-256 de forma asíncrona usando Web Crypto API.
 */
async function computeSha256(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return new Uint8Array(hashBuffer);
}

/**
 * Escanea y procesa nodos de texto en el DOM
 */
function scanDocument() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Ignorar scripts, estilos, e inputs
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'input' || parent.classList.contains(MARKER_CLASS)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const text = node.nodeValue;
    if (XRPL_ADDRESS_REGEX.test(text)) {
      processTextNode(node);
    }
  });
}

/**
 * Procesa un nodo de texto que contiene una dirección XRPL
 */
function processTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return;

  const text = node.nodeValue;
  XRPL_ADDRESS_REGEX.lastIndex = 0; // Resetear expresión regular

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;

  while ((match = XRPL_ADDRESS_REGEX.exec(text)) !== null) {
    const matchText = match[0];
    const matchIndex = match.index;

    // Texto antes de la dirección
    if (matchIndex > lastIndex) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
    }

    // Contenedor de la dirección + Mosaico
    const container = document.createElement('span');
    container.className = 'mosaico-address-container';

    // Dirección original
    const addressSpan = document.createElement('span');
    addressSpan.className = 'mosaico-address-text';
    addressSpan.textContent = matchText;
    container.appendChild(addressSpan);

    // Placeholder del Mosaico (Círculo cargando / miniatura)
    const badge = document.createElement('span');
    badge.className = 'mosaico-mini-badge';
    badge.title = `Firma visual para: ${matchText}`;
    badge.innerHTML = '💠'; // Icono placeholder antes del render síncrono del SVG
    
    // Asignar datos para procesamiento asíncrono
    badge.dataset.address = matchText;

    // Calcular el hash y renderizar el mosaico real de forma asíncrona
    computeSha256(matchText).then(hash => {
      if (window.generateMosaicoSvg) {
        const svgString = window.generateMosaicoSvg(hash, matchText, {
          chaoticMode: false,
          showOverlay: false, // Ocultar overlay de texto ya que es una mini insignia
          showAnchors: true,
          gridSize: 3
        });
        badge.innerHTML = svgString;
      }
    }).catch(err => {
      console.error("Error al generar mosaico para la extensión:", err);
    });
    
    container.appendChild(badge);
    fragment.appendChild(container);

    lastIndex = XRPL_ADDRESS_REGEX.lastIndex;
  }

  // Texto restante
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }

  // Marcar elemento padre para evitar loops y reemplazar
  parent.classList.add(MARKER_CLASS);
  parent.replaceChild(fragment, node);
}

// Iniciar escaneo al cargar la página
window.addEventListener('load', () => {
  scanDocument();
  
  // Observar cambios dinámicos en el DOM (Single Page Applications)
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scanDocument();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
