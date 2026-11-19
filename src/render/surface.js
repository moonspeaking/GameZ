import { CELL_SIZE, MAP_COLS, SURFACE_Y } from '../core/constants.js';
import { getStrataPattern } from './procedural_textures.js';

export function drawRunningSurvivor(ctx, x, y, color, name, isRunning) {
  if (!isRunning) return;
  const legOffset = Math.sin(Date.now() * 0.02) * 5;

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 8); ctx.lineTo(x - 4 + legOffset, y);
  ctx.moveTo(x + 2, y - 8); ctx.lineTo(x + 4 - legOffset, y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y - 20, 8, 12);

  ctx.fillStyle = '#ffdbac';
  ctx.beginPath(); ctx.arc(x, y - 24, 4.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText(name, x - 10, y - 30);
}

export function drawSpeechBubble(ctx, x, y, text) {
  ctx.font = 'bold 11px sans-serif';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x - tw / 2 - 8, y - 16, tw + 16, 20, 4);
  } else {
    ctx.rect(x - tw / 2 - 8, y - 16, tw + 16, 20);
  }
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 4, y + 4); ctx.lineTo(x, y + 10); ctx.lineTo(x + 4, y + 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.fillText(text, x - tw / 2, y - 2);
}

export function drawZombiePile(ctx, leadX, skyH, isPiledOnHatch) {
  const count = isPiledOnHatch ? 36 : 26;
  const t = Date.now() * 0.005;

  for (let i = 0; i < count; i++) {
    let zx, zy;
    if (isPiledOnHatch) {
      const layer = Math.floor(i / 6);
      const inLayer = i % 6;
      zx = leadX + 8 + (inLayer - 2.5) * 11 + Math.sin(t + i) * 2;
      zy = skyH - 6 - layer * 9;
    } else {
      zx = leadX - (i * 9) + Math.sin(t + i * 2) * 4;
      zy = skyH - 2 - (i % 3) * 3;
    }

    // Shadow under zombie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(zx, zy, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ragged infected clothing
    const clothColors = ['#2c322b', '#383028', '#242a30', '#1f241e'];
    ctx.fillStyle = clothColors[i % clothColors.length];
    ctx.fillRect(zx - 4.5, zy - 18, 9, 13);

    // Gaunt decaying neck & head
    ctx.fillStyle = (i % 2 === 0) ? '#4a5745' : '#3d4839';
    ctx.beginPath(); ctx.arc(zx, zy - 22, 4.5, 0, Math.PI * 2); ctx.fill();

    // Glowing infected eyes (piercing red/amber in dark)
    ctx.fillStyle = (i % 3 === 0) ? '#e74c3c' : '#f39c12';
    ctx.fillRect(zx + 1, zy - 23, 1.5, 1.5);
    ctx.fillRect(zx + 3.5, zy - 23, 1.5, 1.5);

    // Clawing claw-arms reaching towards the hatch
    ctx.strokeStyle = '#2f382b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const armReach = isPiledOnHatch ? Math.sin(t * 2 + i) * 10 : 12;
    ctx.moveTo(zx - 2, zy - 14);
    ctx.lineTo(zx + armReach, zy - 16 + Math.cos(t * 3 + i) * 4);
    ctx.stroke();

    // Bony claw tip
    ctx.fillStyle = '#222';
    ctx.fillRect(zx + armReach - 1, zy - 17 + Math.cos(t * 3 + i) * 4, 2, 2);
  }

  // Blood smears around the hatch rim when piled
  if (isPiledOnHatch) {
    ctx.fillStyle = 'rgba(120, 20, 20, 0.75)';
    ctx.fillRect(leadX - 8, skyH - 8, 32, 3);
    ctx.beginPath();
    ctx.arc(leadX + 6, skyH - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSurfaceWorld(ctx, G) {
  const skyH = SURFACE_Y * CELL_SIZE;
  const hatchCol = Math.floor(MAP_COLS / 2);
  const hatchX = hatchCol * CELL_SIZE;

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, -300, 0, skyH);
  if (G.isWinterSnow) {
    skyGrad.addColorStop(0, '#54585c');
    skyGrad.addColorStop(1, '#85878a');
  } else if (G.timeHour >= 21 || G.timeHour < 5) {
    skyGrad.addColorStop(0, '#0a0d14');
    skyGrad.addColorStop(1, '#1b2230');
  } else {
    skyGrad.addColorStop(0, '#615f66');
    skyGrad.addColorStop(0.6, '#827f87');
    skyGrad.addColorStop(1, '#a8a29e');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-600, -400, MAP_COLS * CELL_SIZE + 1200, skyH + 400);

  // Background city silhouettes
  ctx.fillStyle = G.isWinterSnow ? 'rgba(70, 75, 82, 0.5)' : 'rgba(40, 42, 48, 0.45)';
  for (let bx = -400; bx < MAP_COLS * CELL_SIZE + 400; bx += 85) {
    const bh = 110 + Math.sin(bx * 0.05) * 45;
    ctx.fillRect(bx, skyH - bh, 70, bh);
  }

  // Distant filler buildings so the wider map still reads as a town (the detailed block sits around the hatch)
  {
    const palette = ['#7c6a5a', '#6a6f78', '#8a7260', '#5f6670', '#85796a'];
    const edgeL = hatchX - 520, edgeR = hatchX + 700;
    for (let i = 0, bx = -560; bx < MAP_COLS * CELL_SIZE + 560; i++, bx += 70 + (i * 37) % 50) {
      if (bx > edgeL && bx < edgeR) continue;
      const bw = 60 + (i * 53) % 40;
      const bh = 70 + (i * 29) % 90;
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(bx, skyH - bh, bw, bh);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(bx + bw - 10, skyH - bh, 10, bh);
      ctx.fillStyle = '#25272c';
      for (let wy = skyH - bh + 10; wy < skyH - 18; wy += 24) {
        for (let wx = bx + 8; wx < bx + bw - 18; wx += 20) ctx.fillRect(wx, wy, 9, 13);
      }
    }
  }

  // Sun by day, moon by night (behind the buildings)
  {
    const isNight = G.timeHour >= 21 || G.timeHour < 5;
    const bodyX = hatchX - 330, bodyY = skyH - 195;
    const glow = ctx.createRadialGradient(bodyX, bodyY, 4, bodyX, bodyY, 70);
    glow.addColorStop(0, isNight ? 'rgba(200, 215, 240, 0.35)' : 'rgba(255, 238, 180, 0.55)');
    glow.addColorStop(1, 'rgba(255, 238, 180, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bodyX - 70, bodyY - 70, 140, 140);
    ctx.fillStyle = isNight ? '#dfe6f3' : '#fff3c4';
    ctx.beginPath(); ctx.arc(bodyX, bodyY, isNight ? 11 : 14, 0, Math.PI * 2); ctx.fill();
  }

  // 2. High Voltage Electrical Transmission Pylon Tower
  const pylonX = hatchX - 520;
  ctx.strokeStyle = '#2b2e34';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pylonX, skyH); ctx.lineTo(pylonX + 35, skyH - 240);
  ctx.moveTo(pylonX + 90, skyH); ctx.lineTo(pylonX + 55, skyH - 240);
  ctx.moveTo(pylonX + 20, skyH - 180); ctx.lineTo(pylonX + 70, skyH - 180);
  ctx.moveTo(pylonX + 10, skyH - 120); ctx.lineTo(pylonX + 80, skyH - 120);
  ctx.moveTo(pylonX - 5, skyH - 60); ctx.lineTo(pylonX + 95, skyH - 60);
  for (let py = skyH; py > skyH - 240; py -= 40) {
    ctx.moveTo(pylonX + 10, py); ctx.lineTo(pylonX + 80, py - 40);
    ctx.moveTo(pylonX + 80, py); ctx.lineTo(pylonX + 10, py - 40);
  }
  ctx.stroke();

  // 3. Wooden Utility Telephone Poles & Sagging Wires
  const poleXs = [hatchX - 380, hatchX - 210, hatchX - 40, hatchX + 160, hatchX + 340];
  ctx.strokeStyle = '#382f25';
  ctx.lineWidth = 4;
  poleXs.forEach(px => {
    ctx.beginPath();
    ctx.moveTo(px, skyH); ctx.lineTo(px, skyH - 110);
    ctx.moveTo(px - 14, skyH - 100); ctx.lineTo(px + 14, skyH - 100);
    ctx.stroke();
  });

  ctx.strokeStyle = '#1a191a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < poleXs.length - 1; i++) {
    const x1 = poleXs[i], x2 = poleXs[i + 1];
    ctx.beginPath();
    ctx.moveTo(x1, skyH - 100);
    ctx.quadraticCurveTo((x1 + x2) / 2, skyH - 85, x2, skyH - 100);
    ctx.stroke();
  }

  // 4. Gas Station
  const gasX = hatchX - 420;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(gasX - 35, skyH - 115, 36, 26);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2;
  ctx.strokeRect(gasX - 35, skyH - 115, 36, 26);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('GAS', gasX - 28, skyH - 103);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('$9.99', gasX - 31, skyH - 93);

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(gasX - 17, skyH - 89); ctx.lineTo(gasX - 17, skyH); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gasX, skyH - 68, 110, 10);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(gasX, skyH - 72, 110, 4);
  ctx.fillStyle = '#666';
  ctx.fillRect(gasX + 15, skyH - 58, 6, 58);
  ctx.fillRect(gasX + 85, skyH - 58, 6, 58);

  // Blue Cargo Delivery Van
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(gasX + 30, skyH - 34, 50, 24);
  ctx.fillRect(gasX + 65, skyH - 26, 20, 16);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(gasX + 42, skyH - 4, 6, 0, Math.PI * 2);
  ctx.arc(gasX + 74, skyH - 4, 6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Small White Gatehouse Shack [ 4 INSIDE ]
  const shackX = hatchX - 290;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(shackX, skyH - 56, 54, 56);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(shackX, skyH - 56, 54, 56);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(shackX, skyH - 60, 54, 4);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('4 INSIDE', shackX + 6, skyH - 12);
  ctx.fillStyle = '#222b30';
  ctx.fillRect(shackX + 8, skyH - 46, 20, 18);

  // 6. Pharmacy Building with Green Cross & Burning Car
  const pharmX = hatchX - 220;
  ctx.fillStyle = '#7a8c79';
  ctx.fillRect(pharmX, skyH - 85, 95, 85);
  ctx.strokeStyle = '#384237';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pharmX, skyH - 85, 95, 85);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('PHARMACY', pharmX + 12, skyH - 66);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(pharmX + 74, skyH - 74, 12, 4);
  ctx.fillRect(pharmX + 78, skyH - 78, 4, 12);

  // Burning Red Sedan
  const carX = pharmX + 24;
  ctx.fillStyle = '#8b2b2b';
  ctx.fillRect(carX, skyH - 22, 46, 16);
  ctx.fillRect(carX + 8, skyH - 32, 28, 12);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(carX + 12, skyH - 4, 5, 0, Math.PI * 2);
  ctx.arc(carX + 36, skyH - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Fire particles & smoke
  if (Math.random() < 0.6) {
    G.particles.push({
      x: carX + 16 + Math.random() * 18,
      y: skyH - 28,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.2 - Math.random() * 1.5,
      life: 30,
      color: Math.random() < 0.5 ? '#f39c12' : '#e74c3c'
    });
  }

  // 7. FOOD MART with Red/White Awning & Police Car
  const foodX = hatchX - 110;
  ctx.fillStyle = '#cfc5b4';
  ctx.fillRect(foodX, skyH - 75, 90, 75);
  ctx.strokeStyle = '#383228';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(foodX, skyH - 75, 90, 75);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('FOOD MART', foodX + 16, skyH - 58);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(foodX, skyH - 50, 90, 8);
  ctx.fillStyle = '#fff';
  for (let ax = foodX; ax < foodX + 90; ax += 12) {
    ctx.fillRect(ax, skyH - 50, 6, 8);
  }
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(foodX + 5, skyH - 16, 24, 10);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 7px sans-serif';
  ctx.fillText('EVAC', foodX + 7, skyH - 8);

  // 8. 2-Story Red Brick Apartment Building
  const brickX = hatchX - 10;
  ctx.fillStyle = '#873c2c';
  ctx.fillRect(brickX - 90, skyH - 115, 80, 115);
  ctx.strokeStyle = '#3d1b13';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(brickX - 90, skyH - 115, 80, 115);
  ctx.fillStyle = '#1c1c1f';
  for (let wy = skyH - 95; wy < skyH - 20; wy += 36) {
    ctx.fillRect(brickX - 75, wy, 16, 22);
    ctx.fillRect(brickX - 45, wy, 16, 22);
  }
  ctx.fillStyle = '#2d5a36';
  ctx.fillRect(brickX - 85, skyH - 22, 38, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 6.5px monospace';
  ctx.fillText('INFECTED', brickX - 82, skyH - 10);

  // 9. Concrete Road Deck
  ctx.fillStyle = '#59554f';
  ctx.fillRect(-600, skyH, MAP_COLS * CELL_SIZE + 1200, 14);
  ctx.strokeStyle = '#2d2b27';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-600, skyH, MAP_COLS * CELL_SIZE + 1200, 14);
  ctx.fillStyle = '#d4ac0d';
  for (let rx = -500; rx < MAP_COLS * CELL_SIZE + 500; rx += 40) {
    ctx.fillRect(rx, skyH + 5, 20, 2);
  }

  // Foundation concrete bridge pilings
  for (let px = hatchX - 450; px < hatchX + 450; px += 90) {
    if (px >= hatchX - 40 && px <= hatchX + 40) continue;
    ctx.fillStyle = '#787369';
    ctx.fillRect(px, skyH + 14, 18, 22);
  }

  // 10. The Hatch Collar & Fortifications
  ctx.fillStyle = '#949089';
  ctx.fillRect(hatchX - 14, skyH - 6, 44, 20);
  ctx.strokeStyle = '#383633';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hatchX - 14, skyH - 6, 44, 20);

  // Stacked Sandbags Protection around the perimeter
  const sandCols = ['#756652', '#867661', '#6b5d4b'];
  for (let sby = skyH - 4; sby >= skyH - 16; sby -= 5) {
    const offset = (sby % 2 === 0) ? 0 : 4;
    for (let sbx = hatchX - 38 + offset; sbx < hatchX - 16; sbx += 9) {
      ctx.fillStyle = sandCols[(sbx + sby) % sandCols.length];
      ctx.fillRect(sbx, sby, 8.5, 4.5);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(sbx, sby, 8.5, 4.5);
    }
  }

  // Concertina Razor Wire coiled on pickets
  ctx.strokeStyle = '#5a626d';
  ctx.lineWidth = 1.2;
  for (let cx = hatchX - 42; cx < hatchX - 16; cx += 5) {
    ctx.beginPath();
    ctx.arc(cx, skyH - 18, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hatch cover
  if (G.state === 'game' || G.prologue.t > 8500) {
    ctx.fillStyle = '#4a4845';
    ctx.beginPath();
    ctx.arc(hatchX + 8, skyH - 6, 12, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hatchX + 8, skyH - 10, 4, 0, Math.PI * 2); ctx.stroke();
  }

  // Wooden signpost: [ ◀ SHELTER ] and [ NO ENTRY ]
  ctx.fillStyle = '#fff';
  ctx.fillRect(hatchX + 38, skyH - 42, 44, 14);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(hatchX + 38, skyH - 42, 44, 14);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 7.5px sans-serif';
  ctx.fillText('◀ SHELTER', hatchX + 41, skyH - 32);

  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(hatchX + 46, skyH - 26, 42, 12);
  ctx.strokeRect(hatchX + 46, skyH - 26, 42, 12);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 7px sans-serif';
  ctx.fillText('NO ENTRY', hatchX + 48, skyH - 17);

  // 11. Red Pickup Truck, or the spoil hill that grows as the colony digs deeper
  let treeX = hatchX + 180;
  if (G.hasDirtMound) {
    // 0..1 over the 30 years; the hill starts small and ends up covering part of the town
    const growth = Math.min(1, Math.max(0, G.day / (365 * 30)));
    const hillW = 170 + growth * 430;
    const hillH = 80 + growth * 200;
    const hx0 = hatchX + 36;
    const hx1 = hx0 + hillW;
    const peakX = hx0 + hillW * 0.42;
    const peakY = skyH - hillH;

    const hillPath = () => {
      ctx.beginPath();
      ctx.moveTo(hx0 - 20, skyH + 2);
      ctx.bezierCurveTo(hx0 + hillW * 0.12, skyH - hillH * 0.15, peakX - hillW * 0.18, peakY + hillH * 0.02, peakX, peakY);
      ctx.bezierCurveTo(peakX + hillW * 0.2, peakY + hillH * 0.02, hx1 - hillW * 0.14, skyH - hillH * 0.2, hx1 + 20, skyH + 2);
      ctx.closePath();
    };

    // Soil texture (same earth as underground topsoil)
    hillPath();
    ctx.fillStyle = getStrataPattern(ctx, 0) || '#6e4c2c';
    ctx.fill();
    // Light from the upper left, shade on the right flank
    const shade = ctx.createLinearGradient(hx0, peakY, hx1, skyH);
    shade.addColorStop(0, 'rgba(255, 225, 170, 0.22)');
    shade.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, 'rgba(20, 10, 4, 0.35)');
    hillPath();
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 16, 6, 0.8)';
    ctx.lineWidth = 2;
    hillPath();
    ctx.stroke();

    // Sparse grass tufts along the crest
    ctx.fillStyle = G.isWinterSnow ? '#e9edf0' : '#6b7d3a';
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const gx = hx0 + t * hillW;
      const u = (gx - hx0) / hillW;
      const gy = skyH - hillH * Math.sin(Math.min(1, u / 0.84 + 0.02) * Math.PI) * 0.97;
      if (gy < skyH - 6) ctx.fillRect(gx - 3, gy + 1, 6 + (i % 3) * 2, 3);
    }

    // Vent stack / antenna on the crest once the city is old
    if (G.day > 365 * 10) {
      ctx.strokeStyle = '#8a8f96';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(peakX, peakY + 4); ctx.lineTo(peakX, peakY - 70);
      ctx.moveTo(peakX - 12, peakY - 52); ctx.lineTo(peakX + 12, peakY - 52);
      ctx.moveTo(peakX - 8, peakY - 36); ctx.lineTo(peakX + 8, peakY - 36);
      ctx.stroke();
      ctx.fillStyle = '#e74c3c';
      if (Math.floor(Date.now() / 600) % 2 === 0) { ctx.beginPath(); ctx.arc(peakX, peakY - 72, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
    treeX = Math.min(hx1 + 50, MAP_COLS * CELL_SIZE - 50);
  } else {
    const truckX = hatchX + 95;
    ctx.fillStyle = '#9e3223';
    ctx.fillRect(truckX, skyH - 32, 65, 26);
    ctx.fillRect(truckX + 38, skyH - 44, 26, 16);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(truckX + 16, skyH - 4, 7, 0, Math.PI * 2);
    ctx.arc(truckX + 52, skyH - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4c79b';
    for (let sby = skyH - 38; sby >= skyH - 48; sby -= 5) {
      for (let sbx = truckX + 4; sbx < truckX + 34; sbx += 10) {
        ctx.fillRect(sbx, sby, 9, 4);
      }
    }
  }

  // Birch Tree with autumn leaves and deep roots
  ctx.fillStyle = '#e5dfd3';
  ctx.fillRect(treeX - 4, skyH - 110, 8, 110);
  ctx.fillStyle = G.isWinterSnow ? '#556b2f' : '#d35400';
  ctx.beginPath();
  ctx.arc(treeX, skyH - 120, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#422817';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(treeX, skyH + 14);
  ctx.quadraticCurveTo(treeX - 25, skyH + 60, treeX - 45, skyH + 120);
  ctx.moveTo(treeX, skyH + 14);
  ctx.quadraticCurveTo(treeX + 30, skyH + 70, treeX + 50, skyH + 130);
  ctx.stroke();

  // Horizontal Sewer Pipe
  const pipeY = skyH + 52;
  ctx.fillStyle = '#26292b';
  ctx.fillRect(-600, pipeY, MAP_COLS * CELL_SIZE + 1200, 10);
  ctx.strokeStyle = '#151617';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-600, pipeY, MAP_COLS * CELL_SIZE + 1200, 10);

  // Winter Snow Layer on Surface
  if (G.isWinterSnow) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-600, skyH - 3, MAP_COLS * CELL_SIZE + 1200, 4);
    ctx.fillRect(gasX, skyH - 74, 110, 4);
    ctx.fillRect(foodX, skyH - 77, 90, 4);
    ctx.fillRect(brickX - 90, skyH - 117, 80, 4);
  }
}
