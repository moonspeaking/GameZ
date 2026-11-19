import { viewport } from '../core/viewport.js';
import { getZoom } from '../core/camera.js';
import { G } from '../core/state.js';
import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, PROLOGUE, C_DIRT, C_EXCAVATED } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { drawSurfaceWorld, drawRunningSurvivor, drawSpeechBubble, drawZombiePile, drawWanderingZombies } from './surface.js';
import { drawTerrain, drawCentralConcreteShaft } from './underground.js';
import { drawRooms } from './room_props.js';
import { drawCorridors } from './corridors.js';
import { drawBlueprints, drawInteractivePlacementOverlay } from './placement_overlay.js';
import { drawColonists } from './colonist_sprites.js';
import { updateSurveillanceFeed } from './surveillance.js';
import { drawLightingOverlay, resizeLighting } from './lighting.js';
import { drawParticles, spawnWeldingSparks, updateParticles } from './particles.js';
import { drawFloatingTexts, spawnFloatingText, updateFloatingTexts } from './floating_fx.js';
import { AmbienceEngine } from '../audio/ambience.js';

let canvas = null;
let ctx = null;
let W = 1200;
let H = 700;

export function resizeCanvas() {
  if (!canvas) return;
  W = window.innerWidth;
  H = window.innerHeight;
  viewport.w = W || 1200;
  viewport.h = H || 700;
  const sb = document.getElementById('sidebar-hud');
  const sbW = sb && W > 900 ? sb.offsetWidth : 0;
  viewport.visibleW = Math.max(300, viewport.w - sbW);
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  resizeLighting(W, H);
}

/** Per-frame animation of particles and floating texts (visual-only state). */
export function updateFx() {
  if (G.particles) updateParticles(G.particles);
  if (G.floatingTexts) updateFloatingTexts(G.floatingTexts);
}

export function initRenderer(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  eventBus.on('canvas_resize', resizeCanvas);
  eventBus.on('render_request', render);
  eventBus.on('floating_text', ({ x, y, text, color }) => {
    if (G.floatingTexts) spawnFloatingText(G.floatingTexts, x, y, text, color);
  });
  eventBus.on('room:completed', (room) => {
    if (G.particles) {
      for (let s = 0; s < 6; s++) {
        spawnWeldingSparks(G.particles, (room.x + Math.random() * room.w) * CELL_SIZE, (room.y + room.h - 1) * CELL_SIZE);
      }
    }
    if (G.floatingTexts) {
      spawnFloatingText(G.floatingTexts, (room.x + room.w / 2) * CELL_SIZE, room.y * CELL_SIZE, `🏗️ ${room.name}`, '#2ecc71', 12);
    }
  });
}

/** World -> screen transform: scale by zoom, then offset by the (pixel-snapped) camera. */
function applyCamera() {
  const z = getZoom();
  ctx.scale(z, z);
  ctx.translate(-Math.floor(G.cam.x), -Math.floor(G.cam.y));
  ctx.imageSmoothingEnabled = false;
}

let shaftGridCache = null;
/** Solid earth with only the main shaft dug down to `rows` (for the prologue, before the bunker is shown). */
function getShaftOnlyGrid(rows) {
  const hatchCol = Math.floor(MAP_COLS / 2);
  if (!shaftGridCache) {
    shaftGridCache = Array.from({ length: MAP_ROWS }, () => new Array(MAP_COLS).fill(C_DIRT));
  }
  shaftGridCache.forEach((row, r) => {
    const open = r >= SURFACE_Y && r < rows;
    row[hatchCol] = open ? C_EXCAVATED : C_DIRT;
    row[hatchCol + 1] = open ? C_EXCAVATED : C_DIRT;
  });
  return shaftGridCache;
}

