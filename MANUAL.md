# Manual de Usuario y Protocolo de Verificación

Este manual describe el funcionamiento de la dApp interactiva de **Mosaico Criptográfico** y establece el protocolo paso a paso para realizar verificaciones manuales seguras de direcciones y hashes en entornos Web3.

---

## 1. Guía de Uso de la Interfaz

La aplicación se divide en tres secciones accesibles desde la barra de pestañas en la cabecera:

### A. Panel del Generador (Visualización Individual)
Permite inspeccionar a fondo cómo se compone un mosaico a partir de cualquier texto.
1. **Entrada de Dirección:** Escribe o pega cualquier clave pública, privada o dirección de contrato en el campo de texto. Puedes usar el botón del dado (🎲) para generar direcciones aleatorias de prueba.
2. **Modo Cromático:**
   * **Armónico (Recomendado para uso diario):** Agrupa las celdas bajo una paleta de color complementaria. Reduce la fatiga cognitiva y facilita recordar la "identidad visual" de una dirección como un todo.
   * **Caótico (Recomendado para máxima seguridad):** Genera colores independientes en cada celda. Es estéticamente más ruidoso pero maximiza las diferencias visuales entre hashes parecidos.
3. **Controles de Seguridad:**
   * **Overlay de Texto:** Activa/desactiva la barra inferior con los caracteres legibles de la dirección.
   * **Anclajes Topológicos:** Muestra/oculta los puntos de conteo en los vértices del glifo principal.
4. **Desglose de Semilla:** Al final de la página se muestra el hash SHA-256 en hexadecimal derivado de tu entrada.

### B. Panel del Comparador (Verificación Cara a Cara)
Diseñado para la comparación visual inmediata de dos direcciones antes de realizar envíos de fondos o firmas de contratos.
1. Pega la dirección esperada (Dirección A) en el cuadro izquierdo.
2. Pega la dirección copiada o la que figura en tu interfaz de transacción (Dirección B) en el cuadro derecho.
3. Observa los mosaicos generados:
   * **Badge Verde (✅):** Las direcciones y sus identicones coinciden al 100%. Es seguro proceder.
   * **Badge Rojo (⚠️):** Existe una discrepancia. Los mosaicos se verán marcadamente diferentes en colores y disposición de formas. **¡Detén la transacción de inmediato!**
4. Puedes hacer clic en **"Simular Phishing"** para ver cómo un cambio de un solo carácter en la Dirección B altera por completo el orden y formas de la grilla de Dirección B.

### C. Panel del Simulador (Pruebas de Campo Cognitivas)
Un entorno interactivo para entrenar y evaluar la capacidad del ojo humano para reconocer patrones criptográficos.
1. Selecciona el modo de visualización a evaluar (Armónico o Caótico).
2. Haz clic en **"Iniciar Simulación"**.
3. Se te presentará un **Mosaico Objetivo** en la parte superior y 6 opciones de tarjetas abajo.
4. 5 de las tarjetas contienen direcciones falsas que imitan el inicio y fin de la dirección objetivo (phishing). Solo 1 es idéntica.
5. Haz clic en el mosaico que consideres idéntico al objetivo.
6. El panel de la derecha registrará tu tasa de aciertos y tiempo de reacción promedio en segundos. Puedes presionar **"Reiniciar Estadísticas"** para limpiar el historial.

---

## 2. Protocolo de Verificación Manual de Direcciones (Paso a Paso)

Para integrar esta capa de seguridad en tus operaciones Web3 del día a día, implementa este protocolo de 3 pasos:

```
[ PASO 1: Generar ] ──► [ PASO 2: Comparar ] ──► [ PASO 3: Confirmar ]
   Pegar dirección         Observar el Mosaico       Verificar Anclajes
   en el comparador        (¿Colores en posición?)   (¿Coincide nº de puntas?)
```

### Paso 1: Generación y Copia Segura
Antes de enviar fondos a un contrato o billetera:
1. Copia la dirección del destinatario desde una fuente de confianza (ej. el sitio oficial del token o tu agenda de direcciones guardadas).
2. Pégala en tu dApp o monedero que integre el renderizador de Mosaico Criptográfico. Memoriza visualmente el mosaico resultante.

### Paso 2: Comparación del Layout y Color
Al momento de confirmar la transacción en la interfaz del monedero (ej. la ventana emergente de confirmación):
1. Mira el mosaico renderizado por el monedero y compáralo con el que memorizaste en el Paso 1.
2. Verifica la **distribución general de las celdas**: ¿Está la estrella en la misma celda? ¿Los patrones de truchet (tuberías) y de ondas (ondas sinusoidales) ocupan las mismas posiciones físicas en el mosaico 3x3?
3. Si los colores generales no coinciden o una celda tiene un patrón diferente, aborta.

### Paso 3: Validación del Anclaje y Overlay
Como última comprobación fina:
1. Localiza la celda del anclaje geométrico. Cuenta mentalmente el número de vértices o puntos blancos (ej. *"es un pentágono de 5 vértices"*).
2. Lee los caracteres impresos en el overlay inferior de la imagen. Verifica que correspondan al inicio y fin de tu dirección de destino.
3. Si todos los pasos coinciden, puedes firmar la transacción con absoluta tranquilidad de que no has sido víctima de un secuestro del portapapeles (clipboard hijacking) o de una vanity address maliciosa.
