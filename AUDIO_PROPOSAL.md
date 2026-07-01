# Propuesta Técnica: Firma Auditiva Mnemónica (Mosaico de Audio)

Este documento detalla la viabilidad, diseño técnico y requisitos de desarrollo para crear un **sistema de firmas de audio deterministas** (Llavero Sonoro) diseñado específicamente para personas ciegas o con discapacidad visual severa.

---

## 1. Concepto General: Escuchar la Dirección

De la misma manera que el ojo humano puede comparar patrones de color y forma en un mosaico, el oído humano posee una altísima sensibilidad para detectar variaciones en:
* **Tono y Armonía:** Identificar si un acorde es mayor, menor o disonante.
* **Ritmo y Secuencia:** Detectar si un arpegio (secuencia de notas) se acelera, se rompe o cambia de orden.
* **Timbre:** Reconocer el "color" del sonido (suave como una flauta, metálico, o brillante).

Al mapear el hash SHA-256 de la dirección a parámetros de audio, un usuario invidente puede **escuchar su dirección** (un arpegio o melodía corta de 3 segundos) y verificar si suena idéntica al pegarla en el destino. Si un virus altera la dirección, la melodía resultante sonará en una escala diferente, con un ritmo roto o en un tono disonante.

---

## 2. Relación y Sincronización con el Mosaico Visual

Al provenir del mismo hash inmutable, la representación visual y la auditiva están **100% acopladas**:

```
                                  ┌───────────────────────────┐
                                  │   Dirección de Billetera  │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  SHA-256 Hash Buffer  │
                                    └───────────┬───────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [ Mapeo Visual ]                                  [ Mapeo Auditivo ]
         - Colores HSL por celda                           - Escala y acordes
         - Formas geométricas                              - Secuencia de notas (Arpegio)
         - Posición por Fisher-Yates                       - Ritmo por Fisher-Yates
```

El barajado determinista Fisher-Yates que cambia la ubicación de las 9 celdas en la pantalla puede controlar el **orden temporal de las notas** (la melodía del arpegio), enlazando la física visual y auditiva de forma matemática.

---

## 3. Arquitectura y Funcionamiento Técnico

Para implementar esto de forma ligera y universal, utilizaremos la **Web Audio API** nativa de HTML5. Esto elimina la necesidad de cargar archivos de audio `.mp3` pesados o usar servidores externos. El sonido se sintetiza procedimentalmente en caliente.

### A. Mapeo de Parámetros del Sonido
Dividiremos los 32 bytes del hash para alimentar el sintetizador:

1. **La Escala Musical (Tonalidad) - Byte 30 y 31:**
   * Mapea los bytes a una escala de consonancia garantizada, como la **escala pentatónica mayor o menor**. Esto previene ruidos molestos y produce "firmas acústicas agradables" pero altamente distintivas.
2. **El Instrumento (Timbre) - Byte 29:**
   * Configura los osciladores del navegador (`OscillatorNode`). Un byte par puede generar ondas triangulares (timbre suave, tipo flauta) y un byte impar ondas tipo diente de sierra (timbre brillante, tipo sintetizador analógico).
3. **El Ritmo (Arpegio Secuencial) - Layout barajado:**
   * Utiliza el mismo array de celdas barajado por Fisher-Yates. 
   * Por ejemplo, si el layout resultante es `[4, 0, 7, 1, 8, 3, 2, 6, 5]`, el arpegio reproducirá las frecuencias asociadas a cada celda en ese orden secuencial exacto. La celda `4` (anclaje topológico) puede tener un efecto de vibrato o un acento de volumen característico en la melodía.

