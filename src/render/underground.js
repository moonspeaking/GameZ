import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED, PEBBLES } from '../core/constants.js';

export function drawTerrain(ctx, G) {
  const strata = [
    { start: SURFACE_Y, end: SURFACE_Y + 10, colors: ['#4e3623', '#442d1b', '#523925'] }, // Topsoil & Root Zone
    { start: SURFACE_Y + 10, end: SURFACE_Y + 24, colors: ['#412a19', '#382313', '#462e1c'] }, // Compacted Silt & Clay
    { start: SURFACE_Y + 24, end: SURFACE_Y + 38, colors: ['#321e10', '#2a180d', '#362112'] }, // Dense Shale & Pre-war Drift
    { start: SURFACE_Y + 38, end: 46, colors: ['#22160d', '#1a1009', '#25170e'] }, // Deep Slate & River Cavern
    { start: 46, end: MAP_ROWS, colors: ['#17161b', '#121116', '#1a1820'] } // Basalt Bedrock
  ];

  for (let r = SURFACE_Y; r < MAP_ROWS; r++) {
    const y = r * CELL_SIZE;
    const tier = strata.find(s => r >= s.start && r < s.end) || strata[strata.length - 1];
    ctx.fillStyle = tier.colors[r % tier.colors.length];
    for (let c = 0; c < MAP_COLS; c++) {
      if (G.grid[r] && G.grid[r][c] !== C_EXCAVATED) {
        ctx.fillRect(c * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // 2. Embedded natural rounded pebbles in unexcavated earth
  PEBBLES.forEach(p => {
    const col = Math.floor(p.x / CELL_SIZE);
    const row = Math.floor(p.y / CELL_SIZE);
    if (row >= SURFACE_Y && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
      if (G.grid[row] && G.grid[row][col] !== C_EXCAVATED) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // 3. Pre-war Abandoned Coal Mine Drift (-38m, r = 38)
  if (G.day > 365 * 3) {
    const mineY = 38 * CELL_SIZE;
    ctx.fillStyle = '#181512';
    ctx.fillRect(30, mineY, (MAP_COLS - 3) * CELL_SIZE, CELL_SIZE * 1.6);

    ctx.strokeStyle = '#3e3933';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, mineY + CELL_SIZE * 1.4); ctx.lineTo((MAP_COLS - 3) * CELL_SIZE, mineY + CELL_SIZE * 1.4);
    ctx.stroke();

    ctx.fillStyle = '#4a3325';
    for (let tx = 40; tx < (MAP_COLS - 3) * CELL_SIZE; tx += 34) {
      ctx.fillRect(tx, mineY, 6, CELL_SIZE * 1.6);
      ctx.fillRect(tx - 6, mineY, 18, 5);
    }
  }

  // 4. Underground Aquifer River (-55m, r = 44)
  if (G.day > 365 * 3) {
    const riverY = 44 * CELL_SIZE;
    ctx.fillStyle = '#163242';
    ctx.fillRect(0, riverY, MAP_COLS * CELL_SIZE, CELL_SIZE * 2.5);

    ctx.strokeStyle = '#23526d';
    ctx.lineWidth = 2;
    const waveOff = (Date.now() * 0.05) % 40;
    for (let wx = -40 + waveOff; wx < MAP_COLS * CELL_SIZE; wx += 45) {
      ctx.beginPath();
      ctx.moveTo(wx, riverY + 14);
      ctx.quadraticCurveTo(wx + 22, riverY + 7, wx + 44, riverY + 14);
      ctx.stroke();
    }
  }

  // 5. Left Depth Ruler Marks (-10m, -20m, -30m... -120m)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '10px monospace';
  for (let depth = 10; depth <= 120; depth += 10) {
    const dy = (SURFACE_Y + Math.floor(depth / 2.8)) * CELL_SIZE;
    ctx.fillText(`-${depth} M`, 10, dy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath(); ctx.moveTo(52, dy); ctx.lineTo(66, dy); ctx.stroke();
  }
}

export function drawCentralConcreteShaft(ctx, G) {
  const hatchCol = Math.floor(MAP_COLS / 2);
  const x = hatchCol * CELL_SIZE;
  const startY = SURFACE_Y * CELL_SIZE;
  const endY = (MAP_ROWS - 6) * CELL_SIZE;
  const shaftW = CELL_SIZE * 2;

  // Concrete Structural Shaft Walls
  ctx.fillStyle = '#5c5851';
  ctx.fillRect(x - 4, startY, 4, endY - startY);
  ctx.fillRect(x + shaftW, startY, 4, endY - startY);

  // Dual Steel Elevator Guide Rails & Cable Channel
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, startY); ctx.lineTo(x + 10, endY);
  ctx.moveTo(x + shaftW - 10, startY); ctx.lineTo(x + shaftW - 10, endY);
  ctx.stroke();

  // Steel Ladder Rungs running all the way down
  ctx.strokeStyle = '#6e695f';
  ctx.lineWidth = 1.6;
  for (let ly = startY + 6; ly < endY; ly += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 20, ly);
    ctx.lineTo(x + shaftW - 20, ly);
    ctx.stroke();
  }

  // Yellow Industrial Safety Railing Catwalk Bridges across shaft on each floor
  const floors = [SURFACE_Y + 4, SURFACE_Y + 9, SURFACE_Y + 14, SURFACE_Y + 21, SURFACE_Y + 28, 43];
  floors.forEach(fr => {
    const fy = fr * CELL_SIZE + CELL_SIZE * 4 - 4;
    ctx.fillStyle = '#3a3834';
    ctx.fillRect(x, fy, shaftW, 5);

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, fy - 14); ctx.lineTo(x + shaftW, fy - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, fy - 7); ctx.lineTo(x + shaftW, fy - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 2, fy); ctx.lineTo(x + 2, fy - 14);
    ctx.moveTo(x + shaftW - 2, fy); ctx.lineTo(x + shaftW - 2, fy - 14);
    ctx.moveTo(x + shaftW / 2, fy); ctx.lineTo(x + shaftW / 2, fy - 14);
    ctx.stroke();
  });

  // Motorized Elevator Platform (Year 14+)
  if (G.elevator.unlocked) {
    const ey = G.elevator.y;
    ctx.fillStyle = '#1e2024';
    ctx.fillRect(x + 3, ey, shaftW - 6, 20);
    ctx.fillStyle = '#f1c40f';
    for (let hx = x + 6; hx < x + shaftW - 12; hx += 10) {
      ctx.fillRect(hx, ey + 4, 5, 12);
    }
    ctx.fillStyle = 'rgba(255, 236, 179, 0.4)';
    ctx.fillRect(x + 6, ey + 4, shaftW - 12, 12);
  }
}
