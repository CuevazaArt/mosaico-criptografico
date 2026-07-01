# Guía de Integración y Propuesta de Estándar: "Llavero Mnemónico"

Este documento explica cómo integrar **Mosaico Criptográfico** en proyectos existentes (dApps, billeteras, extensiones) y detalla la propuesta para establecerlo como un estándar nativo de la industria para la validación de claves y firmas.

---

## 1. Integración en Proyectos Existentes

Mosaico Criptográfico es una librería pura de JavaScript, libre de dependencias externas (Zero-Dependency) y autónoma (Client-Side). Esto hace que su integración en plataformas actuales sea sumamente sencilla.

### A. Aplicaciones Web (React, Vue, Svelte, Angular)
Puedes integrar el motor de renderizado como un componente reutilizable. 

#### Ejemplo de Componente en React:
```jsx
import React, { useEffect, useState } from 'react';
import { sha256 } from './core/crypto.js';
import { generateSvg } from './core/generator.js';

export function MnemonicBadge({ address, gridSize = 3, chaoticMode = false }) {
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    async function loadSvg() {
      if (!address) return;
      const hash = await sha256(address);
      const svg = generateSvg(hash, address, {
        gridSize,
        chaoticMode,
        showOverlay: false, // Ocultar overlay en avatares pequeños
        showAnchors: true
      });
      setSvgMarkup(svg);
    }
    loadSvg();
  }, [address, gridSize, chaoticMode]);

  return (
    <div 
      className="mnemonic-badge"
      style={{ width: '48px', height: '48px' }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }} 
    />
  );
}
```

### B. Extensiones de Navegador (Brave, Chrome, Firefox)
Una extensión de navegador puede actuar como una **capa intermedia de validación segura (Zero-Trust Overlay)**:
1. **Inyección en el DOM:** Un *Content Script* escanea las páginas Web3 comunes (Uniswap, Etherscan) en busca de strings con patrones hexadecimales de claves públicas o contratos.
2. **Overlay Visual:** Inserta el componente `MnemonicBadge` justo al lado de la dirección de forma flotante.
3. **Seguridad contra Webs Hackeadas:** Al ser inyectado directamente por la extensión segura del usuario, el atacante de la web no puede alterar la imagen del mosaico sin que la extensión muestre la discrepancia con el hash real.

### C. Aplicaciones Móviles (React Native, Flutter, Swift, Kotlin)
* **React Native:** Se integra renderizando el string SVG usando la biblioteca `react-native-svg` (`<SvgXml xml={svgMarkup} />`).
* **Flutter o Código Nativo:** Al ser una especificación matemática abierta, las fórmulas y coordenadas de generación en `generator.js` pueden ser fácilmente traducidas a lienzos nativos (Canvas en Android/SwiftUI en iOS) en menos de 400 líneas de código, garantizando un renderizado de alto rendimiento sin Webviews.

---

## 2. Propuesta de Estándar Futuro: "Llavero Mnemónico Nativo"

Para que esta herramienta sea verdaderamente universal y confiable, no debe depender de una sola dApp. Debe promoverse como un **Estándar de Mejora (como un EIP en Ethereum o BIP en Bitcoin)**.

```
                  ┌──────────────────────────────────────────────┐
                  │   Propuesta ERC: Visual Hash Specification   │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   [ Billeteras (Wallets) ]                         [ Exploradores de Bloques ]
 - Mosaico en pantallas de firma                  - Mosaico al lado del contrato
 - Mosaico en el seed backup                      - Validación visual de tokens
```

### 1. Creación de una Propuesta EIP/ERC (Visual Hash Standard)
Proponemos registrar un ERC bajo el título: **"Especificación de Hash Visual para Direcciones Blockchain"**.
* **Objetivo:** Definir matemáticamente el algoritmo del mosaico: cómo se dividen los bytes del hash, cómo se ejecuta el barajado Fisher-Yates, y las coordenadas exactas de dibujo de los 9 tipos de celdas.
* **Resultado:** Al ser un estándar, **cualquier** billetera (MetaMask, Ledger, Trezor) o explorador de bloques (Etherscan, Solscan) que implemente la especificación mostrará **exactamente la misma imagen** para una dirección dada, creando un lenguaje visual universal para las identidades criptográficas.

### 2. El Mosaico como "Seed Backup" Visual
Actualmente, las billeteras obligan a los usuarios a escribir 12 o 24 palabras en papel para respaldar sus claves privadas.
* **El Problema:** El usuario puede transponer palabras o cometer errores ortográficos sin darse cuenta hasta que intenta recuperar la cuenta.
* **Propuesta "Llavero Mnemónico":** Al crear la cuenta, el monedero muestra un Mosaico 5x5 dinámico e inmutable derivado de la clave privada/semilla.
* **Comprobación Mnemónica:** Cuando el usuario reintroduce las palabras para verificar el backup, el monedero renderiza el mosaico en tiempo real. Si el usuario cometió un solo error de palabra, **el mosaico resultante será drásticamente diferente**, alertándolo de forma inmediata visualmente antes de dar por válido el papel de respaldo.

### 3. API Web3 Nativa (`window.ethereum`)
Proponer que el proveedor Web3 inyectado en el navegador exponga nativamente la representación visual del usuario:
```javascript
// Obtener el mosaico oficial de la cuenta activa del usuario directamente de la wallet
const userVisualHash = await window.ethereum.request({
  method: 'eth_getMnemonicVisual',
  params: [address, { gridSize: 3 }]
});
```
Esto permite que cualquier sitio web consuma y renderice el mosaico oficial del usuario directamente desde la billetera segura, reforzando la confianza y consistencia visual en todo el ecosistema.
