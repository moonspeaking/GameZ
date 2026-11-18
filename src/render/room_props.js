import { CELL_SIZE } from '../core/constants.js';

function renderBunkerProps(ctx, r, rx, ry, rw, rh) {
  // Two-tier Bunk Beds on Left
  const bedX = rx + 12;
  const bedY = ry + rh - 48;
  ctx.fillStyle = '#44484d';
  ctx.fillRect(bedX, bedY, 4, 48);
  ctx.fillRect(bedX + 46, bedY, 4, 48);
  ctx.fillRect(bedX, bedY + 14, 50, 4);
  ctx.fillRect(bedX, bedY + 38, 50, 4);
  ctx.fillStyle = '#e67e22'; // orange blanket top
  ctx.fillRect(bedX + 4, bedY + 10, 42, 4);
  ctx.fillStyle = '#3498db'; // blue blanket bottom
  ctx.fillRect(bedX + 4, bedY + 34, 42, 4);
  ctx.fillStyle = '#ffffff'; // pillows
  ctx.fillRect(bedX + 6, bedY + 8, 8, 5);
  ctx.fillRect(bedX + 6, bedY + 32, 8, 5);

  // Yellow plastic bucket on floor
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(bedX + 54, ry + rh - 13, 10, 13);
  ctx.strokeStyle = '#b7950b';
  ctx.lineWidth = 1;
  ctx.strokeRect(bedX + 54, ry + rh - 13, 10, 13);

  // Framed Whiteboard / Map on wall
  const wbX = rx + rw / 2 - 20;
  const wbY = ry + 16;
  ctx.fillStyle = '#fdfefe';
  ctx.fillRect(wbX, wbY, 40, 20);
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(wbX, wbY, 40, 20);
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wbX + 5, wbY + 6); ctx.lineTo(wbX + 35, wbY + 6);
  ctx.moveTo(wbX + 5, wbY + 11); ctx.lineTo(wbX + 28, wbY + 11);
  ctx.stroke();

  // Heavy Steel Supply Shelves on Right
  const shX = rx + rw - 70;
  const shY = ry + rh - 54;
  ctx.fillStyle = '#34495e';
  ctx.fillRect(shX, shY, 4, 54);
  ctx.fillRect(shX + 56, shY, 4, 54);
  ctx.fillRect(shX, shY + 16, 60, 3);
  ctx.fillRect(shX, shY + 34, 60, 3);
  const canColors = ['#e74c3c', '#2ecc71', '#f39c12', '#3498db', '#e67e22'];
  for (let ci = 0; ci < 5; ci++) {
    ctx.fillStyle = canColors[ci % canColors.length];
    ctx.fillRect(shX + 6 + ci * 10, shY + 6, 7, 10);
    ctx.fillRect(shX + 6 + ci * 10, shY + 24, 7, 10);
  }

  // Blue fuel drums & Cardboard boxes on floor
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(shX + 6, ry + rh - 18, 14, 18);
  ctx.fillRect(shX + 22, ry + rh - 18, 14, 18);
  ctx.fillStyle = '#bfa181';
  ctx.fillRect(shX + 38, ry + rh - 14, 14, 14);
}

