# Guía del Usuario — Cryptographic Mosaic (XRPL)

**Demo en vivo:** https://mosaico-criptografico.vercel.app

Esta guía está pensada para alguien que **nunca ha usado la herramienta**. No necesitas saber programar.

---

## ¿Qué es esto en una frase?

Tu dirección XRPL (por ejemplo `rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE`) es imposible de memorizar. **Cryptographic Mosaic** la convierte en un **dibujo de colores y formas único** — como un llavero visual. Si alguien te engaña con una dirección parecida, el dibujo cambia por completo y lo notas al instante.

---

## ¿Qué necesitas?

### Para usar la herramienta visual (gratis)

| Requisito | ¿Obligatorio? |
|-----------|---------------|
| Navegador moderno (Chrome, Brave, Firefox, Edge) | Sí |
| Conexión a internet | Sí |
| Cuenta XRPL o dirección que quieras verificar | Sí (solo la dirección pública, no la clave secreta) |
| Instalar algo en tu PC | No |

### Para registrar tu identidad en la blockchain (opcional)

| Requisito | ¿Obligatorio? |
|-----------|---------------|
| Billetera XRPL con fondos | Sí |
| Extensión **Gem Wallet** o **Crossmark** (en PC), o app **Xaman** (móvil) | Sí |
| Saldo mínimo en Mainnet | Ver sección [¿Cuánto cuesta?](#cuánto-cuesta) |

> **Importante:** La aplicación **nunca** te pide tu clave secreta (seed). Firmas todo desde tu propia billetera.

---

## ¿Cuánto cuesta?

### Usar el generador y comparador — **$0**

Ver mosaicos, comparar direcciones, escuchar la firma acústica y practicar con el simulador de phishing: **totalmente gratis**. Todo ocurre en tu navegador; no hay suscripción ni servidor que cobre.

### Registrar tu mosaico en XRPL (mint del NFT de identidad)

Si quieres dejar constancia **inmutable en la blockchain** de que tu dirección tiene un mosaico oficial, debes mintear un NFT Soulbound (no transferible) en Mainnet:

| Concepto | Costo aproximado | Recuperable |
|----------|------------------|-------------|
| Comisión de red (`NFTokenMint`) | ~0.000012 XRP | No (se quema) |
| Reserva por poseer el NFT | 2 XRP | **Sí** — si eliminas el NFT, recuperas la reserva |
| Cuenta nueva sin activar | 10 XRP de reserva base | **Sí** — es el mínimo de tu cuenta XRPL |

**Ejemplos reales:**

- **Ya tienes cuenta activa con XRP:** necesitas al menos **~2 XRP libres** para el NFT + la comisión mínima.
- **Cuenta nueva:** necesitas **~12 XRP** (10 de activación + 2 del NFT) más la comisión.

En Testnet (modo prueba para desarrolladores) el faucet regala XRP ficticio — **no cuesta nada real**.

---

## ¿Con qué vas a terminar?

Al usar la herramienta completa, obtienes tres cosas:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. LLAVERO VISUAL     →  Patrón único que memorizas en 5 s   │
│  2. LLAVERO SONORO     →  Melodía de 4 notas propia de tu dir. │
│  3. ANCLA EN XRPL      →  NFT Soulbound que prueba identidad   │
│     (opcional)            (taxon 1001, solo tú puedes emitirlo) │
└─────────────────────────────────────────────────────────────────┘
```

| Resultado | Dónde queda | Para qué sirve |
|-----------|-------------|----------------|
| Mosaico SVG | En pantalla (determinístico) | Comparar antes de enviar XRP |
| Firma acústica | Se reproduce al pulsar 🔊 | Verificación extra sin mirar |
| NFT de identidad | En el XRP Ledger (on-chain) | Cualquiera puede verificar que **tú** registraste **tu** dirección |

---

## Paso a paso — Primera vez (conocer tu mosaico)

**Tiempo estimado: 2 minutos · Costo: $0**

### Paso 1 — Abre la aplicación

1. Entra a https://mosaico-criptografico.vercel.app
2. Verás la pestaña **Generator** (Generador) activa por defecto.

### Paso 2 — Pega tu dirección XRPL

1. En el campo **"Address / Cryptographic Key"**, pega tu dirección pública (empieza con `r`).
2. Al instante aparece tu **mosaico** a la derecha: cuadrícula de colores y formas geométricas.

### Paso 3 — Memoriza algo simple

No necesitas recordar todo el dibujo. Basta con fijarte en **2 o 3 detalles**, por ejemplo:

- *"Los tonos son azul-verdoso"*
- *"La estrella está arriba a la derecha"*
- *"Hay tubos curvos abajo"*

### Paso 4 — Escucha tu firma (opcional)

1. Pulsa **🔊 Listen to Acoustic Key**.
2. Oirás 4 notas cortas. Esa melodía es única para tu dirección.

### Paso 5 — Practica (recomendado)

1. Ve a la pestaña **Field Testing** (simulador).
2. Pulsa **Start Simulation**.
3. Intenta encontrar el mosaico correcto entre 6 opciones (5 son trampas de phishing).
4. Repite 3 veces para medir tu velocidad de reacción.

---

## Paso a paso — Registrar tu identidad en XRPL (opcional)

**Tiempo estimado: 3–5 minutos · Costo: ~2 XRP en Mainnet**

Esto crea un NFT Soulbound que dice al mundo: *"esta dirección registró su mosaico oficial"*.

### Paso 1 — Ve al comparador

1. Abre la pestaña **Comparator**.
2. Baja hasta el panel **"Immutable Identity Registry on XRPL"**.

### Paso 2 — Configura la red y la billetera

1. En **Network**, selecciona **Mainnet (Production)**.
2. En **Signing Method**, elige tu billetera:
   - **Gem Wallet** — extensión de Chrome/Brave
   - **Crossmark** — extensión de navegador
   - **Xaman** — app móvil (firma por QR)

### Paso 3 — Conecta tu billetera

1. Pulsa **🔗 Connect Wallet**.
2. Acepta la conexión en tu billetera.
3. Tu dirección aparecerá en el campo **XRPL Address**.
4. El indicador cambiará a **🟢 XRPL Connected**.

### Paso 4 — Mintea tu NFT de identidad

1. Pulsa **🛡️ Mint Mosaic Key (Soulbound NFT)**.
2. Tu billetera te pedirá **firmar** la transacción `NFTokenMint`.
3. Revisa que la comisión sea mínima y confirma.
4. En la consola verás el **hash de la transacción** — guárdalo como comprobante.

### Paso 5 — Verifica el registro

1. Si la dirección en el comparador tiene NFT registrado, el badge cambia a **✅ Registered**.
2. Puedes buscar tu hash en cualquier explorador XRPL (Bithomp, xrpl.org).

> **¿Por qué es seguro?** Solo es válido un NFT cuyo emisor (`Issuer`) sea la misma dirección que lo posee (`Owner`). Nadie puede falsificar el mosaico de otro usuario.

---

## Paso a paso — Uso diario antes de enviar XRP

**Tiempo estimado: 10 segundos · Costo: $0**

Este es el protocolo que debes repetir **cada vez** que envíes fondos:

```
  COPIAS          COMPARAS           DECIDES
  dirección   →   mosaicos A y B  →  ¿iguales?
  de origen       lado a lado         SÍ → firmar
  confiable                         NO → PARAR
```

### Paso 1 — Guarda el mosaico de confianza

Cuando guardes una dirección de confianza (exchange, amigo, contrato), ábrela en el **Generator** y memoriza su patrón visual.

### Paso 2 — Antes de firmar en tu billetera

1. Abre la pestaña **Comparator**.
2. Pega la dirección **esperada** en **Address A** (la que memorizaste).
3. Pega la dirección **que vas a enviar** en **Address B** (la que copiaste ahora).

### Paso 3 — Lee el resultado

| Badge | Significado | Acción |
|-------|-------------|--------|
| ✅ Perfect | Direcciones idénticas, mosaicos iguales | Puedes firmar |
| ⚠️ Phishing | Las direcciones difieren | **No firmes** — revisa malware o error |
| ❓ Unregistered | La dirección B no tiene NFT on-chain | Normal si el destinatario no minteó; confía en el mosaico visual |

### Paso 4 — Doble chequeo acústico (opcional)

1. Pulsa **🔊 Listen to Key A** y luego **🔊 Listen to Key B**.
2. Si las melodías suenan diferentes → **detente**.

### Paso 5 — Firma en tu billetera

Solo si el mosaico y (opcionalmente) el audio coinciden, confirma la transacción en Gem, Crossmark o Xaman.

---

## Extensión de navegador (uso automático)

Si visitas exploradores XRPL (Bithomp, xrpl.org), puedes instalar la extensión para ver mini-mosaicos **al lado de cada dirección** sin abrir la dApp:

1. En Chrome: `chrome://extensions` → Modo desarrollador → **Cargar descomprimida**
2. Selecciona la carpeta `extension` del repositorio
3. Navega a un explorador XRPL — los mosaicos aparecen automáticamente

---

## Preguntas frecuentes

### ¿Puedo usarlo sin mintear el NFT?

**Sí.** El generador y comparador funcionan sin ninguna transacción on-chain. El NFT es opcional y sirve como prueba pública de identidad.

### ¿Qué pasa si cambio un solo carácter de la dirección?

El mosaico **cambia por completo**: colores, posición de formas y melodía. Eso es lo que detecta el phishing.

### ¿La herramienta guarda mis claves?

**No.** Nunca. Todo el procesamiento visual ocurre en tu navegador. Las firmas las hace solo tu billetera.

### ¿Funciona con direcciones de Ethereum u otras redes?

El generador acepta cualquier texto o dirección. El registro on-chain (NFT) es **específico de XRPL**.

### ¿Puedo transferir mi NFT de identidad a otra persona?

**No.** Es Soulbound (no transferible). Está ligado a tu dirección para siempre.

### ¿Cuánto tarda el mint en Mainnet?

XRPL confirma en ~4 segundos. Verás el hash en la consola de la dApp.

---

## Resumen rápido

| Pregunta | Respuesta |
|----------|-----------|
| **¿Qué necesito?** | Navegador + dirección XRPL. Para NFT: billetera con ~2 XRP libres. |
| **¿Cómo lo aplico?** | Pegar dirección → memorizar mosaico → comparar antes de cada envío. |
| **¿Con qué termino?** | Un patrón visual (y opcionalmente NFT on-chain) único para tu dirección. |
| **¿Cuánto cuesta?** | Uso visual: **gratis**. NFT en Mainnet: **~2 XRP** de reserva (recuperable) + comisión mínima. |
| **¿Cómo lo uso cada día?** | Comparator → Address A vs B → si el dibujo coincide, firmas; si no, paras. |

---

## Ayuda y documentación adicional

| Recurso | Enlace |
|---------|--------|
| Demo completa (Mainnet + NFT) | https://mosaico-criptografico.vercel.app |
| Demo visual (GitHub Pages) | https://cuevazaart.github.io/mosaico-criptografico/ |
| Guía en la app | Botón **❓ Ayuda** dentro de la herramienta |
| Manual técnico (inglés) | [MANUAL.md](MANUAL.md) |
| Explicación simple + técnica | [NARRATIVE.md](NARRATIVE.md) |
| Seguridad y credenciales | [SECURITY.md](SECURITY.md) |
| Despliegue para desarrolladores | [DEPLOYMENT.md](DEPLOYMENT.md) |

---

*Cryptographic Mosaic — Tu llavero visual para el XRP Ledger. Verifica con los ojos, no con 34 caracteres.*
