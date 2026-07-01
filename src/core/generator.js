/**
 * Motor de Generación del Mosaico SVG 3x3
 * Genera un SVG vectorial determinista a partir de un hash de 32 bytes (SHA-256).
 */

/**
 * Genera el código SVG de un identicon en mosaico 3x3.
 * @param {Uint8Array} hash - Array de 32 bytes del hash.
 * @param {string} textSource - La dirección o texto original (para el overlay).
 * @param {Object} options - Configuración de renderizado.
 * @param {boolean} options.chaoticMode - Si es verdadero, usa colores independientes por celda.
 * @param {boolean} options.showOverlay - Si es verdadero, superpone el texto de la dirección.
 * @param {boolean} options.showAnchors - Si es verdadero, añade detalles del anclaje central.
 * @returns {string} El string SVG generado.
 */
export function generateSvg(hash, textSource, options = {}) {
  const chaoticMode = !!options.chaoticMode;
  const showOverlay = options.showOverlay !== false;
  const showAnchors = options.showAnchors !== false;
  const gridSize = parseInt(options.gridSize) || 3;
  const numCells = gridSize * gridSize;

  // Declarar h, s, l a nivel de función para evitar ReferenceError en sub-renderizadores
  let h, s, l;

  // Extraer bytes generales de configuración
  const configByte1 = hash[30];
  const configByte2 = hash[31];
  const globalHue = (configByte1 * 256 + configByte2) % 360;
  const globalSat = 65 + (hash[29] % 25); // 65% a 90%
  const globalLight = 40 + (hash[28] % 20); // 40% a 60%

  // Crear una distribución (layout) de celdas determinista basada en los bytes del hash.
  // Iniciamos con el layout secuencial estándar de tamaño numCells.
  const layout = Array.from({ length: numCells }, (_, idx) => idx);
  
  // Realizar un barajado Fisher-Yates determinista usando bytes del hash
  // Esto reorganiza de forma única la posición física de todos los patrones.
  for (let k = numCells - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = layout[k];
    layout[k] = layout[j];
    layout[j] = temp;
  }

  // Iniciar construcción del SVG
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%" style="border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); overflow: hidden; background: #0c0f1d;">`;
  
  // Clip path para asegurar bordes redondeados globales
  svgContent += `
    <defs>
      <clipPath id="svg-clip">
        <rect width="300" height="300" rx="16" />
      </clipPath>
      <clipPath id="cell-clip">
        <rect width="100" height="100" />
      </clipPath>
    </defs>
    <g clip-path="url(#svg-clip)">
  `;

  // Renderizar las celdas de acuerdo a la grilla configurada
  const cellSize = 300 / gridSize;
  const scaleFactor = cellSize / 100;

  for (let i = 0; i < numCells; i++) {
    const col = i % gridSize;
    const row = Math.floor(i / gridSize);
    const xOffset = col * cellSize;
    const yOffset = row * cellSize;

    // Obtener el tipo de celda lógica correspondiente a esta posición física
    const logicalIndex = layout[i];
    const cellType = logicalIndex % 9; // Mapeo cíclico a los 9 tipos de celdas base

    // Calcular offset dinámico de bytes para evitar que celdas repetidas usen los mismos colores
    const cDataOffset = (logicalIndex * 3) % 26;
    let cData;
    if (cellType === 4) {
      // El anclaje central requiere 6 bytes
      cData = [
        hash[cDataOffset],
        hash[(cDataOffset + 1) % 32],
        hash[(cDataOffset + 2) % 32],
        hash[(cDataOffset + 3) % 32],
        hash[(cDataOffset + 4) % 32],
        hash[(cDataOffset + 5) % 32]
      ];
    } else {
      cData = [
        hash[cDataOffset],
        hash[(cDataOffset + 1) % 32],
        hash[(cDataOffset + 2) % 32]
      ];
    }

    // Calcular HSL para la celda
    if (chaoticMode) {
      h = (cData[0] * 1.41) % 360;
      s = 60 + (cData[1] % 35);
      l = 35 + (cData[2] % 35);
    } else {
      // Modo Armónico: Desviaciones controladas a partir del tono global
      h = (globalHue + (cData[0] % 60) - 30 + 360) % 360;
      s = Math.max(45, Math.min(95, globalSat + (cData[1] % 20) - 10));
      l = Math.max(30, Math.min(75, globalLight + (cData[2] % 20) - 10));
    }

    // Cuantizar el tono a una de las 12 familias cromáticas discretas (de 30 en 30 grados)
    // Esto asegura consistencia frente a diferencias de calibración de hardware en visualización lado a lado.
    h = (Math.round(h / 30) * 30) % 360;

    const baseColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
    const darkColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.max(10, Math.round(l) - 20)}%)`;
    const lightColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.min(95, Math.round(l) + 20)}%)`;

    // Grupo de la celda con su transformación, escala y clip local
    svgContent += `<g transform="translate(${xOffset}, ${yOffset}) scale(${scaleFactor})" clip-path="url(#cell-clip)">`;

    // Renderizar según el tipo de celda lógica
    switch (cellType) {
      case 0: // Celda (0,0): Triángulos / Low Poly Crystal
        renderCell0(cData, baseColor, darkColor, lightColor);
        break;
      case 1: // Celda (1,0): Anillos y Rayos Concentricos
        renderCell1(cData, baseColor, darkColor, lightColor);
        break;
      case 2: // Celda (2,0): Cuadrícula Checkerboard Rotada
        renderCell2(cData, baseColor, darkColor, lightColor);
        break;
      case 3: // Celda (0,1): Truchet Arcs (Tuberías/Laberinto)
        renderCell3(cData, baseColor, darkColor, lightColor);
        break;
      case 4: // Celda (1,1): Glifo Central (Anclaje Topológico)
        renderCell4(cData, baseColor, darkColor, lightColor, showAnchors);
        break;
      case 5: // Celda (2,1): Curvas de Ondas Superpuestas
        renderCell5(cData, baseColor, darkColor, lightColor);
        break;
      case 6: // Celda (0,2): Vórtice / Espiral de Polígonos Rotados
        renderCell6(cData, baseColor, darkColor, lightColor);
        break;
      case 7: // Celda (1,2): Avatar Pixel-Art Simétrico (5x5)
        renderCell7(cData, baseColor, darkColor, lightColor);
        break;
      case 8: // Celda (2,2): Fractales Geométricos Recursivos
        renderCell8(cData, baseColor, darkColor, lightColor);
        break;
    }

    svgContent += `</g>`; // Cerrar grupo de celda
  }

  // Capa: Overlay de Caracteres (Mitigación Phishing visual)
  if (showOverlay && textSource && textSource.length > 8) {
    const cleanText = textSource.trim();
    const firstPart = cleanText.substring(0, 6);
    const lastPart = cleanText.substring(cleanText.length - 4);
    const displayStr = `${firstPart}...${lastPart}`;

    // Añadir barra inferior oscura semi-transparente con texto monospaciado
    svgContent += `
      <rect x="0" y="275" width="300" height="25" fill="rgba(6, 9, 22, 0.85)" />
      <text x="150" y="292" fill="#ffffff" font-family="Courier New, Courier, monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">
        ${displayStr.toUpperCase()}
      </text>
    `;
  }

  svgContent += `</g></svg>`;
  return svgContent;

  // ================= SUB-RENDERIZADORES PARA CADA CELDA =================

  // Celda 0: Low Poly Crystal (Triángulos)
  function renderCell0(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    
    // Punto central dinámico
    const cx = 35 + (b1 % 30); // 35 a 65
    const cy = 35 + (b2 % 30); // 35 a 65

    // Triángulos conectados a las 4 esquinas
    svgContent += `<polygon points="0,0 100,0 ${cx},${cy}" fill="${light}" />`;
    svgContent += `<polygon points="100,0 100,100 ${cx},${cy}" fill="${color}" />`;
    svgContent += `<polygon points="100,100 0,100 ${cx},${cy}" fill="${dark}" />`;
    svgContent += `<polygon points="0,100 0,0 ${cx},${cy}" fill="hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.max(15, Math.round(l) - 10)}%)" />`;
    
    // Líneas divisorias sutiles
    svgContent += `<line x1="0" y1="0" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="100" y1="0" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="100" y1="100" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="0" y1="100" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
  }

  // Celda 1: Anillos y Rayos Concentricos
  function renderCell1(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];

    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    // Rayos
    const numRays = 4 + (b1 % 5); // 4 a 8 rayos
    const angleOffset = (b2 * 2) % 360;
    svgContent += `<g transform="translate(50, 50) rotate(${angleOffset})">`;
    for (let k = 0; k < numRays; k++) {
      const rayAngle = (k * 360) / numRays;
      svgContent += `<line x1="0" y1="0" x2="0" y2="45" stroke="${light}" stroke-width="2" stroke-dasharray="3,3" transform="rotate(${rayAngle})" opacity="0.6"/>`;
    }
    svgContent += `</g>`;

    // Anillos concéntricos
    const r1 = 15 + (b1 % 10);
    const r2 = 28 + (b2 % 12);
    const r3 = 42 + (b3 % 8);
    svgContent += `<circle cx="50" cy="50" r="${r1}" fill="none" stroke="${color}" stroke-width="3" />`;
    svgContent += `<circle cx="50" cy="50" r="${r2}" fill="none" stroke="${light}" stroke-width="2" opacity="0.8" />`;
    svgContent += `<circle cx="50" cy="50" r="${r3}" fill="none" stroke="${light}" stroke-width="1" stroke-dasharray="5,2" opacity="0.5" />`;
  }

  // Celda 2: Checkerboard Rotado
  function renderCell2(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    
    svgContent += `<rect width="100" height="100" fill="${color}" />`;

    const rotation = (b1 * 1.5) % 90;
    svgContent += `<g transform="translate(50,50) rotate(${rotation}) translate(-50,-50)">`;
    // Dibujar patrón de tablero de ajedrez
    for (let x = -1; x <= 4; x++) {
      for (let y = -1; y <= 4; y++) {
        if ((x + y) % 2 === 0) {
          svgContent += `<rect x="${x * 25}" y="${y * 25}" width="25" height="25" fill="${dark}" opacity="0.6" />`;
        } else {
          svgContent += `<rect x="${x * 25}" y="${y * 25}" width="25" height="25" fill="${light}" opacity="0.3" />`;
        }
      }
    }
    svgContent += `</g>`;
  }

  // Celda 3: Truchet Arcs (Tuberías curvadas)
  function renderCell3(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    
    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    // 4 cuadrantes de 50x50
    const strokeW = 6 + (b2 % 6); // 6 a 11
    const strokeColor = light;

    const drawArc = (qx, qy, type) => {
      if (type === 0) {
        // Arcos: arriba-izquierda a abajo-derecha
        svgContent += `<path d="M ${qx},${qy + 25} A 25,25 0 0,0 ${qx + 25},${qy}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
        svgContent += `<path d="M ${qx + 25},${qy + 50} A 25,25 0 0,0 ${qx + 50},${qy + 25}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
      } else {
        // Arcos: arriba-derecha a abajo-izquierda
        svgContent += `<path d="M ${qx},${qy + 25} A 25,25 0 0,1 ${qx + 25},${qy + 50}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
        svgContent += `<path d="M ${qx + 25},${qy} A 25,25 0 0,1 ${qx + 50},${qy + 25}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
      }
    };

    drawArc(0, 0, (b1 & 1));
    drawArc(50, 0, (b1 & 2) >> 1);
    drawArc(0, 50, (b1 & 4) >> 2);
    drawArc(50, 50, (b1 & 8) >> 3);
  }

  // Celda 4: Glifo Central (Anclaje Topológico / Estrella o Polígono Regular)
  function renderCell4(data, color, dark, light, activeAnchors) {
    // Usar datos expandidos del centro (cData tiene 6 bytes)
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];
    const b4 = data[3] || 128;
    const b5 = data[4] || 64;

    // Fondo oscuro contrastante para resaltar el anclaje
    svgContent += `<rect width="100" height="100" fill="#080a14" />`;
    
    // Efecto de aura brillante en el centro
    const glowColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, 50%)`;
    svgContent += `<circle cx="50" cy="50" r="35" fill="${glowColor}" opacity="0.15" filter="blur(4px)" />`;

    // Número de vértices determinista y contable por humanos (3 a 9)
    const vertices = 3 + (b1 % 7); 
    const radius = 30 + (b2 % 12); // 30 a 41
    const rotation = (b3 * 2.5) % 360;

    // Generar puntos del polígono/estrella
    const pts = [];
    for (let k = 0; k < vertices; k++) {
      const angle = (k * 2 * Math.PI) / vertices + (rotation * Math.PI) / 180;
      const px = 50 + radius * Math.cos(angle);
      const py = 50 + radius * Math.sin(angle);
      pts.push({ x: px, y: py });
    }

    const ptsStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // 1. Dibujar el polígono base relleno
    svgContent += `<polygon points="${ptsStr}" fill="${color}" stroke="${light}" stroke-width="2.5" stroke-linejoin="round" />`;

    // 2. Si es una estrella o tiene un subpatrón interno (líneas concéntricas / cruzadas)
    if (vertices > 4) {
      // Dibujar líneas cruzadas internas
      let linePath = '';
      for (let k = 0; k < vertices; k++) {
        const nextK = (k + 2) % vertices;
        linePath += `M ${pts[k].x.toFixed(1)},${pts[k].y.toFixed(1)} L ${pts[nextK].x.toFixed(1)},${pts[nextK].y.toFixed(1)} `;
      }
      svgContent += `<path d="${linePath}" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.75" />`;
    }

    // 3. Glifo interior (núcleo redondo o diamante contrastante para anclaje)
    const innerRadius = 8 + (b4 % 8); // 8 a 15
    const innerColor = `hsl(${(h + 180) % 360}, ${Math.max(70, s)}%, 60%)`; // Tono complementario (180 grados opuesto)
    
    if (b5 % 2 === 0) {
      // Círculo central
      svgContent += `<circle cx="50" cy="50" r="${innerRadius}" fill="${innerColor}" stroke="#ffffff" stroke-width="1.5" />`;
    } else {
      // Diamante central
      const top = 50 - innerRadius;
      const bottom = 50 + innerRadius;
      const left = 50 - innerRadius;
      const right = 50 + innerRadius;
      svgContent += `<polygon points="50,${top} ${right},50 50,${bottom} ${left},50" fill="${innerColor}" stroke="#ffffff" stroke-width="1.5" />`;
    }

    // Dibujar pequeños puntos satélites en los vértices para facilitar el conteo visual
    if (activeAnchors) {
      pts.forEach(p => {
        svgContent += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#ffffff" stroke="${dark}" stroke-width="1" />`;
      });
    }
  }

  // Celda 5: Ondas de curvas superpuestas
  function renderCell5(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];

    svgContent += `<rect width="100" height="100" fill="${light}" />`;

    // Renderizar dos ondas con diferentes opacidades
    const drawWave = (amplitude, freq, phase, fillCol, op) => {
      let path = `M 0,100 L 0,${50 + amplitude * Math.sin(phase)}`;
      for (let x = 1; x <= 100; x += 2) {
        const y = 50 + amplitude * Math.sin((x / 100) * freq * 2 * Math.PI + phase);
        path += ` L ${x},${y.toFixed(1)}`;
      }
      path += ` L 100,100 Z`;
      svgContent += `<path d="${path}" fill="${fillCol}" opacity="${op}" />`;
    };

    const amp1 = 8 + (b1 % 15);
    const amp2 = 12 + (b2 % 15);
    const freq1 = 1 + (b3 % 3); // 1 a 3 ciclos
    const freq2 = 1.5 + ((b1 + b2) % 3);

    drawWave(amp1, freq1, b1, dark, 0.6);
    drawWave(amp2, freq2, b2, color, 0.5);
    
    // Línea de la cresta superior de la onda
    let crestPath = `M 0,${(50 + amp2 * Math.sin(b2)).toFixed(1)}`;
    for (let x = 2; x <= 100; x += 2) {
      const y = 50 + amp2 * Math.sin((x / 100) * freq2 * 2 * Math.PI + b2);
      crestPath += ` L ${x},${y.toFixed(1)}`;
    }
    svgContent += `<path d="${crestPath}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />`;
  }

  // Celda 6: Espiral de Polígonos Rotados
  function renderCell6(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];

    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    const count = 5 + (b1 % 3); // 5 a 7 capas
    const rotStep = 8 + (b2 % 12); // 8 a 19 grados por capa
    const sides = (b1 % 2 === 0) ? 4 : 3; // Cuadrados o Triángulos

    svgContent += `<g transform="translate(50,50)">`;
    for (let j = 0; j < count; j++) {
      const scale = Math.pow(0.82, j) * 45; // escala decreciente
      const r = j * rotStep;
      const c = `hsl(${Math.round((h + j * 5) % 360)}, ${s}%, ${Math.max(20, Math.round(l) + (j * 5) - 15)}%)`;

      svgContent += `<g transform="rotate(${r})">`;
      if (sides === 4) {
        // Cuadrado
        svgContent += `<rect x="${-scale}" y="${-scale}" width="${scale * 2}" height="${scale * 2}" fill="none" stroke="${c}" stroke-width="2.5" opacity="${0.9 - j * 0.1}" />`;
      } else {
        // Triángulo
        const x1 = 0, y1 = -scale;
        const x2 = scale * 0.86, y2 = scale * 0.5;
        const x3 = -scale * 0.86, y3 = scale * 0.5;
        svgContent += `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${c}" stroke-width="2.5" opacity="${0.9 - j * 0.1}" />`;
      }
      svgContent += `</g>`;
    }
    svgContent += `</g>`;
  }

  // Celda 7: Avatar Pixel-Art Simétrico (5x5)
  function renderCell7(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];

    svgContent += `<rect width="100" height="100" fill="${light}" />`;

    // 15 bits para mapear un mapa simétrico de 5x5
    // Columnas 0, 1 y 2. Las columnas 3 y 4 se copian de 1 y 0 respectivamente.
    const grid = [];
    let bitIndex = 0;
    
    // Rellenar bits
    const val = (b1 << 8) | b2;
    for (let r = 0; r < 5; r++) {
      grid[r] = [];
      for (let c = 0; c < 3; c++) {
        grid[r][c] = ((val >> bitIndex) & 1) === 1;
        bitIndex++;
      }
      // Espejo
      grid[r][3] = grid[r][1];
      grid[r][4] = grid[r][0];
    }

    // Renderizar pixeles
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c]) {
          svgContent += `<rect x="${c * 16 + 10}" y="${r * 16 + 10}" width="16" height="16" fill="${dark}" rx="2" />`;
        } else {
          // Algunos pixeles vacíos se rellenan con un color de acento muy suave
          if ((r + c) % 3 === 0) {
            svgContent += `<rect x="${c * 16 + 10}" y="${r * 16 + 10}" width="16" height="16" fill="${color}" opacity="0.4" rx="2" />`;
          }
        }
      }
    }
  }

  // Celda 8: Fractales Geométricos Recursivos (Mina de cuadrados)
  function renderCell8(data, color, dark, light) {
    const b1 = data[0];
    
    svgContent += `<rect width="100" height="100" fill="${color}" />`;

    const size = 32 + (b1 % 12); // 32 a 43
    const half = size / 2;
    
    // Nivel 1 (Central)
    svgContent += `<rect x="${50 - half}" y="${50 - half}" width="${size}" height="${size}" fill="${dark}" stroke="${light}" stroke-width="1.5" />`;

    // Nivel 2 (4 esquinas)
    const cSize = size * 0.45;
    const offset = half + cSize/2;
    const corners = [
      {cx: 50 - offset, cy: 50 - offset},
      {cx: 50 + offset, cy: 50 - offset},
      {cx: 50 - offset, cy: 50 + offset},
      {cx: 50 + offset, cy: 50 + offset}
    ];

    corners.forEach(c => {
      svgContent += `<rect x="${c.cx - cSize/2}" y="${c.cy - cSize/2}" width="${cSize}" height="${cSize}" fill="${light}" stroke="${dark}" stroke-width="1" />`;
      
      // Pequeño círculo central en los hijos
      svgContent += `<circle cx="${c.cx}" cy="${c.cy}" r="${cSize*0.25}" fill="${color}" />`;
    });
  }
}