function renderFarmProps(ctx, r, rx, ry, rw, rh) {
  // Tree roots breaking through ceiling
  ctx.strokeStyle = '#3e2717';
  ctx.lineWidth = 2.5;
  for (let rxo = 15; rxo < rw - 15; rxo += 28) {
    ctx.beginPath();
    ctx.moveTo(rx + rxo, ry);
    ctx.quadraticCurveTo(rx + rxo + 8, ry + 18, rx + rxo - 4, ry + 32);
    ctx.stroke();
  }

  // Wooden planting beds with dark soil
  ctx.fillStyle = '#4a3325';
  ctx.fillRect(rx + 10, ry + rh - 18, rw - 20, 18);
  ctx.fillStyle = '#2b1d14';
  ctx.fillRect(rx + 12, ry + rh - 20, rw - 24, 6);

  // Bioluminescent glowing mushrooms
  const shroomColors = ['#5dade2', '#a9dfbf', '#f9e79f', '#58d68d'];
  for (let mx = rx + 18; mx < rx + rw - 20; mx += 14) {
    ctx.fillStyle = '#fdfefe';
    ctx.fillRect(mx + 2, ry + rh - 26, 2, 8);
    ctx.fillStyle = shroomColors[(mx) % shroomColors.length];
    ctx.beginPath();
    ctx.arc(mx + 3, ry + rh - 28, 4.5, Math.PI, 0);
    ctx.fill();
    // Spore glow
    ctx.fillStyle = 'rgba(93, 173, 226, 0.25)';
    ctx.beginPath();
    ctx.arc(mx + 3, ry + rh - 28, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderWaterPumpProps(ctx, r, rx, ry, rw, rh) {
  const twX = rx + rw / 2;
  const twY = ry + rh / 2 + 6;
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(twX, twY, 22, 0, Math.PI * 2); ctx.stroke();

  // Spinning turbine blades
  const tAngle = Date.now() * 0.008;
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2.5;
  for (let b = 0; b < 6; b++) {
    const ang = tAngle + (b * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(twX, twY);
    ctx.lineTo(twX + Math.cos(ang) * 20, twY + Math.sin(ang) * 20);
    ctx.stroke();
  }

  // Blue high-pressure water pipe
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(rx + 10, ry + rh - 14, rw - 20, 10);
  ctx.strokeStyle = '#1a5276';
  ctx.strokeRect(rx + 10, ry + rh - 14, rw - 20, 10);

  // Brass pressure gauges
  ctx.fillStyle = '#d4ac0d';
  ctx.beginPath(); ctx.arc(rx + 24, ry + 22, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx + 42, ry + 22, 6, 0, Math.PI * 2); ctx.fill();
}

function renderGeneratorProps(ctx, r, rx, ry, rw, rh) {
  // Heavy industrial generator diesel engine
  const genX = rx + 16;
  const genY = ry + rh - 40;
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(genX, genY, rw - 32, 36);
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(genX + 6, genY + 6, 16, 12);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.arc(genX + rw - 50, genY + 12, 5, 0, Math.PI * 2); ctx.fill();
  // Exhaust pipe upward
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(genX + 12, genY); ctx.lineTo(genX + 12, ry + 8);
  ctx.stroke();
}

function renderKitchenProps(ctx, r, rx, ry, rw, rh) {
  const tabX = rx + rw / 2 - 25;
  const tabY = ry + rh - 22;
  ctx.fillStyle = '#6e4a2e';
  ctx.fillRect(tabX, tabY, 50, 10);
  ctx.fillRect(tabX + 4, tabY + 10, 6, 12);
  ctx.fillRect(tabX + 40, tabY + 10, 6, 12);
  ctx.fillStyle = '#95a5a6';
  for (let bi = 0; bi < 3; bi++) {
    ctx.beginPath();
    ctx.arc(tabX + 12 + bi * 14, tabY - 2, 4, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(rx + 12, ry + 12, 34, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = '7px sans-serif';
  ctx.fillText('MESS', rx + 16, ry + 24);
}

function renderArmoryProps(ctx, r, rx, ry, rw, rh) {
  const rackX = rx + 12;
  const rackY = ry + rh - 45;
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(rackX, rackY, 60, 42);
  ctx.fillStyle = '#1a252f';
  ctx.fillRect(rackX + 4, rackY + 4, 52, 34);
  ctx.fillStyle = '#7f8c8d';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(rackX + 10 + i * 12, rackY + 8, 4, 26);
    ctx.fillRect(rackX + 8 + i * 12, rackY + 28, 8, 4);
  }
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(rx + rw - 44, ry + rh - 18, 18, 16);
  ctx.fillRect(rx + rw - 24, ry + rh - 18, 18, 16);
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 7px sans-serif';
  ctx.fillText('AMMO', rx + rw - 42, ry + rh - 7);
}

function renderQuartersProps(ctx, r, rx, ry, rw, rh) {
  renderBunkerProps(ctx, r, rx, ry, rw, rh);
}

function renderInfirmaryProps(ctx, r, rx, ry, rw, rh) {
  // Medical bed & Green Cross
  const bedX = rx + 14;
  const bedY = ry + rh - 24;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bedX, bedY, 44, 14);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(bedX + 2, bedY + 2, 40, 10);
  ctx.fillStyle = '#2ecc71';
  // Green cross on wall
  const crossX = rx + rw - 35;
  const crossY = ry + 16;
  ctx.fillRect(crossX - 2, crossY - 8, 4, 16);
  ctx.fillRect(crossX - 8, crossY - 2, 16, 4);
}

function renderSchoolProps(ctx, r, rx, ry, rw, rh) {
  const boardX = rx + rw / 2 - 25;
  const boardY = ry + 12;
  ctx.fillStyle = '#1e3725';
  ctx.fillRect(boardX, boardY, 50, 22);
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(boardX, boardY, 50, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '6px monospace';
  ctx.fillText('2+2=4  BELOW', boardX + 6, boardY + 10);
  ctx.fillText('NEW GENERATION', boardX + 4, boardY + 18);
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(rx + 12, ry + rh - 18, 28, 16);
  ctx.fillRect(rx + rw - 40, ry + rh - 18, 28, 16);
}

function renderHydroUvProps(ctx, r, rx, ry, rw, rh) {
  const rackX = rx + 8;
  const rackY = ry + rh - 48;
  ctx.fillStyle = '#111';
  ctx.fillRect(rackX, rackY, rw - 16, 46);
  ctx.fillStyle = 'rgba(155, 89, 182, 0.25)';
  ctx.fillRect(rackX + 4, rackY + 4, rw - 24, 38);
  ctx.fillStyle = '#9b59b6';
  ctx.fillRect(rackX + 4, rackY + 8, rw - 24, 3);
  ctx.fillRect(rackX + 4, rackY + 26, rw - 24, 3);
  ctx.fillStyle = '#2ecc71';
  for (let px = rackX + 8; px < rx + rw - 16; px += 8) {
    ctx.beginPath(); ctx.arc(px, rackY + 18, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px, rackY + 36, 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

function renderWorkshopProps(ctx, r, rx, ry, rw, rh) {
  const benchX = rx + 14;
  const benchY = ry + rh - 22;
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(benchX, benchY, rw - 28, 8);
  ctx.fillRect(benchX + 4, benchY + 8, 6, 14);
  ctx.fillRect(benchX + rw - 38, benchY + 8, 6, 14);
  ctx.fillStyle = '#95a5a6';
  ctx.fillRect(benchX + 6, benchY - 8, 10, 8);
  ctx.fillRect(benchX + 22, benchY - 5, 12, 4);
  ctx.fillStyle = '#37474f';
  ctx.fillRect(rx + rw / 2 - 20, ry + 12, 40, 6);
}

export const ROOM_RENDERERS = {
  bunker: renderBunkerProps,
  farm: renderFarmProps,
  waterPump: renderWaterPumpProps,
  generator: renderGeneratorProps,
  kitchen: renderKitchenProps,
  armory: renderArmoryProps,
  quarters: renderQuartersProps,
  infirmary: renderInfirmaryProps,
  school: renderSchoolProps,
  hydro_uv: renderHydroUvProps,
  workshop: renderWorkshopProps
};

export function drawRooms(ctx, G) {
  G.rooms.forEach(r => {
    const rx = r.x * CELL_SIZE;
    const ry = r.y * CELL_SIZE;
    const rw = r.w * CELL_SIZE;
    const rh = r.h * CELL_SIZE;

    // Ambient radial light bloom into surrounding soil
    const lampX = rx + rw / 2;
    const lampY = ry + 6;
    const bloom = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, Math.max(rw, rh) * 0.85);
    bloom.addColorStop(0, 'rgba(255, 230, 160, 0.22)');
    bloom.addColorStop(1, 'rgba(255, 230, 160, 0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(lampX, lampY, Math.max(rw, rh) * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Outer concrete / timber border
    ctx.fillStyle = (r.type === 'farm' || (r.type === 'bunker' && r.id && r.id.includes('bunks'))) ? '#4a3325' : '#4d4841';
    ctx.fillRect(rx - 2, ry - 2, rw + 4, rh + 4);

    // Two-tone wall paint
    ctx.fillStyle = '#dcd6c8';
    ctx.fillRect(rx, ry, rw, rh * 0.55);
    ctx.fillStyle = '#6e7d6b';
    ctx.fillRect(rx, ry + rh * 0.55, rw, rh * 0.45);

    // Dark trim moulding between wall colors
    ctx.fillStyle = '#2b3026';
    ctx.fillRect(rx, ry + rh * 0.55 - 2, rw, 3);

    // Room name badge top-left
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(rx + 6, ry + 4, Math.min(rw - 12, 85), 13);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(r.name, rx + 10, ry + 13);

    // Warm pendant hanging lamp cone
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lampX, ry); ctx.lineTo(lampX, lampY + 4); ctx.stroke();
    const lGrad = ctx.createRadialGradient(lampX, lampY + 4, 2, lampX, lampY + 18, rh * 0.85);
    lGrad.addColorStop(0, 'rgba(255, 236, 179, 0.45)');
    lGrad.addColorStop(1, 'rgba(255, 236, 179, 0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.moveTo(lampX, lampY + 4);
    ctx.lineTo(rx, ry + rh);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.closePath();
    ctx.fill();

    const renderer = ROOM_RENDERERS[r.type] || renderBunkerProps;
    renderer(ctx, r, rx, ry, rw, rh);
  });
}