### B. Ejemplo Teórico del Código
```javascript
// Estructura conceptual para generator_audio.js
export function playMnemonicAudio(hash) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 1. Determinar escala y tono fundamental (Key)
  const fundamentalFreq = 220 + (hash[0] % 220); // Rango de 220Hz a 440Hz
  const scale = getPentatonicScale(fundamentalFreq, hash[1]);
  
  // 2. Obtener el layout secuencial Fisher-Yates
  const layout = getShuffledLayout(hash); // Ej: [4, 0, 2, ...]
  
  // 3. Sintetizar las notas en secuencia
  let time = audioCtx.currentTime;
  layout.forEach((cellIdx, step) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Asignar frecuencia en base a la escala y el índice de celda
    osc.frequency.value = scale[cellIdx % scale.length];
    
    // Modulación del timbre basada en los bytes de la celda
    osc.type = hash[cellIdx] % 2 === 0 ? 'triangle' : 'sine';
    
    // Curva de volumen (Envelope: Attack, Decay, Release)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // Release
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.3);
    
    time += 0.25; // Siguiente paso en el tiempo (arpegio de 2.25 segundos en total)
  });
}
```

---

## 4. Requisitos y Desafíos del Desarrollo

### A. Accesibilidad Nativa (Lector de Pantalla)
* **Atributos ARIA:** Los elementos interactivos deben poseer descripciones para lectores de pantalla. Por ejemplo:
  `<button aria-label="Escuchar firma de sonido de la dirección" onclick="playAudio()">🔊 Escuchar Firma</button>`
* **Transcripción Textual Redundante:** El lector de pantalla debe anunciar el tono (ej. *"Firma de audio: Tono Do sostenido menor, Tempo rápido"*).

### B. Consistencia Multiplataforma
* Los sintetizadores de audio Web Audio API pueden sonar ligeramente diferentes entre navegadores (ej. Firefox vs Safari en iOS) debido a las variaciones en las curvas de interpolación de frecuencia. El motor debe ser calibrado con valores matemáticos discretos y rígidos para asegurar que una dirección suene **exactamente igual** en un teléfono que en una computadora de escritorio.

---

## 5. Análisis de Vulnerabilidades y Crítica del Llavero Sonoro

Aunque la propuesta acústica añade una capa inclusiva indispensable, el sistema presenta debilidades físicas y cognitivas inherentes al canal auditivo humano que deben ser analizadas críticamente:

### A. Límites de la Memoria y Atención Auditiva
* **Naturaleza Transitoria:** A diferencia del mosaico visual (que es estático y permite al usuario mirarlo con calma todo el tiempo que requiera), el sonido es **efímero**. Requiere atención activa durante su reproducción de 3 segundos.
* **Falta de Oído Absoluto:** La mayoría de los usuarios no distinguen con precisión intervalos de semitonos (ej. pasar de una nota en Mi a Fa) a menos que tengan entrenamiento musical. Un atacante podría buscar una dirección que produzca un arpegio muy similar en tonalidad y ritmo, apostando a que el usuario no notará la sutil desviación armónica.
* *Mitigación:* Limitar los arpegios a saltos tonales distanciados (como terceras o quintas de la escala) para forzar diferencias melódicas toscas y muy evidentes ante colisiones.

### B. Dependencia del Entorno y Hardware de Salida
* **Ruido de Fondo:** Transaccionar en entornos ruidosos (calle, transporte público) anula por completo la utilidad de la firma sonora, forzando al usuario a depender de auriculares.
* **Respuesta de Frecuencias de Altavoces:** Los altavoces integrados de laptops o teléfonos de gama baja suelen recortar frecuencias graves por debajo de los 200Hz. Si la fundamental del hash es muy baja, partes del arpegio serán inaudibles.
* *Mitigación:* Calibrar el sintetizador para operar únicamente en rangos medios-altos (300Hz a 1200Hz), donde cualquier altavoz móvil responde con claridad.

### C. Vulnerabilidad a Replay Attacks (Manipulación del Frontend)
* **Audio Spoofing:** Si la dApp del navegador está comprometida mediante XSS, el script malicioso puede simplemente reproducir un clip de audio legítimo previamente capturado mientras inyecta una dirección fraudulenta en la transacción.
* *Mitigación:* El disparador del audio debe residir en el **Contexto Aislado de la Wallet** (el popup de MetaMask o la pantalla de Ledger). El usuario solo debe confiar en el sonido emitido por la interfaz nativa del monedero, nunca en el reproducido por la página web del exchange/dApp.

