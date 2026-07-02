/**
 * SVG 3x3 Mosaic Generation Engine.
 * Generates a deterministic vector SVG from a 32-byte hash (SHA-256).
 */

/**
 * Generates the SVG string of a 3x3 mosaic identicon.
 * @param {Uint8Array} hash - 32-byte array representing the hash.
 * @param {string} textSource - The original address or text (for text overlay).
 * @param {Object} options - Rendering options.
 * @param {boolean} options.chaoticMode - If true, uses independent colors per cell.
 * @param {boolean} options.showOverlay - If true, overlays the address text at the bottom.
 * @param {boolean} options.showAnchors - If true, adds detailing to the central anchor glyph.
 * @param {number} options.gridSize - Grid size (3, 4, or 5).
 * @returns {string} The generated SVG markup.
 */
export function generateSvg(hash, textSource, options = {}) {
  const chaoticMode = !!options.chaoticMode;
  const showOverlay = options.showOverlay !== false;
  const showAnchors = options.showAnchors !== false;
  const gridSize = parseInt(options.gridSize) || 3;
  const numCells = gridSize * gridSize;

  // Declare h, s, l at function scope to avoid ReferenceError in sub-renderers
  let h, s, l;

  // Extract general configuration bytes
  const configByte1 = hash[30];
  const configByte2 = hash[31];
  const globalHue = (configByte1 * 256 + configByte2) % 360;
  const globalSat = 65 + (hash[29] % 25); // 65% to 90%
  const globalLight = 40 + (hash[28] % 20); // 40% to 60%

  // Create a deterministic cell layout based on hash bytes.
  // Start with a standard sequential layout.
  const layout = Array.from({ length: numCells }, (_, idx) => idx);
  
  // Perform a deterministic Fisher-Yates shuffle using hash bytes.
  // This uniquely reorganizes the physical position of all patterns.
  for (let k = numCells - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = layout[k];
    layout[k] = layout[j];
    layout[j] = temp;
  }

  // Start SVG construction
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%" style="border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); overflow: hidden; background: #0c0f1d;">`;
  
  // Clip path to ensure global rounded borders
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

  // Render cells according to the configured grid size
  const cellSize = 300 / gridSize;
  const scaleFactor = cellSize / 100;

  for (let i = 0; i < numCells; i++) {
    const col = i % gridSize;
    const row = Math.floor(i / gridSize);
    const xOffset = col * cellSize;
    const yOffset = row * cellSize;

    // Get the logical cell index corresponding to this physical position
    const logicalIndex = layout[i];
    const cellType = logicalIndex % 9; // Cyclic mapping to 9 base cell types

    // Calculate dynamic byte offset to prevent duplicate cells from using the same colors
    const cDataOffset = (logicalIndex * 3) % 26;
    let cData;
    if (cellType === 4) {
      // Central anchor requires 6 bytes
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

    // Calculate HSL for the cell
    if (chaoticMode) {
      h = (cData[0] * 1.41) % 360;
      s = 60 + (cData[1] % 35);
      l = 35 + (cData[2] % 35);
    } else {
      // Harmonious Mode: Controlled deviations from global hue
      h = (globalHue + (cData[0] % 60) - 30 + 360) % 360;
      s = Math.max(45, Math.min(95, globalSat + (cData[1] % 20) - 10));
      l = Math.max(30, Math.min(75, globalLight + (cData[2] % 20) - 10));
    }

    // Quantize hue to one of 12 discrete color families (every 30 degrees)
    // This ensures consistency against screen hardware calibration differences.
    h = (Math.round(h / 30) * 30) % 360;

    const baseColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
    const darkColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.max(10, Math.round(l) - 20)}%)`;
    const lightColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.min(95, Math.round(l) + 20)}%)`;

    // Cell group with its transform, scale, and local clipping
    svgContent += `<g transform="translate(${xOffset}, ${yOffset}) scale(${scaleFactor})" clip-path="url(#cell-clip)">`;

    // Render based on logical cell type
    switch (cellType) {
      case 0: // Cell Type 0: Triangles / Low Poly Crystal
        renderCell0(cData, baseColor, darkColor, lightColor);
        break;
      case 1: // Cell Type 1: Concentric Rings and Rays
        renderCell1(cData, baseColor, darkColor, lightColor);
        break;
      case 2: // Cell Type 2: Rotated Checkerboard Grid
        renderCell2(cData, baseColor, darkColor, lightColor);
        break;
      case 3: // Cell Type 3: Truchet Arcs (Labyrinth pipes)
        renderCell3(cData, baseColor, darkColor, lightColor);
        break;
      case 4: // Cell Type 4: Central Glyph (Topological Anchor)
        renderCell4(cData, baseColor, darkColor, lightColor, showAnchors);
        break;
      case 5: // Cell Type 5: Overlapping Wave Curves
        renderCell5(cData, baseColor, darkColor, lightColor);
        break;
      case 6: // Cell Type 6: Vortex / Spiral of Rotated Polygons
        renderCell6(cData, baseColor, darkColor, lightColor);
        break;
      case 7: // Cell Type 7: Symmetric Pixel-Art Avatar (5x5)
        renderCell7(cData, baseColor, darkColor, lightColor);
        break;
      case 8: // Cell Type 8: Recursive Geometric Fractals
        renderCell8(cData, baseColor, darkColor, lightColor);
        break;
    }

    svgContent += `</g>`; // Close cell group
  }

  // Layer: Text Overlay (Visual phishing mitigation)
  if (showOverlay && textSource && textSource.length > 8) {
    const cleanText = textSource.trim();
    const firstPart = cleanText.substring(0, 6);
    const lastPart = cleanText.substring(cleanText.length - 4);
    const displayStr = `${firstPart}...${lastPart}`;

    // Add semi-transparent dark bottom bar with monospaced text
    svgContent += `
      <rect x="0" y="275" width="300" height="25" fill="rgba(6, 9, 22, 0.85)" />
      <text x="150" y="292" fill="#ffffff" font-family="Courier New, Courier, monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">
        ${displayStr.toUpperCase()}
      </text>
    `;
  }

  svgContent += `</g></svg>`;
  return svgContent;

  // ================= SUB-RENDERERS FOR EACH CELL =================

  // Cell 0: Low Poly Crystal (Triangles)
  function renderCell0(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    
    // Dynamic central point
    const cx = 35 + (b1 % 30); // 35 to 65
    const cy = 35 + (b2 % 30); // 35 to 65

    // Triangles connected to 4 corners
    svgContent += `<polygon points="0,0 100,0 ${cx},${cy}" fill="${light}" />`;
    svgContent += `<polygon points="100,0 100,100 ${cx},${cy}" fill="${color}" />`;
    svgContent += `<polygon points="100,100 0,100 ${cx},${cy}" fill="${dark}" />`;
    svgContent += `<polygon points="0,100 0,0 ${cx},${cy}" fill="hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.max(15, Math.round(l) - 10)}%)" />`;
    
    // Subtle dividing lines
    svgContent += `<line x1="0" y1="0" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="100" y1="0" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="100" y1="100" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
    svgContent += `<line x1="0" y1="100" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />`;
  }

  // Cell 1: Concentric Rings and Rays
  function renderCell1(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];

    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    // Rays
    const numRays = 4 + (b1 % 5); // 4 to 8 rays
    const angleOffset = (b2 * 2) % 360;
    svgContent += `<g transform="translate(50, 50) rotate(${angleOffset})">`;
    for (let k = 0; k < numRays; k++) {
      const rayAngle = (k * 360) / numRays;
      svgContent += `<line x1="0" y1="0" x2="0" y2="45" stroke="${light}" stroke-width="2" stroke-dasharray="3,3" transform="rotate(${rayAngle})" opacity="0.6"/>`;
    }
    svgContent += `</g>`;

    // Concentric rings
    const r1 = 15 + (b1 % 10);
    const r2 = 28 + (b2 % 12);
    const r3 = 42 + (b3 % 8);
    svgContent += `<circle cx="50" cy="50" r="${r1}" fill="none" stroke="${color}" stroke-width="3" />`;
    svgContent += `<circle cx="50" cy="50" r="${r2}" fill="none" stroke="${light}" stroke-width="2" opacity="0.8" />`;
    svgContent += `<circle cx="50" cy="50" r="${r3}" fill="none" stroke="${light}" stroke-width="1" stroke-dasharray="5,2" opacity="0.5" />`;
  }

  // Cell 2: Rotated Checkerboard
  function renderCell2(data, color, dark, light) {
    const b1 = data[0];
    svgContent += `<rect width="100" height="100" fill="${color}" />`;

    const rotation = (b1 * 1.5) % 90;
    svgContent += `<g transform="translate(50,50) rotate(${rotation}) translate(-50,-50)">`;
    // Draw chessboard pattern
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

  // Cell 3: Truchet Arcs (Curved pipes)
  function renderCell3(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    
    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    // 4 quadrants of 50x50
    const strokeW = 6 + (b2 % 6); // 6 to 11
    const strokeColor = light;

    const drawArc = (qx, qy, type) => {
      if (type === 0) {
        // Arcs: top-left to bottom-right
        svgContent += `<path d="M ${qx},${qy + 25} A 25,25 0 0,0 ${qx + 25},${qy}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
        svgContent += `<path d="M ${qx + 25},${qy + 50} A 25,25 0 0,0 ${qx + 50},${qy + 25}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
      } else {
        // Arcs: top-right to bottom-left
        svgContent += `<path d="M ${qx},${qy + 25} A 25,25 0 0,1 ${qx + 25},${qy + 50}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
        svgContent += `<path d="M ${qx + 25},${qy} A 25,25 0 0,1 ${qx + 50},${qy + 25}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" />`;
      }
    };

    drawArc(0, 0, (b1 & 1));
    drawArc(50, 0, (b1 & 2) >> 1);
    drawArc(0, 50, (b1 & 4) >> 2);
    drawArc(50, 50, (b1 & 8) >> 3);
  }

  // Cell 4: Central Glyph (Topological Anchor / Regular Polygon or Star)
  function renderCell4(data, color, dark, light, activeAnchors) {
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];
    const b4 = data[3] || 128;
    const b5 = data[4] || 64;

    // Dark contrasting background to highlight the anchor
    svgContent += `<rect width="100" height="100" fill="#080a14" />`;
    
    // Glowing aura effect in the center
    const glowColor = `hsl(${Math.round(h)}, ${Math.round(s)}%, 50%)`;
    svgContent += `<circle cx="50" cy="50" r="35" fill="${glowColor}" opacity="0.15" filter="blur(4px)" />`;

    // Deterministic, human-countable number of vertices (3 to 9)
    const vertices = 3 + (b1 % 7); 
    const radius = 30 + (b2 % 12); // 30 to 41
    const rotation = (b3 * 2.5) % 360;

    // Generate polygon/star points
    const pts = [];
    for (let k = 0; k < vertices; k++) {
      const angle = (k * 2 * Math.PI) / vertices + (rotation * Math.PI) / 180;
      const px = 50 + radius * Math.cos(angle);
      const py = 50 + radius * Math.sin(angle);
      pts.push({ x: px, y: py });
    }

    const ptsStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // 1. Draw filled base polygon
    svgContent += `<polygon points="${ptsStr}" fill="${color}" stroke="${light}" stroke-width="2.5" stroke-linejoin="round" />`;

    // 2. If it is a star or has an internal subpattern (concentric/crossed lines)
    if (vertices > 4) {
      // Draw internal crossed lines
      let linePath = '';
      for (let k = 0; k < vertices; k++) {
        const nextK = (k + 2) % vertices;
        linePath += `M ${pts[k].x.toFixed(1)},${pts[k].y.toFixed(1)} L ${pts[nextK].x.toFixed(1)},${pts[nextK].y.toFixed(1)} `;
      }
      svgContent += `<path d="${linePath}" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.75" />`;
    }

    // 3. Inner glyph (contrasting core circle or diamond for anchoring)
    const innerRadius = 8 + (b4 % 8); // 8 to 15
    const innerColor = `hsl(${(h + 180) % 360}, ${Math.max(70, s)}%, 60%)`; // Complementary hue (180 degrees opposite)
    
    if (b5 % 2 === 0) {
      // Central circle
      svgContent += `<circle cx="50" cy="50" r="${innerRadius}" fill="${innerColor}" stroke="#ffffff" stroke-width="1.5" />`;
    } else {
      // Central diamond
      const top = 50 - innerRadius;
      const bottom = 50 + innerRadius;
      const left = 50 - innerRadius;
      const right = 50 + innerRadius;
      svgContent += `<polygon points="50,${top} ${right},50 50,${bottom} ${left},50" fill="${innerColor}" stroke="#ffffff" stroke-width="1.5" />`;
    }

    // Draw small satellite dots at vertices to facilitate visual counting
    if (activeAnchors) {
      pts.forEach(p => {
        svgContent += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#ffffff" stroke="${dark}" stroke-width="1" />`;
      });
    }
  }

  // Cell 5: Overlapping Wave Curves
  function renderCell5(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];
    const b3 = data[2];

    svgContent += `<rect width="100" height="100" fill="${light}" />`;

    // Render two waves with different opacities
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
    const freq1 = 1 + (b3 % 3); // 1 to 3 cycles
    const freq2 = 1.5 + ((b1 + b2) % 3);

    drawWave(amp1, freq1, b1, dark, 0.6);
    drawWave(amp2, freq2, b2, color, 0.5);
    
    // Top crest line of the wave
    let crestPath = `M 0,${(50 + amp2 * Math.sin(b2)).toFixed(1)}`;
    for (let x = 2; x <= 100; x += 2) {
      const y = 50 + amp2 * Math.sin((x / 100) * freq2 * 2 * Math.PI + b2);
      crestPath += ` L ${x},${y.toFixed(1)}`;
    }
    svgContent += `<path d="${crestPath}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />`;
  }

  // Cell 6: Spiral of Rotated Polygons
  function renderCell6(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];

    svgContent += `<rect width="100" height="100" fill="${dark}" />`;

    const count = 5 + (b1 % 3); // 5 to 7 layers
    const rotStep = 8 + (b2 % 12); // 8 to 19 degrees per layer
    const sides = (b1 % 2 === 0) ? 4 : 3; // Squares or Triangles

    svgContent += `<g transform="translate(50,50)">`;
    for (let j = 0; j < count; j++) {
      const scale = Math.pow(0.82, j) * 45; // decreasing scale
      const r = j * rotStep;
      const c = `hsl(${Math.round((h + j * 5) % 360)}, ${s}%, ${Math.max(20, Math.round(l) + (j * 5) - 15)}%)`;

      svgContent += `<g transform="rotate(${r})">`;
      if (sides === 4) {
        // Square
        svgContent += `<rect x="${-scale}" y="${-scale}" width="${scale * 2}" height="${scale * 2}" fill="none" stroke="${c}" stroke-width="2.5" opacity="${0.9 - j * 0.1}" />`;
      } else {
        // Triangle
        const x1 = 0, y1 = -scale;
        const x2 = scale * 0.86, y2 = scale * 0.5;
        const x3 = -scale * 0.86, y3 = scale * 0.5;
        svgContent += `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${c}" stroke-width="2.5" opacity="${0.9 - j * 0.1}" />`;
      }
      svgContent += `</g>`;
    }
    svgContent += `</g>`;
  }

  // Cell 7: Symmetric Pixel-Art Avatar (5x5)
  function renderCell7(data, color, dark, light) {
    const b1 = data[0];
    const b2 = data[1];

    svgContent += `<rect width="100" height="100" fill="${light}" />`;

    // 15 bits to map a symmetric 5x5 grid
    // Columns 0, 1, and 2. Columns 3 and 4 are mirrored from 1 and 0 respectively.
    const grid = [];
    let bitIndex = 0;
    
    // Fill bits
    const val = (b1 << 8) | b2;
    for (let r = 0; r < 5; r++) {
      grid[r] = [];
      for (let c = 0; c < 3; c++) {
        grid[r][c] = ((val >> bitIndex) & 1) === 1;
        bitIndex++;
      }
      // Mirror
      grid[r][3] = grid[r][1];
      grid[r][4] = grid[r][0];
    }

    // Render pixels
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c]) {
          svgContent += `<rect x="${c * 16 + 10}" y="${r * 16 + 10}" width="16" height="16" fill="${dark}" rx="2" />`;
        } else {
          // Some empty pixels are filled with a soft accent color
          if ((r + c) % 3 === 0) {
            svgContent += `<rect x="${c * 16 + 10}" y="${r * 16 + 10}" width="16" height="16" fill="${color}" opacity="0.4" rx="2" />`;
          }
        }
      }
    }
  }

  // Cell 8: Recursive Geometric Fractals
  function renderCell8(data, color, dark, light) {
    const b1 = data[0];
    
    svgContent += `<rect width="100" height="100" fill="${color}" />`;

    const size = 32 + (b1 % 12); // 32 to 43
    const half = size / 2;
    
    // Level 1 (Center)
    svgContent += `<rect x="${50 - half}" y="${50 - half}" width="${size}" height="${size}" fill="${dark}" stroke="${light}" stroke-width="1.5" />`;

    // Level 2 (4 corners)
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
      
      // Small central circle in children
      svgContent += `<circle cx="${c.cx}" cy="${c.cy}" r="${cSize*0.25}" fill="${color}" />`;
    });
  }
}