function renderPrologue() {
  const t = G.prologue.t;
  const hatchX = G.prologue.hatchX;
  const skyH = SURFACE_Y * CELL_SIZE;

  ctx.save();
  applyCamera();

  drawSurfaceWorld(ctx, G);
  // Nothing of the bunker is visible until the first survivor reaches it: the earth is drawn solid
  // (same layers and textures as the real terrain, so there is no seam), the shaft is revealed only
  // as far down as the lowest climber has got, then the real bunker fades in.
  {
    const groundY0 = skyH - 2;
    const floorY = (SURFACE_Y + 4 + 2.5) * CELL_SIZE;
    let deepest = skyH;
    Object.values(PROLOGUE.arrive).forEach(T => {
      const dt = t - T;
      if (dt > 0) deepest = Math.max(deepest, groundY0 + Math.min(1, dt / PROLOGUE.descend) * (floorY - groundY0));
    });
    const reveal = Math.min(1, Math.max(0, (t - (PROLOGUE.arrive.ELI + PROLOGUE.descend - 200)) / 900));
    const shaftBottom = deepest + 30;

    drawTerrain(ctx, { grid: getShaftOnlyGrid(Math.ceil(shaftBottom / CELL_SIZE)), day: G.day });
    ctx.save();
    ctx.beginPath();
    ctx.rect(-600, 0, MAP_COLS * CELL_SIZE + 1200, shaftBottom);
    ctx.clip();
    drawCentralConcreteShaft(ctx, G);
    ctx.restore();

    if (reveal > 0) {
      ctx.globalAlpha = reveal;
      drawTerrain(ctx, G);
      drawCentralConcreteShaft(ctx, G);
      drawCorridors(ctx, G);
      drawRooms(ctx, G);
      ctx.globalAlpha = 1;
    }
  }

  {
    // Runners string out along the street, then each climbs down the shaft ladder in turn
    const ladderX = hatchX + 33;
    const groundY = skyH - 2;
    const runners = [
      { name: 'ELI', color: '#a93226', from: 150, wobble: 0 },
      { name: 'NORA', color: '#dcdde1', from: 105, wobble: 1.3 },
      { name: 'WALT', color: '#d35400', from: 72, wobble: 2.1 },
      { name: 'RAY', color: '#1f3a52', from: 36, wobble: 3.4 }
    ];
    const pos = {};
    const shelterY = (SURFACE_Y + 4 + 2.5) * CELL_SIZE;          // floor of the shelter room
    const depth = shelterY - groundY;
    runners.forEach(r => {
      const T = PROLOGUE.arrive[r.name];
      const dt = t - T;
      const home = G.colonists.find(c => c.id === r.name.toLowerCase());
      const homeX = home && home.x ? home.x : ladderX;
      let x, y, pose = 'run', facing = 1;
      if (dt < 0) {
        x = r.from + (ladderX - r.from) * (t / T) + Math.sin(t * 0.004 + r.wobble) * 3 * (1 - t / T);
        y = groundY;
      } else if (dt < PROLOGUE.descend) {
        x = ladderX;
        y = groundY + (dt / PROLOGUE.descend) * depth;
        pose = 'climb';
      } else {
        const k = Math.min(1, (dt - PROLOGUE.descend) / PROLOGUE.walkIn);
        x = ladderX + (homeX - ladderX) * k;
        y = shelterY;
        facing = homeX >= ladderX ? 1 : -1;
        pose = k < 1 ? 'walk' : 'stand';
      }
      pos[r.name] = { x, y };
      drawRunningSurvivor(ctx, x, y, r.color, r.name, true, false, pose, facing);
    });

    const say = (who, text) => {
      const p = pos[who];
      if (p && p.y !== undefined) drawSpeechBubble(ctx, p.x, Math.min(p.y, groundY + 30) - 62, text);
    };
    if (t > 1500 && t < 7500) say('ELI', 'БЕГОМ! БЕГОМ!');
    else if (t >= 7500 && t < 11000) say('WALT', 'СТАРОЕ УБЕЖИЩЕ! ШАХТНЫЙ ДВОР!');
    else if (t >= 12500 && t < 17000) say('NORA', 'ВНИЗ, ВНИЗ, ВНИЗ!');
    else if (t >= 18000 && t < PROLOGUE.closeEnd) say('RAY', 'ЗАКРЫВАЙ!');
  }

  // The horde gains on the runners and reaches the hatch just as the lid slams
  const hordeLeadX = -300 + Math.min(1, t / PROLOGUE.closeEnd) * (hatchX + 310);

  // After the lid slams the horde stops pressing on it and mills around the street
  drawZombiePile(ctx, hordeLeadX, skyH, t >= PROLOGUE.closeEnd ? t - PROLOGUE.closeEnd : -1);
  ctx.restore();
}

export function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  if (G.state === 'prologue') {
    renderPrologue();
    return;
  }

  const camX = Math.floor(G.cam.x);
  const camY = Math.floor(G.cam.y);

  ctx.save();
  applyCamera();

  // 1. World Rendering Layers
  drawSurfaceWorld(ctx, G);
  if (G.day < 365 * 3) drawWanderingZombies(ctx, G.prologue.hatchX - 120, SURFACE_Y * CELL_SIZE, 14, 900);
  drawTerrain(ctx, G);
  drawCentralConcreteShaft(ctx, G);
  drawCorridors(ctx, G);
  drawRooms(ctx, G);
  drawBlueprints(ctx, G);
  drawInteractivePlacementOverlay(ctx, G);
  drawColonists(ctx, G);

  // 2. Dynamic Particles FX
  if (G.settings?.particlesEnabled !== false && G.particles) {
    drawParticles(ctx, G.particles);
  }

  // 3. Floating Informational Indicators
  if (G.floatingTexts) {
    drawFloatingTexts(ctx, G.floatingTexts);
  }

  // 4. Snowflakes
  if (G.isWinterSnow && G.snowflakes) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    G.snowflakes.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2); ctx.fill();
    });
  }

  ctx.restore();

  // 5. Volumetric 2D Dynamic Lighting Overlay (Screen-space)
  drawLightingOverlay(ctx, G, camX, camY, W, H, getZoom());

  // 6. Audio Ambience State Sync
  AmbienceEngine.updateState(G);

  // 7. Surveillance CRT Feed
  updateSurveillanceFeed(G);
}
