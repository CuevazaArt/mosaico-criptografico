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
* **[xrpl_make_waves_proposal.md](file:///C:/Users/Dell/.gemini/antigravity-ide/brain/ba674ce1-1c9f-4118-84c7-3ff57c2aa816/xrpl_make_waves_proposal.md):** Arquitectura técnica de registro inmutable XLS-20 y Plan de Acción de 90 días para el programa *Make Waves*.

---

## ✨ Características Principales

* **Mosaicos Escalables:** Soporte nativo para grillas de **3x3, 4x4 y 5x5** para aumentar la entropía visual a demanda.
* **Barajado Fisher-Yates Determinista (Layout Shuffling):** Reorganización aleatoria completa basada en el hash de la dirección para romper simetrías visuales.
* **Anclajes Topológicos:** Glifo con vértices contables y satélites para facilitar la memoria visual.
* **Firma Acústica Abreviada (Snappy Signature):** Arpegios melódicos deterministas rápidos (4 notas de 160ms) para evitar la fatiga cognitiva del oído.
* **Narrativa y Secuencias de Audio Orquestadas:** Secuencias de éxito armónico (campanas ascendentes de Do Mayor) o alarma disonante de doble oscilador sierra (alertas de phishing) para una clara diferenciación sonora.
* **Registro Inmutable en XRPL Testnet (XLS-20):** Panel interactivo integrado en el Comparador que genera y fondea carteras de prueba en el ledger, permitiendo acuñar y validar identidades visuales inmutables de tipo **Soulbound (NFTs no transferibles)** en la blockchain de pruebas de XRP Ledger.
* **Marcadores de Posición Simétricos (Placeholders):** Esquinas redondeadas de 16px y alineación vertical pixel-perfect en las tarjetas del comparador vacío.

---

## 🚀 ¿Cómo ejecutar el proyecto localmente?

Este es un proyecto **zero-server** y **zero-dependency**. No requiere bases de datos ni dependencias pesadas.
Simplemente abre el archivo `index.html` en tu navegador de preferencia.

Si deseas ejecutar un servidor de desarrollo local ligero para evitar restricciones estrictas de CORS en algunos entornos corporativos:
```bash
# Si tienes Python
python -m http.server 8000

# O si tienes Node/npm
npx serve .
```
Luego visita `http://localhost:8000` en tu navegador.

---

## 🛠️ Estructura del Código

* `index.html`: Estructura del panel de control de la dApp (Dashboard).
* `styles.css`: Estilos con diseño moderno oscuro y efectos glassmorphism.
* `main.js`: Lógica y orquestación de eventos de la UI.
* `src/core/crypto.js`: Módulo de hashing determinista nativo (SHA-256).
* `src/core/generator.js`: Motor generador del SVG con el barajado de celdas.
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
