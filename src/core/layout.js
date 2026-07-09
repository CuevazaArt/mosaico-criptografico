/**
 * Semi-anchored mosaic layout (v2).
 * Topological anchor (cell type 4) stays fixed at the geometric center;
 * only peripheral cells are Fisher-Yates shuffled. Reduces scan time vs full shuffle.
 */

export const ANCHOR_CELL_TYPE = 4;

/**
 * @param {number} gridSize
 * @returns {number} Physical index of the geometric center cell
 */
export function centerCellIndex(gridSize) {
  const mid = Math.floor(gridSize / 2);
  return mid * gridSize + mid;
}

/**
 * @param {Uint8Array|Buffer} hash - SHA-256 digest
 * @param {number} numCells - gridSize²
 * @returns {number[]} layout[physicalIndex] = logicalIndex
 */
export function buildSemiAnchoredLayout(hash, numCells) {
  const gridSize = Math.round(Math.sqrt(numCells));
  const centerIdx = centerCellIndex(gridSize);

  const peripheral = [];
  for (let i = 0; i < numCells; i++) {
    if (i !== ANCHOR_CELL_TYPE) peripheral.push(i);
  }

  for (let k = peripheral.length - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    const temp = peripheral[k];
    peripheral[k] = peripheral[j];
    peripheral[j] = temp;
  }

  const layout = new Array(numCells);
  layout[centerIdx] = ANCHOR_CELL_TYPE;
  let p = 0;
  for (let i = 0; i < numCells; i++) {
    if (i === centerIdx) continue;
    layout[i] = peripheral[p++];
  }
  return layout;
}
