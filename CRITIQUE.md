# Auditoría de Diseño y Crítica de Implementación: Mosaico Criptográfico

Este documento presenta una revisión crítica a fondo del estado actual del proyecto **Mosaico Criptográfico (Identicons 3x3/4x4/5x5 y Llavero Sonoro)**. Identifica las debilidades estructurales, las paradojas cognitivas de usabilidad, los conflictos técnicos de portabilidad y concluye con una recomendación de arquitectura para el futuro.

---

## 1. Debilidades Estructurales y de Seguridad

### A. Ataque de Semejanza Parcial Cognitiva (Visual Phishing)
* **La Amenaza:** Un atacante que genera direcciones de phishing mediante fuerza bruta (vanity addresses) no busca una colisión del 100% de la imagen (lo cual es computacionalmente inviable). Solo requiere encontrar una clave que genere un mosaico con:
  * El mismo color global predominante (tono general).
  * El anclaje topológico ubicado en la misma celda física.
* **El Riesgo:** Si el usuario realiza una validación rápida ("vistazo de un segundo") y ve que el color general coincide y la estrella está en el mismo lugar, podría firmar la transacción sin notar que las líneas de Truchet o las curvas fractales de las otras celdas variaron ligeramente.

### B. El Dilema de la Complejidad del Layout (Fisher-Yates)
* Al barajar las 9, 16 o 25 celdas de forma aleatoria a partir del hash, la celda de **Anclaje Topológico** (el punto de referencia visual más fuerte y fácil de recordar) pierde una ubicación física fija.
* **Confusión del Usuario:** Si el anclaje aparece a veces en el centro, a veces en una esquina y a veces en los bordes, el cerebro del usuario no puede automatizar su búsqueda. Se le obliga a escanear visualmente todo el mosaico en cada transacción para "encontrar" el anclaje primero, aumentando la fatiga cognitiva y el tiempo de respuesta.

---

## 2. Paradojas de Usabilidad y Carga Cognitiva

### A. La Paradoja de la Carga de Trabajo
El proyecto nace con el fin de evitar que los humanos tengan que leer hashes alfanuméricos aburridos y complejos. Sin embargo:
* Si el usuario ahora debe:
  1. Identificar el color global.
  2. Buscar y contar las puntas del anclaje topológico (ej. 5 puntas vs 6 puntas).
  3. Contar el número de círculos satélite.
  4. Escuchar un arpegio sonoro de 3 segundos en silencio.
* **El Conflicto:** La suma de estos pasos visuales y auditivos genera **más carga de trabajo mental** que simplemente comparar los primeros y últimos 4 caracteres del texto (`0x71c8...3a9`). El usuario podría terminar ignorando la herramienta debido a la fricción de uso.

### B. Incompatibilidad de Entornos para la Firma Sonora
* El llavero sonoro es ideal para la accesibilidad de personas ciegas, pero es **inútil en la vida cotidiana móvil**: transaccionar en el metro, la calle o una cafetería ruidosa inhabilita el canal de audio a menos que el usuario use auriculares.
* La dependencia de altavoces expone la privacidad del usuario (otros pueden escuchar la melodía asociada a su billetera).

---

## 3. Conflictos Técnicos de Portabilidad y Renderizado

### A. El Problema de Consistencia de Color y Brillo (Device-Dependent Rendering)
El color del mosaico se genera dinámicamente usando variables HSL en el navegador.
* **La Pantalla:** El mismo color HSL se verá drásticamente diferente en una pantalla OLED de gama alta con alto contraste frente a una pantalla LCD barata u opaca de un teléfono móvil.
* **El Filtro de Luz Azul:** Si el usuario activa el modo nocturno (Warm Light / Night Shift) en su sistema operativo, toda la paleta de colores del mosaico se desplazará hacia los tonos cálidos (amarillos/rojos). Esto alterará la "firma cromática" que el usuario recuerda de memoria, provocando falsas alarmas de phishing y desconfianza en la herramienta.

### B. Diferencias de Motores de Audio y SVG
* **Audio:** Las implementaciones de Web Audio API (curvas de atenuación de volumen y osciladores) difieren ligeramente entre navegadores (WebKit en Safari/iOS vs Blink en Chrome/Android). La misma dirección podría sonar con timbres sutilmente diferentes según el sistema operativo.
* **SVG:** Ciertos navegadores antiguos o visualizadores internos de wallets no procesan filtros CSS complejos (`box-shadow`, transparencias, gradientes avanzados) del mismo modo, destruyendo la coherencia visual necesaria para la verificación cruzada.

---

## 4. Conclusiones y Recomendaciones de Diseño Futuro

Mosaico Criptográfico es una capa de usabilidad y seguridad revolucionaria frente a los identicones tradicionales de baja entropía (como Jazzicons). No obstante, para llevarlo a una fase de producción robusta, recomendamos la siguiente evolución:

```
                            ┌────────────────────────────────┐
                            │      Evolución Recomendada     │
                            └───────────────┬────────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           ▼                                ▼                                ▼
  [ Posición Semianclada ]        [ Reducción de Ruido ]         [ Firmas Acústicas Discretas ]
  - Anclaje siempre en centro.   - Paletas restringidas.        - Sonidos tipo timbre, no
  - Solo barajar el borde.       - Evitar degradados sensibles.   arpegios largos.
```

1. **Estructura Semianclada (Layout Híbrido):**
   * **Recomendación:** Mantener la celda de anclaje topológico **fija en el centro** (o en una posición predecible) y aplicar el barajado Fisher-Yates únicamente a las celdas periféricas. Esto proporciona al usuario una "ancla visual" constante inmediata, reduciendo el tiempo de escaneo visual.
2. **Restricción de Paleta de Color (Cromática Discreta):**
   * En lugar de permitir 360 tonos continuos HSL, mapear los tonos a **12 familias de colores altamente contrastadas y diferenciables** (como una rueda de color de 12 notas). Esto mitiga el impacto de los cambios de pantalla, el brillo y los filtros de luz azul nocturna.
3. **Firmas de Audio Simplificadas:**
   * Sustituir arpegios secuenciales largos por un **acorde trino simultáneo** de 1 segundo de duración máxima, complementado con vibración háptica en dispositivos móviles. Es mucho más fácil memorizar un "acorde característico" que una secuencia melódica temporal compleja.
