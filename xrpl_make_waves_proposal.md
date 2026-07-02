# Propuesta Técnica: Mosaico Criptográfico en XRPL (Make Waves Challenge)

Esta propuesta detalla la especificación técnica, la arquitectura y el plan de acción de 90 días para el despliegue del estándar **Mosaico Criptográfico (Identicons & Llaveros Sonoros)** en **XRPL Mainnet**, diseñado para competir en el programa de adopción real *Make Waves on XRPL*.

---

## 1. Resumen Ejecutivo (Executive Summary)

* **Nombre del Proyecto**: Mosaico Criptográfico (Visual Identity Standard)
* **Objetivo**: Proveer una capa de verificación sensorial (visual y acústica) nativa de segunda vía para evitar ataques de *phishing* y *clipboard hijacking* en la red de XRP Ledger.
* **Mecanismo Blockchain**: Registro inmutable de identidades visuales como **Soulbound NFTs (estándar XLS-20)** autodeclarados en la red principal de XRPL.
* **Consumo de Red**: Cada registro consume gas nativo (XRP quemado) y congela **2 XRP** de reserva de objeto recuperable.

---

## 2. Definición del Problema y Solución

### El Problema (Vulnerabilidad de la Última Milla)
Las direcciones públicas de XRPL son cadenas complejas (ej. `rP1p...g2y`). Los humanos son incapaces de memorizarlas o compararlas en su totalidad, especialmente bajo condiciones de prisa o fatiga. Los atacantes aprovechan esto inyectando virus de portapapeles o generando direcciones similares con los mismos caracteres extremos (ataque de *Vanity Address*), induciendo al usuario a firmar transacciones fraudulentas.

### La Solución (2FA Sensorial Determínistico)
Convertir el hash SHA-256 de la dirección en una cuadrícula vectorial SVG de $3 \times 3$, $4 \times 4$ o $5 \times 5$ sectores con anclajes topológicos y una melodía (arpegio) procedimental de 4 notas cortas. 
* Si se cambia un solo carácter en la dirección, el algoritmo de barajado Fisher-Yates reorganiza por completo la cuadrícula espacial y el timbre del arpegio, alertando visual y auditivamente al usuario al instante.

```
┌────────────────────┐      SHA-256      ┌──────────────────┐      Fisher-Yates      ┌──────────────────────┐
│  Dirección XRPL    ├──────────────────►│ Buffer (32 Bytes)├───────────────────────►│ SVG & Audio Keychain │
└────────────────────┘                   └──────────────────┘                        └──────────────────────┘
```

---

## 3. Requisitos para el Desarrollo de la Implementación

Para llevar esta propuesta de su estado actual de prototipo interactivo a una dApp de producción robusta integrada en el ecosistema XRPL, se requiere:

### A. Entorno de Desarrollo y Librerías
1. **Runtime & Dependencias**:
   * Entorno basado en Node.js para empaquetar la librería (`npm`).
   * SDK oficial de Javascript para XRPL (`xrpl.js` v2.x o superior).
   * Web Audio API nativa del navegador para la síntesis de audio libre de dependencias.
2. **Entorno de Red**:
   * Acceso a endpoints públicos WebSocket de Mainnet (`wss://xrplcluster.com` o `wss://s1.ripple.com`).
   * Entorno de pruebas Testnet para desarrolladores (`wss://s.altnet.rippletest.net:51233`).

### B. Infraestructura Criptográfica y de Fondos
1. **Activación de Cuentas**: Cada cuenta en XRPL requiere un depósito mínimo de **10 XRP** (base reserve) para ser activada en el ledger.
2. **Reserva para NFT (XLS-20)**: Para mintear el Soulbound NFT que registra la identidad de forma inmutable, la billetera del usuario debe contener al menos **2 XRP** de reserva de propietario adicionales.
3. **Costo de Gas**: Un aproximado de `0.000012 XRP` por transacción `NFTokenMint` para pagar las tarifas del validador.

---

## 4. Arquitectura de Robustez Técnica (Production-Grade Specs)

Para asegurar que la implementación sea resistente a manipulaciones y fraudes visuales, se implementan las siguientes especificaciones técnicas de robustez:

