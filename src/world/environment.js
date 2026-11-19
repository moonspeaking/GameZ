/**
 * Ambient world motion: elevator platform and winter snowfall.
 */
import { G } from '../core/state.js';
import { CELL_SIZE, SURFACE_Y, MAP_ROWS } from '../core/constants.js';

export function updateEnvironment(simDt) {
  // Elevator platform motion
  if (G.elevator.unlocked) {
    G.elevator.y += G.elevator.dir * (G.elevator.speed * simDt * 0.001);
    const minY = (SURFACE_Y + 4) * CELL_SIZE;
    const maxY = (MAP_ROWS - 10) * CELL_SIZE;
    if (G.elevator.y >= maxY) { G.elevator.y = maxY; G.elevator.dir = -1; }
    if (G.elevator.y <= minY) { G.elevator.y = minY; G.elevator.dir = 1; }
  }

  // Snowflakes (Year 30 winter)
  if (G.isWinterSnow) {
    G.snowflakes.forEach(s => {
      s.y += s.speed * (simDt * 0.06);
      s.x += Math.sin(Date.now() * 0.002 + s.wobble) * 0.4;
      if (s.y > SURFACE_Y * CELL_SIZE + 20) s.y = -50;
    });
  }
}
