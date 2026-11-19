/**
 * 2D Volumetric Lighting & Lightmap System for 30 Years Underground.
 * Simulates subterranean darkness, room ceiling fixtures with warm tungsten falloff,
 * miner headlamp cones, blackout emergency diodes, and Red Alert strobes.
 */
import { CELL_SIZE, SURFACE_Y, MAP_COLS } from '../core/constants.js';

let lightCanvas = null;
let lightCtx = null;

export function initLighting() {
  if (typeof document === 'undefined') return;
  lightCanvas = document.createElement('canvas');
  lightCtx = lightCanvas.getContext('2d');
}

export function resizeLighting(w, h) {
  if (!lightCanvas) return;
  lightCanvas.width = w;
  lightCanvas.height = h;
}

export function drawLightingOverlay(ctx, G, camX, camY, viewW, viewH, zoom = 1) {
  if (!G.settings?.lightingEnabled) return;
  if (!lightCanvas || !lightCtx) initLighting();
  if (!lightCanvas) return;

  if (lightCanvas.width !== viewW || lightCanvas.height !== viewH) {
    lightCanvas.width = viewW;
    lightCanvas.height = viewH;
  }

  const lCtx = lightCtx;
  lCtx.setTransform(1, 0, 0, 1, 0, 0);
  // World-space extents of the viewport (used for culling once the zoom transform is on)
  const worldW = viewW / zoom;
  const worldH = viewH / zoom;
  const isBlackout = (G.res && G.res.energy <= 0);
  const isRedAlert = !!G.redAlert;
  const timeHour = G.timeHour ?? 12;
  const isNight = (timeHour >= 21 || timeHour < 6);

  // 1. Fill lightmap with ambient darkness
  // Above surface: depends on hour and weather. Below surface: deep pitch darkness.
  lCtx.globalCompositeOperation = 'source-over';
  lCtx.fillStyle = 'rgba(10, 12, 16, 0.88)'; // Deep underground gloom
  lCtx.fillRect(0, 0, viewW, viewH);

  // Surface sky cutout (let sunlight or moonlight through)
  const surfaceScreenY = Math.floor((SURFACE_Y * CELL_SIZE - camY) * zoom);
  if (surfaceScreenY > 0) {
    const skyAlpha = isNight ? 0.65 : (G.isWinterSnow ? 0.25 : 0.05);
    lCtx.clearRect(0, 0, viewW, Math.min(viewH, surfaceScreenY));
    lCtx.fillStyle = `rgba(12, 16, 24, ${skyAlpha})`;
    lCtx.fillRect(0, 0, viewW, Math.min(viewH, surfaceScreenY));
  }

  // 2. Cut holes in darkness for all light sources (destination-out), in zoomed world space
  lCtx.globalCompositeOperation = 'destination-out';
  lCtx.setTransform(zoom, 0, 0, zoom, 0, 0);

  // Room Light Fixtures
  if (G.rooms && Array.isArray(G.rooms)) {
    G.rooms.forEach(r => {
      if (r.state === 'blueprint') return;
      const rx = r.x * CELL_SIZE - camX;
      const ry = r.y * CELL_SIZE - camY;
      const rw = r.w * CELL_SIZE;
      const rh = r.h * CELL_SIZE;

      // Check view frustum
      if (rx + rw < -100 || rx > worldW + 100 || ry + rh < -100 || ry > worldH + 100) return;

      if (isBlackout) {
        // Only dim emergency red diode in ceiling center
        const grad = lCtx.createRadialGradient(rx + rw / 2, ry + 12, 2, rx + rw / 2, ry + 12, 45);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(rx + rw / 2, ry + 12, 45, 0, Math.PI * 2);
        lCtx.fill();
        return;
      }

      // Normal room lighting: 2 ceiling hanging light fixtures with volumetric conical pool
      const lightCount = Math.max(1, Math.floor(r.w / 4));
      const spacing = rw / (lightCount + 1);

      for (let li = 1; li <= lightCount; li++) {
        const lx = rx + spacing * li;
        const ly = ry + 8;
        const rad = Math.max(rw * 0.7, rh * 1.1);

        // Cut soft radial hole
        const radGrad = lCtx.createRadialGradient(lx, ly, 10, lx, ly + rh * 0.4, rad);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = radGrad;
        lCtx.beginPath();
        lCtx.arc(lx, ly + rh * 0.4, rad, 0, Math.PI * 2);
        lCtx.fill();
      }
    });
  }

  // Central Concrete Shaft Bulkhead Safety Lights (every floor)
  const hatchCol = Math.floor(MAP_COLS / 2);
  const shaftScreenX = hatchCol * CELL_SIZE + CELL_SIZE - camX;
  const floors = [SURFACE_Y + 4, SURFACE_Y + 9, SURFACE_Y + 14, SURFACE_Y + 21, SURFACE_Y + 28, 43];
  floors.forEach(fr => {
    const fy = fr * CELL_SIZE + CELL_SIZE * 4 - 8 - camY;
    if (fy >= -50 && fy <= worldH + 50) {
      const grad = lCtx.createRadialGradient(shaftScreenX, fy, 4, shaftScreenX, fy, 55);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.arc(shaftScreenX, fy, 55, 0, Math.PI * 2);
      lCtx.fill();
    }
  });

  // Colonist Miner Headlamp Cones (direct light when digging or walking in dark areas)
  if (G.colonists && Array.isArray(G.colonists)) {
    G.colonists.forEach(c => {
      if (c.status === 'dead') return;
      const cx = c.x - camX;
      const cy = c.y - 24 - camY;

      // Miner headlamp cone
      const hasHeadlamp = (c.id === 'walt' || c.action === 'dig' || c.action === 'mine' || isBlackout);
      if (hasHeadlamp) {
        const dir = (c.targetX && c.targetX < c.x) ? -1 : 1;
        const beamLength = 80;
        const beamAngle = 0.45; // radians

        lCtx.save();
        lCtx.translate(cx, cy);
        lCtx.rotate(dir === 1 ? 0.15 : Math.PI - 0.15);

        const coneGrad = lCtx.createRadialGradient(0, 0, 4, beamLength, 0, beamLength);
        coneGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = coneGrad;

        lCtx.beginPath();
        lCtx.moveTo(0, 0);
        lCtx.arc(0, 0, beamLength, -beamAngle, beamAngle);
        lCtx.closePath();
        lCtx.fill();
        lCtx.restore();
      }

      // Small ambient body glow
      const bodyGrad = lCtx.createRadialGradient(cx, cy + 10, 2, cx, cy + 10, 26);
      bodyGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = bodyGrad;
      lCtx.beginPath();
      lCtx.arc(cx, cy + 10, 26, 0, Math.PI * 2);
      lCtx.fill();
    });
  }

  // 3. Additive Warm/Cold Color Tinting pass over the cutouts (lighter)
  lCtx.globalCompositeOperation = 'source-over';

  // Red Alert or Blackout tint (full-screen, so draw in screen space)
  lCtx.setTransform(1, 0, 0, 1, 0, 0);
  if (isRedAlert) {
    const pulse = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
    lCtx.fillStyle = `rgba(220, 20, 20, ${0.15 + pulse * 0.22})`;
    lCtx.fillRect(0, 0, viewW, viewH);
  } else if (isBlackout) {
    lCtx.fillStyle = 'rgba(180, 20, 20, 0.08)';
    lCtx.fillRect(0, 0, viewW, viewH);
  }

  // Room colored lighting tints (warm tungsten, purple grow, cyan clinic) in zoomed world space
  lCtx.setTransform(zoom, 0, 0, zoom, 0, 0);
  if (!isBlackout && G.rooms) {
    G.rooms.forEach(r => {
      if (r.state === 'blueprint') return;
      const rx = r.x * CELL_SIZE - camX;
      const ry = r.y * CELL_SIZE - camY;
      const rw = r.w * CELL_SIZE;
      const rh = r.h * CELL_SIZE;

      let tint = 'rgba(255, 214, 150, 0.12)'; // warm 2700K tungsten default
      if (r.type === 'hydroponics') tint = 'rgba(215, 80, 255, 0.16)';
      else if (r.type === 'generator') tint = 'rgba(255, 140, 30, 0.15)';
      else if (r.type === 'clinic') tint = 'rgba(120, 230, 255, 0.14)';
      else if (r.type === 'water') tint = 'rgba(60, 180, 240, 0.12)';
      else if (r.type === 'armory') tint = 'rgba(180, 240, 100, 0.10)';
      else if (r.type === 'lab' || r.type === 'comms') tint = 'rgba(100, 210, 255, 0.14)';

      lCtx.fillStyle = tint;
      lCtx.fillRect(rx, ry, rw, rh);
    });
  }

  lCtx.setTransform(1, 0, 0, 1, 0, 0);

  // 4. Finally, blend the composite lightmap onto the game canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset camera transform for screen-space draw
  ctx.drawImage(lightCanvas, 0, 0);
  ctx.restore();
}
