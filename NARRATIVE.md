# Explicación del Mosaico Criptográfico: Usuario vs. Desarrollador

Este documento proporciona dos perspectivas complementarias sobre el uso, validación y seguridad de Mosaico Criptográfico: una narrativa sencilla para el usuario final y una especificación técnica detallada para el desarrollador.

---

## PARTE 1: Guía Simple para el Usuario Final (No Técnico)

### 💡 La Analogía del Llavero
Imagina que las direcciones cripto (como `0x71c8...3a9`) son contraseñas larguísimas escritas en un idioma extraño. Como los humanos no podemos memorizarlas, **Mosaico Criptográfico toma esa dirección y la convierte en una "llave de colores" única en forma de mosaico.** 

Cada dirección tiene su propia llave inmutable. Si cambia una sola letra o número de la dirección, la llave cambia por completo de diseño y color.

```
[ Tu Dirección Cripto ] ──────────► [ Tu Mosaico de Colores Único ]
(Ej: 0x71c8...3a9)                   (Formas y colores en su lugar)

[ Dirección Falsa/Clonada ] ──────► [ Mosaico COMPLETAMENTE Diferente ]
(Ej: 0x71c8...3a8)                   (Los colores cambian y las formas se mueven)
```

### 🔍 ¿Cómo usarlo en el día a día?

1. **Conoce tu dibujo:** Cuando guardes tu dirección de billetera, dale una mirada rápida al mosaico que genera. Memoriza algo sencillo: *"mi mosaico tiene tonos azules, tuberías curvas abajo y una estrella en la esquina superior derecha"*.
2. **Compara antes de enviar:** Cuando vayas a transferir criptomonedas y pegues la dirección en tu billetera:
   * **Mira el dibujo:** ¿Los colores siguen siendo los mismos? ¿La estrella sigue en la misma esquina?
   * **Si los dibujos son idénticos:** Es seguro enviar.
   * **Si los dibujos son diferentes:** ¡Detén la transacción! Hay un error o un intento de robo.

### ⚠️ ¿Cómo te protege de estafas comunes?

* **El Virus del Portapapeles (Clipboard Hijacker):** 
  * *La Estafa:* Copias una dirección legítima, pero un virus en tu computadora la cambia por la dirección del estafador al momento de pegarla.
  * *La Detección:* Al pegar la dirección modificada, el mosaico **cambiará sus colores y orden por completo**. Notarás la diferencia al instante sin tener que leer la dirección carácter por carácter.
* **El Engaño de la Dirección Clonada (Vanity Phishing):**
  * *La Estafa:* Un estafador crea un token basura y genera una dirección que empieza y termina exactamente igual que la del proyecto serio (ej. USDT real vs USDT falso). 
  * *La Detección:* Aunque el texto se vea igual a simple vista, el algoritmo baraja las figuras del mosaico en base al hash completo. En la dirección falsa, **los patrones geométricos saltarán a otras celdas** y el anclaje central cambiará de forma (ej. pasará de tener 5 puntas a tener 8).

---

## PARTE 2: Especificación Técnica para el Desarrollador

### ⚙️ Pipeline Matemático y Criptográfico

El flujo de generación visual sigue una arquitectura determinista de una sola vía (One-Way Deterministic Pipeline):

```
┌──────────────┐    SHA-256     ┌─────────────────┐    Fisher-Yates    ┌─────────────────────┐
│ String Input ├───────────────►│ 32-Byte Buffer  ├───────────────────►│ Shuffled Layout     │
└──────────────┘                └────────┬────────┘                    └────────┬────────────┘
                                         │                                      │
                                         ▼                                      ▼
                                [ Global Colors HSL ]                  [ Procedural Cells ]
```

#### Paso 1: Hashing Criptográfico
El string de entrada (ej. dirección hexadecimal o llave pública) se codifica en UTF-8 y se procesa mediante el algoritmo **SHA-256** nativo del navegador (`crypto.subtle.digest`), asegurando resistencia cuántica y distribución uniforme de entropía en un buffer inmutable de 32 bytes ($B_0 \dots B_{31}$).

#### Paso 2: Extracción de Configuración Cromática Global
Para evitar ruido visual excesivo, se extrae un esquema HSL cohesivo global de los últimos bytes del buffer:
$$\text{Base Hue (Tono)} = (B_{30} \times 256 + B_{31}) \pmod{360}$$
$$\text{Base Saturation (Saturación)} = 65 + (B_{29} \pmod{25}) \quad [65\% \text{ a } 90\%]$$
$$\text{Base Lightness (Luminosidad)} = 40 + (B_{28} \pmod{20}) \quad [40\% \text{ a } 60\%]$$

#### Paso 3: Barajado Fisher-Yates de la Cuadrícula
Se inicializa un array de índices lógicos representativos de la grilla ($G \times G$). Para una grilla de $3 \times 3$, `layout = [0, 1, 2, 3, 4, 5, 6, 7, 8]`. Se aplica una permutación determinista:
$$\text{Para } k \text{ desde } (\text{numCells} - 1) \text{ descendiendo hasta } 1:$$
$$j = B_{k \pmod{32}} \pmod{k + 1}$$
$$\text{Swap } layout[k] \longleftrightarrow layout[j]$$

#### Paso 4: Mapeo de Celdas y Aislamiento del Canvas
El viewport del SVG principal es fijo de $300 \times 300$ píxeles. Cada celda física $i$ de la grilla de tamaño $G$ se sitúa en coordenadas $(x, y)$ calculadas dinámicamente:
$$\text{cellSize} = \frac{300}{G}$$
$$\text{xOffset} = (i \pmod{G}) \times \text{cellSize}$$
$$\text{yOffset} = \lfloor i / G \rfloor \times \text{cellSize}$$
$$\text{scaleFactor} = \frac{\text{cellSize}}{100}$$

Cada celda lógica se dibuja dentro de un contenedor SVG `<g>` escalado:
```html
<g transform="translate(xOffset, yOffset) scale(scaleFactor)" clip-path="url(#cell-clip)">
  <!-- Elementos vectoriales basados en el sub-generador procedimental -->
</g>
```
El `scaleFactor` permite que todos los generadores procedimentales sigan dibujando bajo un espacio virtual normalizado de $100 \times 100$, garantizando escalabilidad nativa para grillas de 3x3, 4x4 y 5x5 sin necesidad de recalcular geometrías internas.

#### Paso 5: Distribución de Entropía de Sub-generadores
Cada celda lógica ejecuta un generador geométrico determinado por `logicalIndex % 9`. Los bytes de control para el color y formas internas de cada celda se leen con un offset circular determinista para evitar colisiones:
$$\text{Offset de bytes de la celda } c = (logicalIndex \times 3) \pmod{26}$$
Esto asegura que incluso si un patrón geométrico se repite en grillas grandes de 4x4 o 5x5, **cada celda consuma diferentes bytes del hash**, produciendo colores y formas internas totalmente independientes.
