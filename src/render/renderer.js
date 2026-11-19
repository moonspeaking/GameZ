import { viewport } from '../core/viewport.js';
import { getZoom } from '../core/camera.js';
import { G } from '../core/state.js';
import { CELL_SIZE, SURFACE_Y } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { drawSurfaceWorld, drawRunningSurvivor, drawSpeechBubble, drawZombiePile } from './surface.js';
import { drawTerrain, drawCentralConcreteShaft } from './underground.js';
import { drawRooms } from './room_props.js';
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

function renderPrologue() {
  const t = G.prologue.t;
  const hatchX = G.prologue.hatchX;
  const skyH = SURFACE_Y * CELL_SIZE;

  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }
  applyCamera();

  drawSurfaceWorld(ctx, G);
  drawTerrain(ctx, G);
  drawCentralConcreteShaft(ctx, G);
  drawRooms(ctx, G);

  if (t < 8500) {
    const p = Math.min(1, t / 7000);
    const eliX = 140 + p * (hatchX - 130);
    const noraX = 100 + p * (hatchX - 100);
    const waltX = 70 + p * (hatchX - 70);
    const rayX = 35 + p * (hatchX - 40);
    const groundY = skyH - 2;

    drawRunningSurvivor(ctx, eliX, groundY, '#2ecc71', 'ELI', t < 7200);
    drawRunningSurvivor(ctx, noraX, groundY, '#e74c3c', 'NORA', t < 7600);
    drawRunningSurvivor(ctx, waltX, groundY, '#f1c40f', 'WALT', t < 8400);
    drawRunningSurvivor(ctx, rayX, groundY, '#3498db', 'RAY', t < 8000);

    if (t > 1000 && t < 4500) {
      drawSpeechBubble(ctx, eliX, groundY - 32, 'GO! GO!');
    } else if (t >= 4500 && t < 7000) {
      drawSpeechBubble(ctx, waltX, groundY - 32, 'KEEP RUNNING!');
    } else if (t >= 7000 && t < 8500) {
      drawSpeechBubble(ctx, waltX, groundY - 32, 'Down, down, down!');
    }
  }

  const hordeLeadX = (t < 7500)
    ? (t / 7000) * (hatchX - 100) - 70
    : hatchX - 25;

  drawZombiePile(ctx, hordeLeadX, skyH, t >= 8500);
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
  if (G.shake > 0) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }
  applyCamera();

  // 1. World Rendering Layers
  drawSurfaceWorld(ctx, G);
  drawTerrain(ctx, G);
  drawCentralConcreteShaft(ctx, G);
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
