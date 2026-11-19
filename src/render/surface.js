import { CELL_SIZE, MAP_COLS, SURFACE_Y, PROLOGUE } from '../core/constants.js';
import { getStrataPattern } from './procedural_textures.js';
import { gameNow } from '../core/clock.js';

export { drawRunningSurvivor, drawSpeechBubble, drawZombiePile, drawWanderingZombies } from './surface_actors.js';

const OUT = '#1d1612';

export function drawSurfaceWorld(ctx, G) {
  const skyH = SURFACE_Y * CELL_SIZE;
  const hatchCol = Math.floor(MAP_COLS / 2);
  const hatchX = hatchCol * CELL_SIZE;
  const totalW = MAP_COLS * CELL_SIZE;
  const isNight = G.timeHour >= 21 || G.timeHour < 5;
  const lit = isNight; // windows glow at night
  const snowRoofs = [];
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  // Outlined flat-colour block, the building block of the original's look
  const box = (fill, x, y, w, h) => { R(OUT, x - 1, y - 1, w + 2, h + 2); R(fill, x, y, w, h); };
  const win = (x, y, w, h) => { R('#1b1714', x - 1, y - 1, w + 2, h + 2); R(lit ? '#f0c56a' : '#34383f', x, y, w, h); if (!lit) R('rgba(255,255,255,0.10)', x, y, w, 2); };

  // 1. Sky: hazy dusk, mauve above and peach at the horizon
  const skyGrad = ctx.createLinearGradient(0, -300, 0, skyH);
  if (G.isWinterSnow) {
    skyGrad.addColorStop(0, '#54585c');
    skyGrad.addColorStop(1, '#85878a');
  } else if (isNight) {
    skyGrad.addColorStop(0, '#0a0d14');
    skyGrad.addColorStop(1, '#1b2230');
  } else {
    skyGrad.addColorStop(0, '#6f6470');
    skyGrad.addColorStop(0.45, '#9a7f7c');
    skyGrad.addColorStop(0.8, '#c4977e');
    skyGrad.addColorStop(1, '#d6a888');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-600, -400, totalW + 1200, skyH + 400);

  // Sun by day, moon by night (hazy, behind the skyline)
  {
    const bodyX = hatchX - 330, bodyY = skyH - 215;
    const glow = ctx.createRadialGradient(bodyX, bodyY, 4, bodyX, bodyY, 90);
    glow.addColorStop(0, isNight ? 'rgba(200, 215, 240, 0.35)' : 'rgba(255, 224, 170, 0.5)');
    glow.addColorStop(1, 'rgba(255, 224, 170, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bodyX - 90, bodyY - 90, 180, 180);
    ctx.fillStyle = isNight ? '#dfe6f3' : '#f6dcae';
    ctx.beginPath(); ctx.arc(bodyX, bodyY, isNight ? 11 : 14, 0, Math.PI * 2); ctx.fill();
  }

  // 2. Two layers of hazy skyline behind the street (blue-grey, as in the original)
  {
    const far = G.isWinterSnow ? '#7c8188' : isNight ? '#161c28' : '#8a8095';
    const near = G.isWinterSnow ? '#6c7178' : isNight ? '#11161f' : '#756e86';
    for (let i = 0, bx = -620; bx < totalW + 620; i++, bx += 48 + (i * 29) % 36) {
      const bw = 44 + (i * 41) % 38, bh = 90 + (i * 53) % 110;
      R(far, bx, skyH - bh, bw, bh);
      R('rgba(255,255,255,0.06)', bx, skyH - bh, 4, bh);
    }
    for (let i = 0, bx = -600; bx < totalW + 600; i++, bx += 64 + (i * 37) % 46) {
      const bw = 52 + (i * 47) % 40, bh = 55 + (i * 31) % 80;
      R(near, bx, skyH - bh, bw, bh);
      R('rgba(0,0,0,0.18)', bx + bw - 8, skyH - bh, 8, bh);
      if (i % 3 === 0) R('rgba(0,0,0,0.25)', bx + 6, skyH - bh - 6, 6, 6); // rooftop unit
      ctx.fillStyle = lit ? 'rgba(240,197,106,0.35)' : 'rgba(30,28,40,0.30)';
      for (let wy = skyH - bh + 10; wy < skyH - 18; wy += 18) {
        for (let wx = bx + 7; wx < bx + bw - 12; wx += 14) ctx.fillRect(wx, wy, 6, 8);
      }
    }
  }

  // Smoke plume from the factory chimney, drifting right
  {
    const cx = hatchX - 640, time = gameNow() * 0.0006;
    for (let i = 0; i < 14; i++) {
      const a = Math.max(0.04, 0.26 - i * 0.017);
      ctx.fillStyle = isNight ? `rgba(20,24,32,${a})` : `rgba(78,66,70,${a})`;
      ctx.beginPath();
      ctx.arc(cx + i * 11 + Math.sin(time + i) * 5, skyH - 190 - i * 20, 9 + i * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Brick chimney + small house with a pitched roof (far left of the street)
  {
    const chX = hatchX - 650;
    box('#8e3d2c', chX, skyH - 190, 14, 190);
    R('#5a241a', chX - 2, skyH - 192, 18, 5);
    box('#8d6b55', chX + 26, skyH - 64, 62, 64);
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.moveTo(chX + 21, skyH - 64); ctx.lineTo(chX + 57, skyH - 96); ctx.lineTo(chX + 93, skyH - 64); ctx.fill();
    ctx.fillStyle = '#6a3a34';
    ctx.beginPath(); ctx.moveTo(chX + 25, skyH - 65); ctx.lineTo(chX + 57, skyH - 93); ctx.lineTo(chX + 89, skyH - 65); ctx.fill();
    win(chX + 38, skyH - 48, 14, 16); win(chX + 62, skyH - 48, 14, 16);
    R('#2b1f19', chX + 50, skyH - 26, 12, 26);
  }

  // 4. High-voltage pylon with a lattice, leaning over the street
  const pylonX = hatchX - 770;
  ctx.strokeStyle = isNight ? '#0f1217' : '#3a3338';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pylonX, skyH); ctx.lineTo(pylonX + 36, skyH - 290);
  ctx.moveTo(pylonX + 96, skyH); ctx.lineTo(pylonX + 60, skyH - 290);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k < 7; k++) {
    const f0 = k / 7, f1 = (k + 1) / 7;
    const lx0 = pylonX + 36 * f0, rx0 = pylonX + 96 - 36 * f0;
    const lx1 = pylonX + 36 * f1, rx1 = pylonX + 96 - 36 * f1;
    const y0 = skyH - 290 * f0, y1 = skyH - 290 * f1;
    ctx.moveTo(lx0, y0); ctx.lineTo(rx1, y1);
    ctx.moveTo(rx0, y0); ctx.lineTo(lx1, y1);
    ctx.moveTo(lx1, y1); ctx.lineTo(rx1, y1);
  }
  ctx.moveTo(pylonX + 6, skyH - 250); ctx.lineTo(pylonX - 34, skyH - 250);
  ctx.moveTo(pylonX + 90, skyH - 250); ctx.lineTo(pylonX + 130, skyH - 250);
  ctx.stroke();

  // 5. Utility poles and sagging wires across the whole street
  const poleXs = [hatchX - 600, hatchX - 438, hatchX - 322, hatchX - 205, hatchX - 90, hatchX + 160, hatchX + 340];
  poleXs.forEach(px => {
    R('#2f261e', px - 2, skyH - 128, 5, 128);
    R('#2f261e', px - 16, skyH - 120, 33, 4);
    R('#3d3228', px - 13, skyH - 108, 27, 3);
  });
  ctx.strokeStyle = '#1a1517';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < poleXs.length - 1; i++) {
    const x1 = poleXs[i], x2 = poleXs[i + 1];
    for (const dy of [-120, -108]) {
      ctx.beginPath();
      ctx.moveTo(x1 + 12, skyH + dy);
      ctx.quadraticCurveTo((x1 + x2) / 2, skyH + dy + 16, x2 - 12, skyH + dy);
      ctx.stroke();
    }
  }
  // Wires leading off toward the pylon
  ctx.beginPath();
  ctx.moveTo(pylonX + 130, skyH - 250);
  ctx.quadraticCurveTo(hatchX - 700, skyH - 215, poleXs[0], skyH - 120);
  ctx.stroke();

  // Birds in the haze
  if (!isNight) {
    ctx.strokeStyle = '#3a3036';
    ctx.lineWidth = 1.5;
    const bt = gameNow() * 0.02;
    for (let i = 0; i < 4; i++) {
      const bx = hatchX - 520 + i * 160 + (bt * 0.1 + i * 60) % 90, by = skyH - 235 - (i % 2) * 28 + Math.sin(bt * 0.05 + i) * 4;
      const flap = Math.sin(bt * 0.4 + i) * 2;
      ctx.beginPath(); ctx.moveTo(bx - 4, by + flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 4, by + flap); ctx.stroke();
    }
  }

  // 6. Gas station: white canopy with a red stripe, tall GAS price sign, delivery van
  const gasX = hatchX - 560;
  {
    R('#4d4a4a', gasX - 22, skyH - 118, 4, 118);           // sign pole
    box('#f2eee4', gasX - 38, skyH - 138, 34, 28);
    R('#c4392b', gasX - 38, skyH - 138, 34, 6);
    ctx.fillStyle = '#1d1612'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('АЗС', gasX - 31, skyH - 119);
    ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#b32d20'; ctx.fillText('59,9', gasX - 33, skyH - 111);
    box('#f2eee4', gasX, skyH - 66, 120, 8);                // canopy slab
    R('#c4392b', gasX, skyH - 62, 120, 4);
    R('#8d8a82', gasX + 12, skyH - 58, 6, 58);
    R('#8d8a82', gasX + 100, skyH - 58, 6, 58);
    snowRoofs.push([gasX, skyH - 67, 120]);
    // Delivery van
    box('#3d6a96', gasX + 26, skyH - 38, 56, 28);
    box('#4a7aa6', gasX + 68, skyH - 30, 22, 20);
    R('#9ec3dc', gasX + 74, skyH - 27, 11, 9);
    R('#1d1612', gasX + 36, skyH - 9, 10, 10); R('#1d1612', gasX + 72, skyH - 9, 10, 10);
    R('#6b6e72', gasX + 39, skyH - 6, 4, 4); R('#6b6e72', gasX + 75, skyH - 6, 4, 4);
  }

  // 7. Small white gatehouse "4 INSIDE" with a red roof
  const shackX = hatchX - 430;
  {
    box('#f2eee4', shackX, skyH - 56, 62, 56);
    R('#c4392b', shackX - 4, skyH - 62, 70, 8);
    R('#8d241a', shackX - 4, skyH - 55, 70, 2);
    win(shackX + 8, skyH - 44, 20, 20);
    R('#2b1f19', shackX + 38, skyH - 40, 16, 40);
    ctx.fillStyle = '#c4392b'; ctx.font = 'bold 8px monospace'; ctx.fillText('4 ВНУТРИ', shackX + 6, skyH - 12);
    snowRoofs.push([shackX - 4, skyH - 63, 70]);
  }

  // 8. Pharmacy: green walls, white sign, green cross, awning; burning sedan in front
  const pharmX = hatchX - 335;
  {
    box('#8eaa8b', pharmX, skyH - 98, 118, 98);
    R('#5d7d5b', pharmX, skyH - 98, 118, 7);
    box('#f4f1e8', pharmX + 12, skyH - 88, 70, 18);
    ctx.fillStyle = '#4e6d4d'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('АПТЕКА', pharmX + 17, skyH - 75);
    R('#35a35e', pharmX + 92, skyH - 86, 14, 5); R('#35a35e', pharmX + 96.5, skyH - 90.5, 5, 14);
    win(pharmX + 8, skyH - 60, 46, 34); win(pharmX + 62, skyH - 60, 46, 34);
    R('#3f7f5a', pharmX + 4, skyH - 40, 108, 6);          // awning
    ctx.fillStyle = '#e8e4d6';
    for (let ax = pharmX + 4; ax < pharmX + 112; ax += 12) ctx.fillRect(ax, skyH - 40, 6, 6);
    snowRoofs.push([pharmX, skyH - 99, 118]);
    // Burning sedan
    const carX = pharmX + 30;
    box('#7a2c34', carX, skyH - 20, 52, 15);
    box('#7a2c34', carX + 10, skyH - 31, 30, 12);
    R('#c9d4dc', carX + 13, skyH - 28, 10, 7); R('#c9d4dc', carX + 26, skyH - 28, 10, 7);
    R('#1d1612', carX + 8, skyH - 8, 10, 8); R('#1d1612', carX + 36, skyH - 8, 10, 8);
    if (!G.paused && Math.random() < 0.6) {
      G.particles.push({
        x: carX + 14 + Math.random() * 20, y: skyH - 32,
        vx: (Math.random() - 0.5) * 0.8, vy: -1.2 - Math.random() * 1.5,
        life: 30, color: Math.random() < 0.5 ? '#f39c12' : '#e74c3c'
      });
    }
  }

  // 9. Food Mart: beige walls, red/white awning, yellow EVAC placards, police car
  const foodX = hatchX - 212;
  {
    box('#d3c3a2', foodX, skyH - 82, 112, 82);
    box('#f4f1e8', foodX + 14, skyH - 76, 84, 14);
    ctx.fillStyle = '#3a2f26'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('ПРОДУКТЫ', foodX + 24, skyH - 65);
    win(foodX + 8, skyH - 44, 96, 36);
    R('#c4392b', foodX - 3, skyH - 50, 118, 9);           // awning
    ctx.fillStyle = '#f4f1e8';
    for (let ax = foodX - 3; ax < foodX + 115; ax += 14) ctx.fillRect(ax, skyH - 50, 7, 9);
    snowRoofs.push([foodX, skyH - 83, 112]);
    // Yellow EVAC placards
    R('#e3b922', foodX + 62, skyH - 34, 20, 11); R('#1d1612', foodX + 65, skyH - 30, 14, 2);
    R('#e3b922', foodX + 90, skyH - 30, 20, 11); R('#1d1612', foodX + 93, skyH - 26, 14, 2);
    // Police car
    box('#2a2f45', foodX + 10, skyH - 18, 50, 14);
    box('#2a2f45', foodX + 20, skyH - 28, 28, 11);
    R('#ffffff', foodX + 10, skyH - 12, 50, 4);
    R('#c9d4dc', foodX + 23, skyH - 25, 10, 6); R('#c9d4dc', foodX + 36, skyH - 25, 10, 6);
    R('#e5493a', foodX + 28, skyH - 31, 6, 3); R('#3a7bd5', foodX + 36, skyH - 31, 6, 3);
    R('#1d1612', foodX + 16, skyH - 8, 9, 8); R('#1d1612', foodX + 44, skyH - 8, 9, 8);
  }

  // 10. Red-brick apartment building with arched windows, right next to the shaft
  const brickX = hatchX - 20;
  {
    const bx = brickX - 82, bw = 82, bh = 128;
    box('#9a4a36', bx, skyH - bh, bw, bh);
    ctx.fillStyle = 'rgba(60,20,12,0.28)';
    for (let by = skyH - bh + 6; by < skyH; by += 8) ctx.fillRect(bx, by, bw, 1);
    R('#d9cdb4', bx - 3, skyH - bh - 4, bw + 6, 6);           // cornice
    R('#5f2a1e', bx - 3, skyH - bh + 2, bw + 6, 2);
    for (let wy = skyH - bh + 16; wy < skyH - 44; wy += 36) {
      for (const wx of [bx + 12, bx + 48]) {
        R(OUT, wx - 1, wy - 1, 20, 28);
        win(wx, wy, 18, 26);
        R('#d9cdb4', wx - 2, wy - 3, 22, 2);
      }
    }
    R('#2d5a36', bx + 10, skyH - 34, 62, 14);                 // green awning over the entrance
    R('#2b1f19', bx + 28, skyH - 22, 26, 22);
    ctx.fillStyle = '#e8e4d6'; ctx.font = 'bold 6px monospace'; ctx.fillText('ЗАРАЖЕНО', bx + 16, skyH - 24);
    // Flag on the roof
    R('#2f261e', bx + bw - 14, skyH - bh - 30, 2, 28);
    R('#7a2c34', bx + bw - 12, skyH - bh - 30, 12, 7);
    snowRoofs.push([bx - 3, skyH - bh - 5, bw + 6]);
  }

  // 11. Dead tree between the shops, bare and twisted
  {
    const dx = hatchX - 640 + 120;
    ctx.strokeStyle = '#3a2f2a'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dx, skyH); ctx.lineTo(dx + 2, skyH - 60); ctx.lineTo(dx - 8, skyH - 92);
    ctx.moveTo(dx + 2, skyH - 60); ctx.lineTo(dx + 16, skyH - 88);
    ctx.moveTo(dx - 4, skyH - 78); ctx.lineTo(dx - 20, skyH - 82);
    ctx.stroke();
  }

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

  // 10. The hatch over the shaft: concrete kerb, dark opening and a hinged steel lid
  {
    const hx = hatchX - 2, hw = 68;
    // closed = 1: always in the game, animated during the prologue
    const pt = G.prologue.t;
    const clamp01 = v => Math.min(1, Math.max(0, v));
    let closed = 1;
    if (G.state !== 'game') {
      if (pt < PROLOGUE.closeStart) closed = 1 - clamp01((pt - PROLOGUE.openStart) / (PROLOGUE.openEnd - PROLOGUE.openStart));
      else closed = clamp01((pt - PROLOGUE.closeStart) / (PROLOGUE.closeEnd - PROLOGUE.closeStart));
    }
    R(OUT, hx - 8, skyH - 7, hw + 16, 22);
    R('#949089', hx - 7, skyH - 6, hw + 14, 20);
    R('#6e6a64', hx - 7, skyH - 6, hw + 14, 3);
    if (closed < 1) R('#0b0a0a', hx, skyH - 1, hw, 14);             // open shaft mouth
    // Steel lid, hinged on the left edge; swings up to ~110 degrees when open
    ctx.save();
    ctx.translate(hx, skyH - 6);
    ctx.rotate(-(1 - closed) * 1.95);
    R(OUT, -1, -6, hw + 2, 8);
    R('#5b5f66', 0, -5, hw, 6);
    R('#7d828a', 0, -5, hw, 2);
    for (let rx = 6; rx < hw; rx += 12) R('#33363b', rx, -3, 2, 2);
    R('#c4392b', hw / 2 - 6, -4, 12, 3);                            // handle
    ctx.restore();
  }

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

  // Wooden signpost: [ ◀ SHELTER ] and [ NO ENTRY ]
  ctx.fillStyle = '#fff';
  ctx.fillRect(hatchX + 82, skyH - 42, 44, 14);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(hatchX + 82, skyH - 42, 44, 14);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 7.5px sans-serif';
  ctx.fillText('◀ УБЕЖИЩЕ', hatchX + 85, skyH - 32);

  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(hatchX + 90, skyH - 26, 42, 12);
  ctx.strokeRect(hatchX + 90, skyH - 26, 42, 12);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 7px sans-serif';
  ctx.fillText('НЕТ ВХОДА', hatchX + 92, skyH - 17);

  // 11. Red Pickup Truck, or the spoil hill that grows as the colony digs deeper
  let treeX = hatchX + 180;
  {
    // 0..1 over the 30 years; the hill starts small and ends up covering part of the town
    const growth = Math.min(1, Math.max(0, G.day / (365 * 30)));
    const hillW = 230 + growth * 370;
    const hillH = 110 + growth * 170;
    const hx0 = hatchX + (G.hasDirtMound ? 150 : 200);
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
      if (Math.floor(gameNow() / 600) % 2 === 0) { ctx.beginPath(); ctx.arc(peakX, peakY - 72, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
    treeX = Math.min(hx1 + 50, MAP_COLS * CELL_SIZE - 50);
  }
  if (!G.hasDirtMound) {
    const truckX = hatchX + 150;
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
    snowRoofs.forEach(([rx, ry, rw]) => ctx.fillRect(rx, ry - 3, rw, 4));
  }
}
