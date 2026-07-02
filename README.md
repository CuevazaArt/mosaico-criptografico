# Mosaico Criptográfico (Identicons 3x3)

Una herramienta descentralizada, determinista e inmutable para generar identificadores visuales en formato de mosaico 3x3 a partir de direcciones y claves criptográficas. Su propósito es mitigar estafas de suplantación de identidad (phishing) y clipboard hijacking mediante reconocimiento visual de alta entropía.

---

## 📖 Documentación Adicional

Para profundizar en el diseño técnico, la teoría y la integración de la herramienta, consulta los siguientes documentos:
* **[SECURITY.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/SECURITY.md):** Justificación de Seguridad, Modelo de Entropía y análisis de resistencia a ataques avanzados.
* **[MANUAL.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/MANUAL.md):** Manual de Usuario e instrucciones del Protocolo de Verificación Manual de 3 pasos.
* **[AUDIO_PROPOSAL.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/AUDIO_PROPOSAL.md):** Especificación de la capa sensorial acústica y mitigaciones en hardware.
* **[CRITIQUE.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/CRITIQUE.md):** Auditoría e informe de usabilidad cognitiva, calibración y ergonomía.
* **[DISCUSSION.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/DISCUSSION.md):** Modelado de amenazas e integración técnica en wallets y exchanges.
* **[xrpl_make_waves_proposal.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/xrpl_make_waves_proposal.md):** Arquitectura técnica de registro inmutable XLS-20 y Plan de Acción de 90 días para el programa *Make Waves*.

---

## ✨ Características Principales

* **Mosaicos Escalables:** Soporte nativo para grillas de **3x3, 4x4 y 5x5** para aumentar la entropía visual a demanda.
* **Barajado Fisher-Yates Determinista (Layout Shuffling):** Reorganización aleatoria completa basada en el hash de la dirección para romper simetrías visuales.
* **Anclajes Topológicos:** Glifo con vértices contables y satélites para facilitar la memoria visual.
* **Firma Acústica Abreviada (Snappy Signature):** Arpegios melódicos deterministas rápidos (4 notas de 160ms) para evitar la fatiga cognitiva del oído.
* **Narrativa y Secuencias de Audio Orquestadas:** Secuencias de éxito armónico (campanas ascendentes de Do Mayor) o alarma disonante de doble oscilador sierra (alertas de phishing) para una clara diferenciación sonora.
* **Registro Inmutable en XRPL (XLS-20):** Panel interactivo integrado en el Comparador que soporta redes Testnet y Mainnet, permitiendo acuñar y validar identidades visuales inmutables de tipo **Soulbound (NFTs no transferibles)** de forma no custodia (Gem Wallet, Crossmark, Xaman) en el ledger de XRP.
* **Diseño Premium y Responsivo:** Curvatura de bordes a 16px y alineación vertical pixel-perfect en las tarjetas con efectos glassmorphism.

---

## 🚀 ¿Cómo ejecutar el proyecto localmente?

Este es un proyecto **zero-server** y **zero-dependency** en su núcleo. 

Si deseas ejecutarlo de forma rápida:
1. Instala el entorno y ejecuta las pruebas de integridad:
   ```bash
   npm install
   npm test
   ```
2. Inicia el servidor de desarrollo local estático:
   ```bash
   npm run dev
   ```
3. Visita `http://localhost:3000` (o el puerto indicado en pantalla) en tu navegador.

---

## 🌐 Arquitectura Autónoma y Seguridad (Para todos los públicos)

### Explicación Sencilla (No Técnica)
Este proyecto está diseñado para ser **eterno y auto-suficiente**. Una vez que se publica en internet (por ejemplo, en Vercel):
* **No requiere mantenimiento:** No hay un servidor central encendido las 24 horas que pueda colapsar, llenarse de virus o necesitar actualizaciones de software que cuesten dinero.
* **Sin base de datos central:** No guardamos tu dirección ni tus claves en un servidor privado de la dApp. Toda tu identidad visual se almacena de forma inmutable en el **XRP Ledger** (la red pública descentralizada de Ripple).
* **Seguridad absoluta:** La aplicación no conoce ni almacena tus claves privadas; cuando firmas, lo haces a través de tu propia billetera segura y aislada (Gem Wallet, Crossmark o Xaman).

### Detalle Arquitectónico (Técnico)
* **Arquitectura 100% Client-Side:** Los cálculos matemáticos del algoritmo de barajado Fisher-Yates, Hashing SHA-256 y renderizado vectorial de las celdas SVG se ejecutan enteramente en la CPU del navegador del usuario.
* **Seguridad por Cabeceras (vercel.json):** El archivo de despliegue define reglas estrictas de **Content Security Policy (CSP)** limitando los scripts e inyecciones de red externas únicamente a los WebSockets públicos y redundantes de XRPL (`wss://xrplcluster.com`, `wss://s1.ripple.com`, etc.).
* **Sin Administrador Perpetuo (Zero-Sysadmin):** Al no utilizar bases de datos tradicionales, contenedores Docker ni procesos de backend activos (NodeJS servers), el coste de infraestructura y mantenimiento es de $0$, eliminando la necesidad de un administrador perpetuo del sistema. El único flujo administrativo necesario es el envío de correcciones a través de GitHub, el cual despliega de forma automatizada mediante pipelines de CI/CD.

---

## 🛠️ Estructura del Código

* `index.html`: Estructura del panel de control de la dApp (Dashboard).
* `styles.css`: Estilos con diseño moderno oscuro y efectos glassmorphism.
* `main.js`: Lógica y orquestación de eventos de la UI.
* `src/core/crypto.js`: Módulo de hashing determinista nativo (SHA-256).
* `src/core/generator.js`: Motor generador del SVG con el barajado de celdas.
* `src/core/xrpl.js`: Integración de firmas no custodias y conectores de red.
* `src/web/testing.js`: Simulador interactivo de pruebas de usabilidad y phishing.

---

## 📦 Instrucciones para Git y GitHub

Dado que este proyecto ya está inicializado localmente con Git, puedes subirlo a tu repositorio remoto de GitHub de la siguiente manera:

1. Crea un nuevo repositorio vacío en tu cuenta de GitHub (ej. `mosaico-criptografico`). **No** lo inicialices con README, gitignore ni licencias para evitar conflictos de historial.
2. Abre tu terminal de Git favorita en la carpeta de este proyecto y ejecuta:

```bash
# 1. Agregar y guardar los archivos locales
git add .
git commit -m "Commit inicial: Implementación del Mosaico Criptográfico 3x3 con barajado dinámico"

# 2. Crear una etiqueta (tag) para la versión estable
git tag -a v1.0.0 -m "Versión estable 1.0.0"

# 3. Renombrar la rama principal a 'main'
git branch -M main

# 4. Vincular con tu repositorio en GitHub
# (Reemplaza 'tu-usuario' con tu nombre real de usuario en GitHub)
git remote add origin https://github.com/tu-usuario/mosaico-criptografico.git

# 5. Subir el código y las etiquetas a GitHub
git push -u origin main --tags
```
