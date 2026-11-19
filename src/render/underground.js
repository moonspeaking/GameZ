import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED, PEBBLES } from '../core/constants.js';
import { getStrataPattern, getConcretePattern, getSteelPattern, getHazardPattern } from './procedural_textures.js';
import { gameNow } from '../core/clock.js';

export function drawTerrain(ctx, G) {
  const strata = [
    { start: SURFACE_Y, end: SURFACE_Y + 10, patternIdx: 0, tint: '#6e4c2c' }, // Topsoil & Root Zone
    { start: SURFACE_Y + 10, end: SURFACE_Y + 24, patternIdx: 1, tint: '#5e4026' }, // Compacted Silt & Clay
    { start: SURFACE_Y + 24, end: SURFACE_Y + 38, patternIdx: 2, tint: '#4d3520' }, // Dense Shale & Pre-war Drift
    { start: SURFACE_Y + 38, end: 46, patternIdx: 3, tint: '#3b2a1b' }, // Deep Slate & River Cavern
    { start: 46, end: MAP_ROWS, patternIdx: 4, tint: '#2a2630' } // Basalt Bedrock
  ];

  for (let r = SURFACE_Y; r < MAP_ROWS; r++) {
    const y = r * CELL_SIZE;
    const tier = strata.find(s => r >= s.start && r < s.end) || strata[strata.length - 1];
    const pat = getStrataPattern(ctx, tier.patternIdx);
    ctx.fillStyle = pat || tier.tint;

    for (let c = 0; c < MAP_COLS; c++) {
      if (G.grid[r] && G.grid[r][c] !== C_EXCAVATED) {
        ctx.fillRect(c * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Solid earth beyond the map edges, so the view never shows an empty void next to the town
  const mapW = MAP_COLS * CELL_SIZE;
  strata.forEach(tier => {
    ctx.fillStyle = getStrataPattern(ctx, tier.patternIdx) || tier.tint;
    const y0 = tier.start * CELL_SIZE, h = (Math.min(tier.end, MAP_ROWS) - tier.start) * CELL_SIZE;
    ctx.fillRect(-600, y0, 600, h);
    ctx.fillRect(mapW, y0, 600, h);
  });

  // Soften the boundary between layers with a short cross-fade, so there is no hard stripe
  for (let i = 1; i < strata.length; i++) {
    const by = strata[i].start * CELL_SIZE;
    const fade = 48, steps = 12;
    ctx.fillStyle = getStrataPattern(ctx, strata[i].patternIdx) || strata[i].tint;
    for (let k = 0; k < steps; k++) {
      ctx.globalAlpha = (k + 1) / (steps + 1);
      ctx.fillRect(-600, by - fade + (k * fade) / steps, mapW + 1200, fade / steps + 0.5);
    }
    ctx.globalAlpha = 1;
  }

  // Excavated cavities: dark warm back wall instead of a see-through void
  ctx.fillStyle = '#2b1c11';
  for (let r = SURFACE_Y; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (G.grid[r] && G.grid[r][c] === C_EXCAVATED) {
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Ambient occlusion: shade solid earth along the edges that face a cavity, so tunnels read as carved
  const isOpen = (r, c) => !G.grid[r] || G.grid[r][c] === C_EXCAVATED;
  const AO = 4;
  for (let r = SURFACE_Y; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (!G.grid[r] || G.grid[r][c] === C_EXCAVATED) continue;
      const x = c * CELL_SIZE, y = r * CELL_SIZE;
      const up = r > SURFACE_Y && isOpen(r - 1, c);
      const down = r < MAP_ROWS - 1 && isOpen(r + 1, c);
      const left = c > 0 && isOpen(r, c - 1);
      const right = c < MAP_COLS - 1 && isOpen(r, c + 1);
      if (!(up || down || left || right)) continue;
      ctx.fillStyle = 'rgba(20, 10, 4, 0.45)';
      if (up) ctx.fillRect(x, y, CELL_SIZE, AO);
      if (down) ctx.fillRect(x, y + CELL_SIZE - AO, CELL_SIZE, AO);
      if (left) ctx.fillRect(x, y, AO, CELL_SIZE);
      if (right) ctx.fillRect(x + CELL_SIZE - AO, y, AO, CELL_SIZE);
      // Thin lit rim on the ceiling edge
      if (down) { ctx.fillStyle = 'rgba(255, 215, 150, 0.10)'; ctx.fillRect(x, y + CELL_SIZE - AO - 1, CELL_SIZE, 1); }
    }
  }

  // Depth shading: the earth gets gradually darker towards the bedrock
  const depthGrad = ctx.createLinearGradient(0, SURFACE_Y * CELL_SIZE, 0, MAP_ROWS * CELL_SIZE);
  depthGrad.addColorStop(0, 'rgba(25, 12, 4, 0)');
  depthGrad.addColorStop(1, 'rgba(25, 12, 4, 0.45)');
  ctx.fillStyle = depthGrad;
  ctx.fillRect(-600, SURFACE_Y * CELL_SIZE, MAP_COLS * CELL_SIZE + 1200, (MAP_ROWS - SURFACE_Y) * CELL_SIZE);

  // 1. Hanging Birch/Oak Roots penetrating topsoil (Depth 0m to -12m)
  ctx.strokeStyle = '#2d1c10';
  ctx.lineWidth = 1.8;
  const rootCols = [6, 11, 19, 28, 35, 42, 50, 58];
  rootCols.forEach(col => {
    const rx = col * CELL_SIZE + 4;
    const startY = SURFACE_Y * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(rx, startY);
    ctx.quadraticCurveTo(rx - 8, startY + 25, rx - 3, startY + 50);
    ctx.quadraticCurveTo(rx + 6, startY + 75, rx + 1, startY + 95);
    ctx.stroke();

    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(rx - 4, startY + 35);
    ctx.lineTo(rx - 14, startY + 60);
    ctx.moveTo(rx + 2, startY + 65);
    ctx.lineTo(rx + 10, startY + 85);
    ctx.stroke();
    ctx.lineWidth = 1.8;
  });

  // 2. Embedded natural rounded pebbles & mineral ores in unexcavated earth
  PEBBLES.forEach(p => {
    const col = Math.floor(p.x / CELL_SIZE);
    const row = Math.floor(p.y / CELL_SIZE);
    if (row >= SURFACE_Y && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
      if (G.grid[row] && G.grid[row][col] !== C_EXCAVATED) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // Subtle highlight on stone
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.arc(p.x - 0.5, p.y - 0.5, p.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // 3. Pre-war Abandoned Coal Mine Drift (-38m, r = 38)
  if (G.day > 365 * 3) {
    const mineY = 38 * CELL_SIZE;
    ctx.fillStyle = '#100e0c';
    ctx.fillRect(30, mineY, (MAP_COLS - 3) * CELL_SIZE, CELL_SIZE * 1.6);

    // Weathered timber pit props
    for (let tx = 40; tx < (MAP_COLS - 3) * CELL_SIZE; tx += 34) {
      ctx.fillStyle = '#362215';
      ctx.fillRect(tx, mineY, 7, CELL_SIZE * 1.6);
      ctx.fillStyle = '#26170d';
      ctx.fillRect(tx + 5, mineY, 2, CELL_SIZE * 1.6); // shadow
      ctx.fillStyle = '#422c1d';
      ctx.fillRect(tx - 6, mineY, 19, 6); // cap beam

      // Iron bracket bolts
      ctx.fillStyle = '#111';
      ctx.fillRect(tx + 2, mineY + 7, 2, 2);
    }

    // Corroded narrow gauge railway track
    ctx.strokeStyle = '#282420';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, mineY + CELL_SIZE * 1.4);
    ctx.lineTo((MAP_COLS - 3) * CELL_SIZE, mineY + CELL_SIZE * 1.4);
    ctx.stroke();
  }

  // 4. Underground Aquifer River (-55m, r = 44)
  if (G.day > 365 * 3) {
    const riverY = 44 * CELL_SIZE;
    const riverH = CELL_SIZE * 2.5;

    // Deep water gradient
    const waterGrad = ctx.createLinearGradient(0, riverY, 0, riverY + riverH);
    waterGrad.addColorStop(0, '#0f2330');
    waterGrad.addColorStop(0.5, '#0a1720');
    waterGrad.addColorStop(1, '#050c12');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, riverY, MAP_COLS * CELL_SIZE, riverH);

    // Flowing foam and water ripples
    ctx.strokeStyle = 'rgba(74, 155, 198, 0.35)';
    ctx.lineWidth = 1.5;
    const waveOff = (gameNow() * 0.04) % 50;
    for (let wx = -50 + waveOff; wx < MAP_COLS * CELL_SIZE; wx += 48) {
      ctx.beginPath();
      ctx.moveTo(wx, riverY + 12);
      ctx.quadraticCurveTo(wx + 24, riverY + 6, wx + 48, riverY + 12);
      ctx.stroke();
    }

    // Subterranean stalactite drops
    ctx.fillStyle = 'rgba(100, 190, 240, 0.6)';
    const dripT = (gameNow() * 0.003) % 1;
    ctx.beginPath();
    ctx.arc(140, riverY + dripT * 20, 1.5, 0, Math.PI * 2);
    ctx.arc(380, riverY + ((dripT + 0.4) % 1) * 20, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Left Depth Ruler Marks (-10m, -20m, -30m... -120m) with industrial stenciled font
  ctx.fillStyle = 'rgba(215, 225, 235, 0.4)';
  ctx.font = 'bold 9px monospace';
  for (let depth = 10; depth <= 120; depth += 10) {
    const dy = (SURFACE_Y + Math.floor(depth / 2.8)) * CELL_SIZE;
    ctx.fillText(`-${depth}m`, 10, dy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath(); ctx.moveTo(46, dy - 3); ctx.lineTo(60, dy - 3); ctx.stroke();
  }
}

export function drawCentralConcreteShaft(ctx, G) {
  const hatchCol = Math.floor(MAP_COLS / 2);
  const x = hatchCol * CELL_SIZE;
  const startY = SURFACE_Y * CELL_SIZE;
  const endY = (MAP_ROWS - 6) * CELL_SIZE;
  const shaftW = CELL_SIZE * 2;

  // Concrete Structural Shaft Walls with procedural texture
  const concretePat = getConcretePattern(ctx);
  ctx.fillStyle = concretePat || '#44484d';
  ctx.fillRect(x - 6, startY, 6, endY - startY);
  ctx.fillRect(x + shaftW, startY, 6, endY - startY);

  // Heavy steel edge angles on concrete shaft corners
  ctx.fillStyle = '#22252a';
  ctx.fillRect(x - 1, startY, 1, endY - startY);
  ctx.fillRect(x + shaftW, startY, 1, endY - startY);

  // Dual Steel Elevator Guide Rails (machined steel)
  ctx.strokeStyle = '#1b1d20';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 9, startY); ctx.lineTo(x + 9, endY);
  ctx.moveTo(x + shaftW - 9, startY); ctx.lineTo(x + shaftW - 9, endY);
  ctx.stroke();

  ctx.strokeStyle = '#4e5560';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10, startY); ctx.lineTo(x + 10, endY);
  ctx.moveTo(x + shaftW - 8, startY); ctx.lineTo(x + shaftW - 8, endY);
  ctx.stroke();

  // Heavy steel ladder rungs with shadow
  ctx.strokeStyle = '#16181b';
  ctx.lineWidth = 2.2;
  for (let ly = startY + 6; ly < endY; ly += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 18, ly + 1);
    ctx.lineTo(x + shaftW - 18, ly + 1);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a626d';
  ctx.lineWidth = 1.4;
  for (let ly = startY + 6; ly < endY; ly += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 18, ly);
    ctx.lineTo(x + shaftW - 18, ly);
    ctx.stroke();
  }

  // Industrial Steel Grate Catwalks & Safety Railings across shaft
  const hazardPat = getHazardPattern(ctx);
  const floors = [SURFACE_Y + 4, SURFACE_Y + 9, SURFACE_Y + 14, SURFACE_Y + 21, SURFACE_Y + 28, 43];
  floors.forEach(fr => {
    const fy = fr * CELL_SIZE + CELL_SIZE * 4 - 4;
    // Steel I-beam base
    ctx.fillStyle = '#222529';
    ctx.fillRect(x, fy, shaftW, 5);

    // Yellow hazard warning stripe along catwalk toe board
    ctx.fillStyle = hazardPat || '#c09818';
    ctx.fillRect(x, fy - 2, shaftW, 2);

    // Industrial pipe safety railing
    ctx.strokeStyle = '#8a929e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, fy - 14); ctx.lineTo(x + shaftW, fy - 14);
    ctx.moveTo(x, fy - 7); ctx.lineTo(x + shaftW, fy - 7);
    ctx.stroke();

    // Railing vertical posts
    ctx.strokeStyle = '#32373e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, fy); ctx.lineTo(x + 2, fy - 14);
    ctx.moveTo(x + shaftW - 2, fy); ctx.lineTo(x + shaftW - 2, fy - 14);
    ctx.moveTo(x + shaftW / 2, fy); ctx.lineTo(x + shaftW / 2, fy - 14);
    ctx.stroke();
  });

  // Motorized Heavy Industrial Elevator Platform (Year 14+)
  if (G.elevator.unlocked) {
    const ey = G.elevator.y;
    const steelPat = getSteelPattern(ctx);
    ctx.fillStyle = steelPat || '#2a2e35';
    ctx.fillRect(x + 2, ey, shaftW - 4, 22);

    // Hazard stripes on cage floor
    ctx.fillStyle = hazardPat || '#b38f12';
    ctx.fillRect(x + 2, ey + 19, shaftW - 4, 3);

    // Steel mesh protective cage
    ctx.strokeStyle = 'rgba(200, 210, 225, 0.25)';
    ctx.lineWidth = 1;
    for (let cx = x + 5; cx < x + shaftW - 4; cx += 4) {
      ctx.beginPath(); ctx.moveTo(cx, ey + 3); ctx.lineTo(cx, ey + 18); ctx.stroke();
    }

    // Overhead yellow cage inspection lamp
    ctx.fillStyle = 'rgba(255, 230, 140, 0.85)';
    ctx.beginPath();
    ctx.arc(x + shaftW / 2, ey + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
