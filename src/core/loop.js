/**
 * Game loop engine. Owns the clock and the frame cadence only; it knows nothing about
 * systems, entities or rendering. Everything else is plugged in by src/bootstrap.js:
 *   registerUpdate('prologue' | 'game', fn)  - per-frame logic (fn receives dt / simDt in ms)
 *   setRenderFn(fn)                          - called once per frame after updates
 *   'new_day' event                          - emitted at midnight, after G.day++
 */
import { G } from './state.js';
import { eventBus } from './event_bus.js';

const updates = { prologue: [], game: [] };
let renderFn = null;
let lastTime = 0;
let isLoopRunning = false;

export function registerUpdate(phase, fn) {
  if (!updates[phase]) throw new Error(`Unknown update phase: ${phase}`);
  updates[phase].push(fn);
}

export function setRenderFn(fn) {
  renderFn = fn;
}

export function update(dt) {
  if (G.state === 'prologue') {
    updates.prologue.forEach(fn => fn(dt));
    return;
  }

  if (G.speed === 0 || G.gameOver || G.won) return;

  const simDt = dt * G.speed;

  // Time simulation
  G.timeMin += simDt * 0.05;
  if (G.timeMin >= 60) {
    G.timeMin = 0;
    G.timeHour = (G.timeHour + 1) % 24;
    if (G.timeHour === 0) {
      G.day++;
      eventBus.emit('new_day');
    }
  }

  updates.game.forEach(fn => fn(simDt));
}

export function gameLoop(now) {
  if (!lastTime) lastTime = now;
  const dt = Math.min(now - lastTime, 100);
  lastTime = now;

  update(dt);
  if (renderFn) renderFn();

  requestAnimationFrame(gameLoop);
}

export function startLoop() {
  if (isLoopRunning) return;
  isLoopRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}