### 1. Validación de Autenticidad Autónoma (Self-Issued Verification)
Un atacante podría mintear un NFT con el nombre y mosaico de un tercero para suplantarlo. Para evitar esto:
* **Regla del Ledger**: La verificación no solo busca que la dirección tenga el NFT con el taxón `1001`. El sistema valida que el emisor (*Issuer*) del NFT sea **exactamente la misma dirección** que lo posee.
* **Inalienabilidad**: Nadie más que el propio dueño de la clave privada puede emitir un NFT válido para su propia dirección. Si un atacante emite un NFT imitando un mosaico, el validador lo rechazará porque el *Issuer* no coincidirá con el *Owner* del token.

### 2. Integración Segura con Wallets (Non-Custodial Flow)
En lugar de forzar al usuario a ingresar su clave secreta en la dApp (lo cual es un riesgo crítico de seguridad en Mainnet):
* **Integración de Extensiones**: Utilizar conectores de billeteras externas mediante APIs de navegador (`window.xrpl`).
* **Soporte de Billeteras Populares**:
  * **Gem Wallet**: Envío de peticiones de firma vía `GemWallet.signTransaction()`.
  * **Crossmark**: Uso del SDK de Crossmark para firmar transacciones de forma aislada.
  * **Xaman SDK (Xumm)**: Firma por medio de payloads QR y notificaciones push en dispositivos móviles, manteniendo la clave privada estrictamente dentro del chip seguro del dispositivo móvil del usuario.

### 3. Cuantización Cromática Discreta
Para mitigar la distorsión del color causada por las pantallas OLED/LCD de diferentes fabricantes y los filtros de luz azul nocturnos (Night Shift):
* El motor de renderizado cuantiza el tono HSL del mosaico en **12 familias discretas de color** (separadas de 30 en 30 grados). Esto garantiza que pequeñas desviaciones en la pantalla no alteren el reconocimiento visual del tono de la firma criptográfica.

---

## 5. Plan de Acción de 90 días (Make Waves Strategy)

Para participar y optimizar la puntuación en la tabla de clasificación de *Make Waves* (basada en usuarios activos y volumen de transacciones en Mainnet), seguiremos el siguiente cronograma estratégico:

```
 Días 1 - 30                       Días 31 - 60                      Días 61 - 90
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│  Fase 1: Integración    │ ─────►│  Fase 2: Usabilidad    │ ─────►│  Fase 3: Adopción y     │
│  - Wallet Connectors    │       │  - Pruebas cognitivas   │       │  - Postulación Aquarium   │
│  - Lanzamiento Mainnet  │       │  - Optimización UX/UI   │       │  - Campañas y Alianzas  │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### Fase 1: Integración Criptográfica y Lanzamiento (Días 1 - 30)
* **Hito 1**: Eliminar la entrada de claves privadas en caliente en la UI de producción e integrar los conectores de **Gem Wallet**, **Crossmark** y **Xaman**.
* **Hito 2**: Desplegar la dApp en un hosting descentralizado (IPFS o Vercel) y conectar con los nodos RPC de XRPL Mainnet.
* **Hito 3**: Habilitar el contrato/mecanismo de minteo XLS-20 nativo a bajo coste en Mainnet.

### Fase 2: Optimización de UX y Usabilidad (Días 31 - 60)
* **Hito 1**: Utilizar el panel de **Pruebas de Campo** para recopilar datos de tiempos de reacción con usuarios de la comunidad.
* **Hito 2**: Refinar el algoritmo de barajado Fisher-Yates: implementar la estructura de **anclaje central fijo** sugerida en la auditoría para reducir la fatiga visual.
* **Hito 3**: Optimizar el peso de los archivos SVG autogenerados para que su almacenamiento en metadatos on-chain sea de bajo consumo de memoria.

### Fase 3: Adopción del Ecosistema y Cierre (Días 61 - 90)
* **Hito 1**: Impulsar la dApp en redes sociales de XRPL, invitando a los usuarios a registrar sus avatares de identidad y participar en la tabla de clasificación del concurso.
* **Hito 2**: Redactar y enviar la propuesta oficial **XLS (XRP Ledger Standard)** ante el comité de enmiendas del ecosistema para proponer el mosaico como un estándar nativo para las wallets.
* **Hito 3**: Preparar el pitch final, video de demostración de métricas de tracción y aplicar para el programa de incubación en el **Aquarium de XRPL Commons** en París.
