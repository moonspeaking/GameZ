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

// Prologue timeline (ms): the four runners reach the hatch one after another, climb down the shaft,
// then the last one pulls the lid shut just before the horde arrives.
export const PROLOGUE = {
  arrive: { ELI: 11000, NORA: 12500, WALT: 14000, RAY: 15500 }, // when each runner reaches the hatch
  descend: 5000,        // slow climb down the ladder to the bunker floor
  walkIn: 2000,         // then they walk to their places in the shelter
  openStart: 10200,     // lid swings open only when the first runner is almost at the hatch
  openEnd: 10800,
  closeStart: 20000,    // lid swings shut at the last moment, as the horde reaches the hatch
  closeEnd: 20900,      // lid slams
  zoomStart: 8500,      // camera closes in on the hatch to show the descent
  pan: 24500,           // camera drops into the bunker
  end: 27500
};

// In-game minutes per real millisecond at 1x speed (0.01 -> one game day = 2.4 real minutes).
export const GAME_MINUTES_PER_MS = 0.01;
