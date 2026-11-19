import { drawPerson, NAMES_RU } from './person.js';
import { gameNow } from '../core/clock.js';

const OUT = '#1d1612';

function rect(ctx, c, x, y, w, h) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function nameHash(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return h;
}

/** Prologue figure: the same slim person as in the game (running, climbing the ladder, walking, standing). */
export function drawRunningSurvivor(ctx, x, y, color, name, isRunning, climbing = false, pose = null, facing = 1) {
  if (!isRunning) return;
  const p = pose || (climbing ? 'climb' : 'run');
  const ph = gameNow() * (p === 'climb' ? 0.006 : p === 'run' ? 0.009 : 0.008) + nameHash(name);
  drawPerson(ctx, x, y, { id: name.toLowerCase(), pose: p, facing, phase: ph, tag: NAMES_RU[name.toLowerCase()] || name });
}

export function drawSpeechBubble(ctx, x, y, text) {
  ctx.font = 'bold 10px sans-serif';
  const tw = Math.ceil(ctx.measureText(text).width);
  const bx = Math.round(x - tw / 2 - 6), by = Math.round(y - 14), bw = tw + 12, bh = 17;
  rect(ctx, OUT, bx - 1, by - 1, bw + 2, bh + 2);
  rect(ctx, '#fbf7ec', bx, by, bw, bh);
  // tail
  rect(ctx, OUT, Math.round(x) - 3, by + bh, 7, 2);
  rect(ctx, '#fbf7ec', Math.round(x) - 2, by + bh - 1, 5, 2);
  rect(ctx, OUT, Math.round(x) - 1, by + bh + 2, 3, 2);
  ctx.fillStyle = OUT;
  ctx.fillText(text, bx + 6, by + 12);
}

function drawZombie(ctx, zx, zy, i, t, scale, chasing, dir = 1) {
  if (dir < 0) {                       // mirror around the zombie so it can walk left
    ctx.save();
    ctx.translate(zx, 0); ctx.scale(-1, 1); ctx.translate(-zx, 0);
    drawZombie(ctx, zx, zy, i, t, scale, chasing, 1);
    ctx.restore();
    return;
  }
  const s = scale;
  const lurch = Math.sin(t * 1.6 + i * 1.7);
  const bob = Math.abs(Math.sin(t * 1.6 + i)) * 2 * s;
  const x = Math.round(zx);
  const y = Math.round(zy - bob);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath(); ctx.ellipse(x, zy + 1, 7 * s, 2, 0, 0, Math.PI * 2); ctx.fill();

  const cloth = ['#3a3a33', '#4b3a30', '#2f3b3d', '#3d4233', '#523a38', '#2c2d33'][i % 6];
  const skin = ['#7d8c6b', '#6e7d5f', '#8a9475', '#657456'][i % 4];
  const hh = Math.round(30 * s);

  // legs (dragging, out of phase)
  const l = Math.round(lurch * 3);
  rect(ctx, OUT, x - 4 - l, y - 13 * s, 4, 14 * s);
  rect(ctx, '#2b2a28', x - 3 - l, y - 12 * s, 2, 12 * s);
  rect(ctx, OUT, x + l, y - 13 * s, 4, 14 * s);
  rect(ctx, '#2b2a28', x + 1 + l, y - 12 * s, 2, 12 * s);

  // torso, hunched forward
  rect(ctx, OUT, x - 5, y - hh + 8 * s, 11, 17 * s);
  rect(ctx, cloth, x - 4, y - hh + 9 * s, 9, 15 * s);
  rect(ctx, 'rgba(120, 20, 20, 0.55)', x - 3 + (i % 3), y - hh + 14 * s, 3, 4);

  // head tilted
  const hx = x + 3 + Math.round(lurch);
  rect(ctx, OUT, hx - 4, y - hh, 9, 9);
  rect(ctx, skin, hx - 3, y - hh + 1, 7, 7);
  rect(ctx, '#2a2a22', hx - 3, y - hh + 1, 7, 2);
  rect(ctx, (i % 3 === 0) ? '#e74c3c' : '#f2b441', hx + 1, y - hh + 4, 2, 1);

  // arms stretched forward toward the survivors
  const reach = chasing ? 11 : Math.round(8 + Math.sin(t * 2 + i) * 5);
  const ay = y - hh + 12 * s + Math.round(Math.cos(t * 2.2 + i) * 2);
  rect(ctx, OUT, x + 2, ay - 1, reach, 4);
  rect(ctx, skin, x + 3, ay, reach - 2, 2);
}

function hordeSpot(i, leadX, t) {
  const depth = (i * 37 % 100) / 100;               // 0 = front of the horde
  const back = Math.pow(depth, 1.4) * 330 + (i % 4) * 6;
  return { depth, x: leadX - 18 - back + Math.sin(t * 0.7 + i * 2) * 5 };
}

/**
 * Horde of infected chasing the survivors: a loose surge behind `leadX` (dense at the front,
 * thinning out behind). Once `sinceClose` >= 0 (the hatch is shut) they stop pressing on it and
 * wander the street instead, starting from where the chase left them.
 */
export function drawZombiePile(ctx, leadX, skyH, sinceClose = -1) {
  const t = gameNow() * 0.005;
  const count = 46;

  if (sinceClose >= 0) {
    for (let i = count - 1; i >= 0; i--) {
      const { x: x0 } = hordeSpot(i, leadX, 0);
      const w = 0.00035 * (0.6 + (i % 5) * 0.18);
      const amp = 70 + (i * 29) % 110;
      const ph0 = (i % 7) * 0.2;
      const ph = sinceClose * w + ph0;
      // displacement is zero at the moment of slamming, so there is no jump out of the chase
      const x = x0 + amp * (Math.sin(ph) - Math.sin(ph0));
      const dir = Math.cos(ph) >= 0 ? 1 : -1;
      drawZombie(ctx, x, skyH - 1 - (i % 3) * 2.5, i, t + i, 0.9 + (i % 4) * 0.04, false, dir);
    }
    return;
  }

  for (let i = count - 1; i >= 0; i--) {
    const { depth, x } = hordeSpot(i, leadX, t);
    drawZombie(ctx, x, skyH - 1 - (i % 3) * 2.5, i, t + depth, 0.9 + (i % 4) * 0.04, depth < 0.35);
  }
}

/** A few infected shambling around the street during the game. */
export function drawWanderingZombies(ctx, centerX, skyH, count, spread) {
  const now = gameNow();
  const t = now * 0.005;
  for (let i = 0; i < count; i++) {
    const base = centerX + (((i * 137) % 1000) / 1000 - 0.5) * spread;
    const w = 0.00025 * (0.6 + (i % 5) * 0.2);
    const ph = now * w + i * 1.7;
    const x = base + 90 * Math.sin(ph);
    drawZombie(ctx, x, skyH - 1 - (i % 3) * 2.5, i, t + i, 0.9 + (i % 4) * 0.04, false, Math.cos(ph) >= 0 ? 1 : -1);
  }
}
