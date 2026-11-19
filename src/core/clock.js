/** Animation clock that stands still while the game is paused (use instead of Date.now() for visuals). */
import { G } from './state.js';

let offset = 0;
let pausedAt = 0;

export function gameNow() {
  return (G.paused ? pausedAt : Date.now()) - offset;
}

export function setPaused(paused) {
  if (paused && !G.paused) pausedAt = Date.now();
  if (!paused && G.paused) offset += Date.now() - pausedAt;
}
