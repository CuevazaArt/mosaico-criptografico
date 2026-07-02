# XLS-XX: Mosaico Criptográfico (Visual Identity Standard)

**Autor:** CuevazaArt  
**Estatus:** Borrador (Draft)  
**Categoría:** Estándar de Interfaz (Standards Track / XLS)  
**Fecha:** 2026-07-02  

---

## 1. Resumen Ejecutivo (Abstract)
Esta propuesta define un estándar de generación de **hashes visuales y acústicos deterministas (Identicones y Llaveros Sonoros)** para direcciones de XRP Ledger. El estándar permite a billeteras, dApps y exploradores de bloques renderizar una cuadrícula SVG de $3 \times 3$, $4 \times 4$ o $5 \times 5$ sectores y reproducir un arpegio sonoro de 4 notas de manera uniforme, ayudando al usuario a validar visual y auditivamente la autenticidad de las direcciones de envío y prevenir ataques de phishing por semejanza y clipboard hijacking.

---

## 2. Motivación (Motivation)
Las direcciones públicas de XRPL son cadenas alfanuméricas complejas de 25 a 35 caracteres (ej. `rP1p...g2y`). Los humanos son incapaces de recordar o comparar estas cadenas de forma exhaustiva bajo fatiga, revisando típicamente solo los primeros y últimos caracteres. Los atacantes aprovechan esto generando direcciones falsas con los mismos caracteres extremos (*Vanity Addresses*).

Al mapear el hash SHA-256 de la dirección a formas geométricas y colores discretos deterministas, convertimos la validación en una tarea de reconocimiento sensorial simple. Si una dirección varía en un solo carácter intermedio, el mosaico resultante y la melodía son drásticamente diferentes, alertando al instante al usuario.

---

## 3. Especificación Técnica (Technical Specification)

Para que el mosaico sea idéntico en cualquier billetera o cliente (JavaScript, Swift, Kotlin, Rust), se deben cumplir los siguientes requisitos de cálculo:

### A. Cálculo del Hash Base
1. La dirección XRPL en formato base58 se somete a un algoritmo de hashing **SHA-256**.
2. El resultado debe ser un buffer de **32 bytes** ($Bytes[0..31]$).

### B. Distribución Espacial (Fisher-Yates Shuffle)
Para una cuadrícula de tamaño $N \times N$ (donde $N \in \{3, 4, 5\}$), el número total de celdas es $C = N^2$.
1. Inicializar un array secuencial del tamaño de las celdas: $Layout = [0, 1, 2, ..., C-1]$.
2. Realizar un barajado Fisher-Yates determinista indexado por el hash:
   ```javascript
   for (let k = C - 1; k > 0; k--) {
     const j = Hash[k % 32] % (k + 1);
     // Intercambiar Layout[k] y Layout[j]
     const temp = Layout[k];
     Layout[k] = Layout[j];
     Layout[j] = temp;
   }
   ```
3. Cada celda física $i \in [0..C-1]$ de la grilla renderizará la celda lógica correspondiente a $Layout[i]$.

### C. Mapeo Cromático Discreto (12 Familias de Color)
Para evitar que diferencias en pantallas o filtros nocturnos (Night Shift) alteren la percepción del color:
1. Extraer los bytes de configuración:
   * $globalHue = (Hash[30] \times 256 + Hash[31]) \pmod{360}$
2. Para cada celda lógica $LogicalIndex$, calcular un offset dinámico de datos de 3 bytes:
   * $cDataOffset = (LogicalIndex \times 3) \pmod{26}$
   * $cData = [Hash[cDataOffset], Hash[cDataOffset + 1], Hash[cDataOffset + 2]]$
3. Calcular el tono ($h$), saturación ($s$) y luminosidad ($l$):
   * Modo Armónico: $h = (globalHue + (cData[0] \pmod{60}) - 30 + 360) \pmod{360}$
4. **Cuantizar el tono ($h$) en múltiplos de 30 grados** para forzar 12 familias cromáticas distinguibles:
   * $h = (\text{redondear}(h / 30) \times 30) \pmod{360}$
5. Definir la paleta de la celda:
   * $ColorBase = HSL(h, s, l)$
   * $ColorOscuro = HSL(h, s, \max(10, l - 20))$
   * $ColorClaro = HSL(h, s, \min(95, l + 20))$

### D. Geometrías de Celdas (9 Tipos Base)
Cada celda lógica de la grilla ejecuta un sub-renderizador basado en $CellType = LogicalIndex \pmod 9$:
* **Tipo 0:** Cristal Low-Poly (Triángulos conectados a las esquinas).
* **Tipo 1:** Anillos y rayos concéntricos.
* **Tipo 2:** Checkerboard rotado (Tablero de ajedrez).
* **Tipo 3:** Truchet Arcs (Tuberías curvas de laberinto).
* **Tipo 4 (Anclaje):** Glifo central (Estrella o polígono regular contable).
* **Tipo 5:** Ondas sinusoidales superpuestas.
* **Tipo 6:** Vórtice espiral.
* **Tipo 7:** Avatar Pixel-Art 5x5 simétrico.
* **Tipo 8:** Fractales geométricos recursivos.

---

## 4. Firma Acústica Mnemónica (Acoustic Specification)
El audio debe generarse de forma determinista usando osciladores sinusoidales y triangulares libres de samples:
1. **Frecuencia Fundamental (F0):** $F0 = 160 + (Hash[31] \pmod{120}) \text{ Hz}$.
2. **Escala Pentatónica:** Generar la escala usando intervalos en semitonos: $[0, 2, 4, 7, 9, 12, 14, 16, 19, 21]$.
3. **Secuenciación:** Reproducir una melodía de 4 notas de 160ms cada una utilizando las celdas lógicas de las primeras 4 posiciones del $Layout$ para determinar las notas.

---

## 5. Consideraciones de Seguridad (Security Considerations)
* **Autenticidad Autónoma (Self-Issued Verification):** Para evitar que un tercero emita un NFT representativo de otra cuenta, el validador cliente debe verificar que para cualquier NFT con taxon `1001`, el emisor (`Issuer`) coincida exactamente con el propietario (`Owner`).
