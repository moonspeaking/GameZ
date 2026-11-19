/**
 * Core game constants and tile types.
 */
export const CELL_SIZE = 32;
export const MAP_COLS = 64;
export const MAP_ROWS = 65;
export const SURFACE_Y = 8; // Surface road height in cells

export const C_DIRT = 0;
export const C_STONE = 1;
export const C_EXCAVATED = 2;
export const C_BEDROCK = 3;

// Pre-seeded natural rock pebbles in earth
export const PEBBLES = [];
(function initPebbles() {
  for (let i = 0; i < 180; i++) {
    PEBBLES.push({
      x: Math.floor(Math.random() * (MAP_COLS * CELL_SIZE)),
      y: Math.floor((SURFACE_Y + 1 + Math.random() * (MAP_ROWS - SURFACE_Y - 2)) * CELL_SIZE),
      r: 1 + Math.random() * 2.5,
      color: Math.random() < 0.5 ? '#1f1a14' : '#332b22'
    });
  }
})();
