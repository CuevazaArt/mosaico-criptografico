/**
 * Cryptographic Mosaic Overlay Content Script.
 * Scans the DOM for XRPL addresses and injects the visual badge.
 */

// Regular expression for standard XRPL addresses
const XRPL_ADDRESS_REGEX = /\b(r[1-9A-HJ-NP-Za-km-z]{25,35})\b/g;

// Avoid double injection in the same node
const MARKER_CLASS = 'mosaico-processed';

/**
 * Computes the SHA-256 hash asynchronously using Web Crypto API.
 */
async function computeSha256(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return new Uint8Array(hashBuffer);
}

/**
 * Scans and processes text nodes in the DOM.
 */
function scanDocument() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Ignore scripts, styles, inputs, and textareas
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
 * Processes a text node containing an XRPL address.
 */
function processTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return;

  const text = node.nodeValue;
  XRPL_ADDRESS_REGEX.lastIndex = 0; // Reset regex index

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;

  while ((match = XRPL_ADDRESS_REGEX.exec(text)) !== null) {
    const matchText = match[0];
    const matchIndex = match.index;

    // Text before the address
    if (matchIndex > lastIndex) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
    }

    // Address + Mosaic container
    const container = document.createElement('span');
    container.className = 'mosaico-address-container';

    // Original address text
    const addressSpan = document.createElement('span');
    addressSpan.className = 'mosaico-address-text';
    addressSpan.textContent = matchText;
    container.appendChild(addressSpan);

    // Mosaic placeholder (Miniature / loading icon)
    const badge = document.createElement('span');
    badge.className = 'mosaico-mini-badge';
    badge.title = `Visual signature for: ${matchText}`;
    badge.innerHTML = '💠'; // Placeholder icon before asynchronous SVG rendering
    
    // Assign data for asynchronous processing
    badge.dataset.address = matchText;

    // Compute hash and render visual mosaic asynchronously
    computeSha256(matchText).then(hash => {
      if (window.generateMosaicoSvg) {
        const svgString = window.generateMosaicoSvg(hash, matchText, {
          chaoticMode: false,
          showOverlay: false, // Hide text overlay since this is a mini badge
          showAnchors: true,
          gridSize: 3
        });
        badge.innerHTML = svgString;
      }
    }).catch(err => {
      console.error("Error generating mosaic for extension:", err);
    });
    
    container.appendChild(badge);
    fragment.appendChild(container);

    lastIndex = XRPL_ADDRESS_REGEX.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }

  // Mark parent element to avoid infinite loops and replace node
  parent.classList.add(MARKER_CLASS);
  parent.replaceChild(fragment, node);
}

// Start scanning upon page load
window.addEventListener('load', () => {
  scanDocument();
  
  // Observe dynamic changes in the DOM (Single Page Applications)
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
