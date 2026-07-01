# Mosaico Criptográfico (Identicons 3x3)

Una herramienta descentralizada, determinista e inmutable para generar identificadores visuales en formato de mosaico 3x3 a partir de direcciones y claves criptográficas. Su propósito es mitigar estafas de suplantación de identidad (phishing) y clipboard hijacking mediante reconocimiento visual de alta entropía.

---

## 📖 Documentación Adicional

Para profundizar en el diseño técnico y el uso seguro de la herramienta, consulta los siguientes documentos:
* **[SECURITY.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/SECURITY.md):** Justificación de Seguridad, Modelo de Entropía y análisis de resistencia a ataques avanzados (computación cuántica, fuerza bruta y spoofing de Inteligencia Artificial).
* **[MANUAL.md](file:///c:/Users/Dell/Desktop/llavero%20mnemonico/MANUAL.md):** Manual de Usuario e instrucciones detalladas sobre el Protocolo de Verificación Manual de 3 pasos recomendado para evitar pérdidas de fondos.

---

## ✨ Características Principales

* **Mosaico 3x3 Dinámico:** El mosaico se compone de 9 secciones con diferentes enfoques de diseño procedural (patrones geométricos, diagramas de Voronoi, fractales, truchet, píxeles, etc.).
* **Barajado Fisher-Yates Determinista (Layout Shuffling):** Todas las celdas cambian de posición de forma aleatoria basada en el hash de la dirección. Si un solo carácter varía, la grilla entera se reorganiza, rompiendo por completo la simetría y facilitando la detección de duplicados maliciosos.
* **Anclajes Topológicos:** Una sección del mosaico renderiza un glifo con un número contable de vértices y puntos satélite, facilitando que el cerebro humano memorice una firma única y discreta.
* **Capa Overlay:** Superposición opcional de caracteres del inicio y fin de la dirección integrados directamente en la base de la imagen SVG.
* **Simulador de Pruebas de Campo:** dApp interactiva incorporada para evaluar el rendimiento de usabilidad y velocidad de reacción del ojo humano frente a intentos de phishing.

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
