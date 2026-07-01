# Análisis de Seguridad, Integración y Vectores de Ataque

Este documento aborda las preguntas clave sobre cómo desplegar **Mosaico Criptográfico** de manera nativa en el ecosistema Web3, asegurar su inalienabilidad frente a hacks del frontend y analizar rigurosamente su modelo de amenazas.

---

## 1. Integración en Exchanges (CEX y DEX) para Proyectos y Tokens

### El Problema en Exchanges
En un DEX (ej. Uniswap, PancakeSwap) o CEX (ej. Binance, Coinbase), el listado de tokens se basa en nombres y símbolos (`USDT`, `PEPE`, `ETH`). Un estafador puede desplegar un contrato de token malicioso con el símbolo `USDT` e idéntica imagen PNG de logo. El usuario, buscando en la lista, no puede diferenciar el USDT legítimo del falso sin inspeccionar manualmente el hash del contrato, lo cual genera estafas diarias.

### La Solución con Mosaicos Criptográficos
1. **Visual Hash en el Token List (Registry):**
   Las listas oficiales de tokens (Token Lists firmadas por CoinGecko, Uniswap o consorcios de gobernanza) deben incluir la representación del Mosaico Criptográfico derivado del contrato del token de forma obligatoria.
2. **Swap Box Verification (Caja de Intercambio):**
   Cuando el usuario ingresa un token personalizado o lo selecciona de la lista:
   * El DEX calcula en caliente el mosaico del contrato inteligente activo.
   * Muestra el mosaico al lado de la información del swap.
   * Si es un token verificado, el mosaico coincidirá con el registrado oficialmente en el Consenso Visual. Un `USDT` falso producirá un mosaico caóticamente diferente en colores y distribución que alertará al usuario al instante.
3. **Páginas de Info y Analíticas:**
   Tanto en Etherscan como en portales de analíticas, el perfil de cada token debe tener su "Firma de Mosaico" oficial en la cabecera. El usuario aprende a identificar visualmente el proyecto legítimo como si fuera su logo dinámico.

---

## 2. Integración en Billeteras (Wallets) para Identidad Propia

Las wallets (ej. MetaMask, Phantom, Rainbow, Ledger) son la **última línea de defensa** de los fondos del usuario. Su integración debe estructurarse en dos áreas:

### A. Reconocimiento de Identidades Propias (Mis Cuentas)
* **Avatares de Cuenta:** En lugar de avatares pseudo-aleatorios estáticos (como Blockies o Jazzicons de posición fija), la wallet muestra el Mosaico Criptográfico de cada cuenta del usuario (Cuenta 1, Cuenta 2).
* **Libreta de Contactos:** Al registrar una dirección conocida (ej. "Buzón de Binance", "Billetera Fría"), la wallet guarda el mosaico. 
* **Prevención de Envenenamiento de Direcciones (Address Poisoning):** Los atacantes envían transferencias de 0 tokens desde direcciones que inician y terminan igual a la del usuario para que este la copie de su historial de transacciones. Con Mosaico Criptográfico, el historial mostraría una imagen visualmente dispar, delatando el ataque.

### B. Flujo de Confirmación de Firma (Tx Signing)
Cuando el usuario va a firmar una transacción o mensaje, el popup de la wallet debe renderizar de forma prominente:
1. El **Mosaico de Origen** (su cuenta).
2. Un indicador de flujo (flecha de envío).
3. El **Mosaico de Destino** (derivado de la dirección a transferir).
Si el destino coincide con un contacto registrado, se muestra el mosaico oficial guardado. Si el destino ha sido alterado por un virus de portapapeles, el usuario notará que el mosaico en pantalla no coincide con el de su contacto conocido.

---

## 3. Integración Nativa de Forma Robusta e Inalienable

Un hack XSS o una inyección de código malicioso en el sitio web de la dApp podría alterar el HTML para mostrar el mosaico del token legítimo mientras por debajo pasa la dirección del contrato del estafador en la transacción. Para evitar esto de forma inalienable:

### 1. Validación en el Proceso de la Extensión (Aislamiento de Contexto)
El renderizado del mosaico de confirmación final **nunca debe depender únicamente del sitio web**. 
* La extensión de la billetera se ejecuta en un proceso de sandbox aislado del navegador.
* El popup físico de la wallet o la pantalla física de una Hardware Wallet (ej. Ledger Stax) es el **único canal seguro inalterable** (What You See Is What You Sign). 
* El usuario debe entrenar su hábito para contrastar que el mosaico mostrado por la dApp en la web coincide exactamente con el mosaico renderizado por su wallet segura antes de presionar "Firmar".

### 2. Mosaicos SVG On-Chain (Blockchain Native)
Para dApps y contratos inteligentes de gobernanza:
* El contrato del proyecto puede incorporar un método de solo lectura `visualHash()` o almacenar el SVG del mosaico directamente en la blockchain (On-Chain Metadata).
* El explorador de bloques y la wallet leen el SVG directamente desde los nodos RPC del validador de red, evitando depender de servidores web o bases de datos centralizadas propensas a manipulación DNS o hacks de frontend.

---

## 4. Vectores de Ataque y Análisis de Vulnerabilidades (Threat Model)

A continuación evaluamos los límites del método y cómo mitigamos los posibles vectores de ataque:

```
┌─────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Vector de Ataque                │ Mitigación / Contramedida                              │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Colisión por Fuerza Bruta    │ Entropía masiva ($2^{160}$+ combinaciones cromáticas,    │
│    (Vanity Address generation)  │ ordenamientos $9! \dots 25!$ y glifos geométricos).    │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 2. Phishing Visual Subjetivo    │ Diseño por anclajes topológicos y subitización.        │
│    (Semejanza visual limitada)  │ El cerebro detecta de inmediato el cambio de posición  │
│                                 │ de una celda y el número de vértices discretos.        │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 3. Manipulación del DOM (XSS)   │ Contraste redundante con el popup aislado de la wallet  │
│    en la dApp                   │ o confirmación en Hardware Wallet segura.              │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 4. Ataque al Algoritmo Hash     │ Uso de SHA-256 estándar de la Web Crypto API nativa    │
│    (Preimagen)                  │ con resistencia cuántica contra ataques de Grover.      │
└─────────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Detalle de Vulnerabilidad 2: Phishing Visual Subjetivo
* **La Amenaza:** Un atacante astuto genera una dirección que comparte un tono de color similar y posiciona la estrella en la misma celda que el original, esperando que el usuario con fatiga visual o prisa no note las variaciones internas más pequeñas (como la orientación de las líneas de Truchet o el tipo de espiral).
* **La Mitigación:** 
  1. **Anclaje Topológico:** El conteo discreto de vértices (de 3 a 9) y puntos de satélite en la celda del anclaje son matemáticamente rígidos y no difuminables por variaciones de tono.
  2. **Overlay Criptográfico:** La inclusión de la barra inferior con texto legible (`0x71c8...3a9`) actúa como confirmación redundante.
  3. **Escalado de Grilla:** Toggling de grillas a 4x4 o 5x5. En estas configuraciones, el barajado coloca la celda de anclaje en una de 16 o 25 posiciones posibles, haciendo que una similitud estructural accidental sea matemáticamente inviable de lograr para el atacante.
