# Justificación de Seguridad y Modelo de Entropía

Este documento detalla la justificación teórica, el análisis criptográfico y la mitigación de riesgos de **Mosaico Criptográfico** como una capa de seguridad cognitiva y mnemónica aplicada a la validación de direcciones y hashes.

---

## 1. El Problema: El Factor Humano en Web3

En los sistemas descentralizados, las identidades y los contratos se representan mediante hashes hexadecimales largos (ej. direcciones EVM de 40 caracteres hexadecimales como `0x71c81857e1519509f0750854d15f20a2b18b3a9`).
* **Carga Cognitiva:** La memoria de trabajo humana solo puede retener entre 4 y 7 elementos de información a la vez (Ley de Miller). Comparar dos cadenas de 40 caracteres excede este límite.
* **El Ataque de "Vanity Address" (Phishing):** Los estafadores utilizan clústeres de GPU para generar direcciones que coincidan en los primeros 6 y últimos 4 caracteres con una dirección legítima conocida (ej. un contrato de USDT o la billetera de un exchange). Dado que los humanos típicamente solo verifican los extremos, estas direcciones maliciosas son aceptadas por error, resultando en pérdidas de fondos.
* **Saturación y Fatiga Visual:** Leer texto plano hexadecimal de forma recurrente fatiga el ojo, incrementando la probabilidad de ignorar discrepancias de caracteres en transacciones repetitivas.

---

## 2. La Solución: Entropía Visual y Cognitiva en Mosaico 3x3

Mosaico Criptográfico transforma una semilla de 256 bits (SHA-256 de la dirección) en una representación gráfica de alta resolución SVG estructurada en una cuadrícula de 3x3. Su seguridad y robustez mnemónica se basan en cuatro pilares:

```
[ Dirección Cripto ] ──► [ SHA-256 (32 Bytes) ] ──► [ Barajado Fisher-Yates ]
                                                            │
   ┌────────────────────────────────────────────────────────┴────────────────────────────────────────┐
   ▼ (Configuración Global)            ▼ (Posicionamiento Dinámico)           ▼ (Celdas Geométricas)
- Tono Base HSL                     - Mezcla de las 9 Celdas               - Voronoi, fractales, truchet
- Saturación/Luminosidad            - Impide patrones repetitivos          - Parametrizadas por bytes
```

### A. Barajado Geométrico Determinista (Fisher-Yates)
A diferencia de los identicones estándar (como Jazzicons) donde la posición de los círculos es fija y solo varían ligeramente los colores, Mosaico Criptográfico implementa un algoritmo de barajado Fisher-Yates de las 9 secciones, utilizando bytes del hash (`hash[1]` al `hash[8]`) como semilla de permutación.
* **Impacto en Seguridad:** Si una dirección se altera en un solo carácter, no solo cambian los colores o la orientación de las formas; **toda la distribución espacial de las 9 figuras se altera**. El patrón de ondas que antes estaba en la esquina superior izquierda ahora podría estar en la parte inferior derecha, y el glifo central puede saltar a una esquina.
* **Fácil Detección:** Para el cerebro humano, el desplazamiento espacial de un patrón completo (ej. *"mi mosaico tenía la estrella en la esquina, no en el centro"*) es una señal de alerta inmediata que no requiere esfuerzo de lectura detallada.

### B. Anclajes Topológicos Discretos
La sección del anclaje topológico (Celda 4) utiliza propiedades geométricas que los humanos pueden contar rápidamente:
* **Número de Vértices:** El polígono central tiene un número de puntas/vértices determinista entre 3 y 9.
* **Puntos Satélites:** En los vértices del anclaje se renderizan pequeños círculos de alto contraste.
* **Propósito:** El cerebro humano procesa cantidades pequeñas de objetos discretos de forma instantánea (subitización). El usuario puede memorizar su anclaje como *"mi mosaico es el que tiene la estrella de 5 puntas en el centro-izquierdo"*. Si un clon malicioso produce una estrella de 6 puntas, la diferencia se detecta de inmediato.

### C. Superposición del Borde de Seguridad (Overlay)
Como última capa de validación para evitar colisiones totales generadas por Inteligencia Artificial, el mosaico integra en su base una barra opaca con los primeros 6 y últimos 4 caracteres del hash original. Esto ancla la imagen al texto correspondiente, eliminando la posibilidad de que una imagen correcta sea mostrada junto a una dirección falsa bajo manipulación gráfica simple del HTML.

---

## 3. Resistencia ante Amenazas Avanzadas

### A. Ataques de Fuerza Bruta y Computación Cuántica
* El punto de entrada es el hash SHA-256 nativo de la Web Crypto API. SHA-256 es resistente a ataques de colisión cuántica (Grover) manteniendo 128 bits de seguridad cuántica, lo que requiere $2^{128}$ operaciones para forzar una preimagen.
* Incluso si un atacante pudiera generar $10^{15}$ direcciones por segundo buscando imitar un identicon, la enorme entropía combinatoria de:
  $$\text{Entropía} = 9! \text{ (permutaciones del layout)} \times (\text{Variaciones cromáticas por celda}) \times (\text{Geometrías por celda})$$
  hace que las colisiones visuales completas sean computacionalmente inviables.

### B. Spoofing por Inteligencia Artificial (IA)
Una IA optimizadora podría intentar buscar direcciones cuya imagen generada sea lo más similar posible a la original para engañar al ojo humano. 
* El diseño de celdas geométricas de Mosaico Criptográfico (como los píxeles simétricos de 5x5, las líneas angulares del Truchet, y el número de vértices de la estrella) produce **diferencias visuales de alta frecuencia y de tipo discreto/topológico**. Las IAs generativas típicamente fallan en imitar topologías discretas idénticas sin cambiar la estructura matemática, facilitando que el ojo humano note la distorsión del patrón.

### C. Manipulación Gráfica de UI (Ataque de Interfaz Web)
Si una dApp o sitio web es vulnerado, el atacante podría inyectar un identicon SVG estático para imitar el legítimo.
* **Solución Sandbox/Extensión:** La validación segura reside en que el identicon debe generarse y renderizarse en el lado del cliente (en su extensión de billetera de confianza o sandbox local) leyendo la dirección directamente de la memoria de transacciones Web3, **nunca confiando en las imágenes que sirve la web**. Si la imagen del sitio web difiere de la mostrada por la extensión segura, la manipulación queda al descubierto.
