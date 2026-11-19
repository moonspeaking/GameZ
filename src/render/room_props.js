import { CELL_SIZE } from '../core/constants.js';
import { getConcretePattern, getSteelPattern, getHazardPattern } from './procedural_textures.js';
import { gameNow } from '../core/clock.js';

// --- Room Shell & Ambient Occlusion ---

function renderRoomShell(ctx, r, rx, ry, rw, rh, G) {
  const isBlackout = (G && G.res && G.res.energy <= 0);

  // 1. Reinforced Concrete Outer Shell
  const concretePat = getConcretePattern(ctx);
  ctx.fillStyle = concretePat || '#3c4046';
  ctx.fillRect(rx - 3, ry - 3, rw + 6, rh + 6);

  // 2. Interior Walls: Two-tone Industrial Paint (Weathered grey top, olive/slate wainscot bottom)
  ctx.fillStyle = '#5e5849'; // warm plaster, lit by ceiling lamps
  ctx.fillRect(rx, ry, rw, rh);

  const wainscotY = ry + rh * 0.58;
  ctx.fillStyle = '#463f33';
  ctx.fillRect(rx, wainscotY, rw, rh * 0.42);

  // Metal wainscot trim rail
  ctx.fillStyle = '#7a705d';
  ctx.fillRect(rx, wainscotY - 2, rw, 2);

  // 3. Ambient Occlusion (Depth Shadows on Top, Left, Right ceiling corners)
  const aoTop = ctx.createLinearGradient(rx, ry, rx, ry + 12);
  aoTop.addColorStop(0, 'rgba(15, 8, 2, 0.55)');
  aoTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aoTop;
  ctx.fillRect(rx, ry, rw, 12);

  const aoLeft = ctx.createLinearGradient(rx, ry, rx + 10, ry);
  aoLeft.addColorStop(0, 'rgba(15, 8, 2, 0.45)');
  aoLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aoLeft;
  ctx.fillRect(rx, ry, 10, rh);

  const aoRight = ctx.createLinearGradient(rx + rw, ry, rx + rw - 10, ry);
  aoRight.addColorStop(0, 'rgba(15, 8, 2, 0.45)');
  aoRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aoRight;
  ctx.fillRect(rx + rw - 10, ry, 10, rh);

  // 4. Overhead Infrastructure: Black Steel Conduit & Copper Utility Pipes along ceiling
  ctx.fillStyle = '#111315';
  ctx.fillRect(rx, ry + 3, rw, 3);
  ctx.fillStyle = '#8d5524'; // copper pipe
  ctx.fillRect(rx, ry + 7, rw, 2);

  // Pipe junction brackets
  ctx.fillStyle = '#4a505b';
  for (let px = rx + 15; px < rx + rw - 10; px += 28) {
    ctx.fillRect(px, ry + 2, 3, 8);
  }

  // 5. Heavy Steel Floor Track
  ctx.fillStyle = '#1b1d21';
  ctx.fillRect(rx, ry + rh - 3, rw, 3);

  // 6. Military Stencil Room Label top-left
  ctx.fillStyle = 'rgba(10, 12, 15, 0.75)';
  ctx.fillRect(rx + 5, ry + 12, Math.min(rw - 10, 78), 11);
  ctx.fillStyle = '#b8c2cc';
  ctx.font = 'bold 7.5px monospace';
  ctx.fillText(r.name.substring(0, 14), rx + 8, ry + 20);

  // 7. Unpowered Blinking Warning Badge if energy <= 0
  if (isBlackout) {
    const pulse = (Math.sin(gameNow() * 0.008) + 1) * 0.5;
    ctx.fillStyle = `rgba(200, 30, 30, ${0.4 + pulse * 0.5})`;
    ctx.fillRect(rx + rw - 55, ry + 12, 50, 11);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('⚡ ВЫКЛ', rx + rw - 44, ry + 20);
  }
}

// --- Specific Room Interiors (All 11 Types) ---

function drawDoubleBunk(ctx, bedX, bedY) {
  // Heavy steel tubular double bunk: two beds, upper and lower
  ctx.fillStyle = '#2b3038';
  ctx.fillRect(bedX, bedY, 4, 46);
  ctx.fillRect(bedX + 44, bedY, 4, 46);
  ctx.fillRect(bedX, bedY + 16, 48, 3);
  ctx.fillRect(bedX, bedY + 38, 48, 3);
  ctx.fillStyle = '#3a4433'; // olive wool blanket top
  ctx.fillRect(bedX + 4, bedY + 12, 38, 4);
  ctx.fillStyle = '#263342'; // navy wool blanket bottom
  ctx.fillRect(bedX + 4, bedY + 34, 38, 4);
  ctx.fillStyle = '#c5ccd3'; // pillows
  ctx.fillRect(bedX + 5, bedY + 9, 9, 4);
  ctx.fillRect(bedX + 5, bedY + 31, 9, 4);
}

function renderBunkerProps(ctx, r, rx, ry, rw, rh) {
  // Two double bunks = four beds, one for each of the four survivors
  drawDoubleBunk(ctx, rx + 8, ry + rh - 46);
  drawDoubleBunk(ctx, rx + 64, ry + rh - 46);

  // Steel Locker on Right
  const lkX = rx + rw - 32;
  const lkY = ry + rh - 44;
  ctx.fillStyle = '#22262d';
  ctx.fillRect(lkX, lkY, 24, 44);
  ctx.strokeStyle = '#3e4450';
  ctx.lineWidth = 1;
  ctx.strokeRect(lkX, lkY, 24, 44);

  // Locker louvers / vents
  ctx.fillStyle = '#111417';
  ctx.fillRect(lkX + 4, lkY + 6, 16, 1.5);
  ctx.fillRect(lkX + 4, lkY + 10, 16, 1.5);
  ctx.fillRect(lkX + 4, lkY + 14, 16, 1.5);

  // Wall Whiteboard with territory map and survival guidelines
  const wbX = rx + rw / 2 - 18;
  const wbY = ry + 16;
  ctx.fillStyle = '#dfe4ea';
  ctx.fillRect(wbX, wbY, 36, 18);
  ctx.strokeStyle = '#57606f';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(wbX, wbY, 36, 18);

  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(wbX + 4, wbY + 5); ctx.lineTo(wbX + 32, wbY + 5);
  ctx.moveTo(wbX + 4, wbY + 9); ctx.lineTo(wbX + 26, wbY + 9);
  ctx.stroke();

  // Red marker star (Bunker location)
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.arc(wbX + 16, wbY + 13, 2, 0, Math.PI * 2); ctx.fill();
}

function renderQuartersProps(ctx, r, rx, ry, rw, rh) {
  renderBunkerProps(ctx, r, rx, ry, rw, rh);
}

function renderFarmProps(ctx, r, rx, ry, rw, rh) {
  // Tree roots dangling into the cave ceiling
  ctx.strokeStyle = '#322013';
  ctx.lineWidth = 2.2;
  for (let rxo = 12; rxo < rw - 12; rxo += 24) {
    ctx.beginPath();
    ctx.moveTo(rx + rxo, ry);
    ctx.quadraticCurveTo(rx + rxo + 6, ry + 16, rx + rxo - 4, ry + 28);
    ctx.stroke();
  }

  // Wooden Planter Troughs with dark rich loam/humus
  const troughH = 16;
  ctx.fillStyle = '#2d1d12';
  ctx.fillRect(rx + 8, ry + rh - troughH, rw - 16, troughH);
  ctx.fillStyle = '#170f09'; // soil layer
  ctx.fillRect(rx + 10, ry + rh - troughH - 2, rw - 20, 5);

  // Bioluminescent Cave Fungi with realistic spore glow
  const shroomCols = ['#5dade2', '#58d68d', '#f4d03f', '#a569bd'];
  for (let mx = rx + 16; mx < rx + rw - 16; mx += 14) {
    const col = shroomCols[Math.floor(mx) % shroomCols.length];
    // Stem
    ctx.fillStyle = '#d5dbdb';
    ctx.fillRect(mx + 2, ry + rh - 22, 2.5, 7);
    // Cap
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(mx + 3, ry + rh - 23, 4.5, Math.PI, 0);
    ctx.fill();
    // Spore pulse
    const spPulse = (Math.sin(gameNow() * 0.004 + mx) + 1) * 0.5;
    ctx.fillStyle = col.replace(')', ', 0.25)').replace('rgb', 'rgba').replace('#', 'rgba(');
    ctx.fillStyle = 'rgba(93, 173, 226, 0.2)';
    ctx.beginPath();
    ctx.arc(mx + 3, ry + rh - 23, 7 + spPulse * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderHydroUvProps(ctx, r, rx, ry, rw, rh) {
  // Vertical Stainless Steel Hydroponic Racks
  const rackX = rx + 6;
  const rackY = ry + rh - 48;
  const rackW = rw - 12;

  ctx.fillStyle = '#1e2229';
  ctx.fillRect(rackX, rackY, rackW, 46);

  // Two tiers of UV LED grow light bars
  const uvPulse = 0.35 + Math.sin(gameNow() * 0.003) * 0.08;
  ctx.fillStyle = `rgba(185, 80, 240, ${uvPulse})`;
  ctx.fillRect(rackX + 4, rackY + 6, rackW - 8, 38);

  // Metal LED light fixture bar
  ctx.fillStyle = '#6a2c85';
  ctx.fillRect(rackX + 4, rackY + 8, rackW - 8, 2.5);
  ctx.fillRect(rackX + 4, rackY + 28, rackW - 8, 2.5);

  // Leafy green plants on upper and lower tier
  ctx.fillStyle = '#27ae60';
  for (let px = rackX + 8; px < rackX + rackW - 8; px += 7) {
    ctx.beginPath(); ctx.arc(px, rackY + 19, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px, rackY + 39, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(px - 1, rackY + 16, 2, 2);
    ctx.fillRect(px - 1, rackY + 36, 2, 2);
    ctx.fillStyle = '#27ae60';
  }

  // Clear nutrient solution tubing with animated bubble flow
  ctx.strokeStyle = 'rgba(80, 200, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rackX + 2, rackY + 10);
  ctx.lineTo(rackX + 2, rackY + 44);
  ctx.stroke();
}

function renderWaterPumpProps(ctx, r, rx, ry, rw, rh) {
  // Cast Iron Water Turbine & Pumping Housing
  const twX = rx + rw / 2;
  const twY = ry + rh / 2 + 6;

  // Bolted flange outer ring
  ctx.strokeStyle = '#3e444e';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(twX, twY, 20, 0, Math.PI * 2); ctx.stroke();

  // Rotating brass impeller blades
  const angle = gameNow() * 0.007;
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = angle + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(twX, twY);
    ctx.lineTo(twX + Math.cos(a) * 17, twY + Math.sin(a) * 17);
    ctx.stroke();
  }

  // High-pressure blue water main running across the floor
  ctx.fillStyle = '#1a3c54';
  ctx.fillRect(rx + 8, ry + rh - 13, rw - 16, 10);
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 1;
  ctx.strokeRect(rx + 8, ry + rh - 13, rw - 16, 10);

  // Brass pressure gauge dials
  ctx.fillStyle = '#f5f6fa';
  ctx.beginPath(); ctx.arc(rx + 22, ry + 24, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b7950b';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Red needle
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(rx + 22, ry + 24); ctx.lineTo(rx + 24, ry + 21); ctx.stroke();
}

function renderGeneratorProps(ctx, r, rx, ry, rw, rh) {
  // Heavy Industrial Diesel Engine & Bike Dynamo
  const gx = rx + 12;
  const gy = ry + rh - 38;
  const gw = rw - 24;

  // Dark cast iron engine block with oil stains
  ctx.fillStyle = '#1e2227';
  ctx.fillRect(gx, gy, gw, 35);
  ctx.strokeStyle = '#333842';
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy, gw, 35);

  // Rotating belt pulley
  const spin = gameNow() * 0.015;
  ctx.fillStyle = '#2f3542';
  ctx.beginPath(); ctx.arc(gx + 12, gy + 16, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f1c40f'; // rotating marker
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx + 12, gy + 16);
  ctx.lineTo(gx + 12 + Math.cos(spin) * 7, gy + 16 + Math.sin(spin) * 7);
  ctx.stroke();

  // Heavy steel exhaust flue leading through the ceiling
  ctx.strokeStyle = '#4b525f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(gx + gw - 12, gy);
  ctx.lineTo(gx + gw - 12, ry + 6);
  ctx.stroke();

  // 55-gallon Diesel fuel drum
  ctx.fillStyle = '#1b4f72';
  ctx.fillRect(gx + gw - 28, gy + 12, 13, 23);
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(gx + gw - 28, gy + 18, 13, 2.5); // hazard stripe
}

function renderKitchenProps(ctx, r, rx, ry, rw, rh) {
  // Heavy Cast Iron Stove on Left
  const stX = rx + 10;
  const stY = ry + rh - 34;
  ctx.fillStyle = '#1b1d20';
  ctx.fillRect(stX, stY, 22, 31);
  ctx.strokeStyle = '#3a3e46';
  ctx.lineWidth = 1;
  ctx.strokeRect(stX, stY, 22, 31);

  // Flue pipe
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(stX + 11, stY); ctx.lineTo(stX + 11, ry + 6); ctx.stroke();

  // Rustic Wooden Mess Table & Benches
  const tabX = rx + 38;
  const tabY = ry + rh - 22;
  ctx.fillStyle = '#4a2f1b';
  ctx.fillRect(tabX, tabY, rw - 48, 8);
  ctx.fillRect(tabX + 4, tabY + 8, 5, 12);
  ctx.fillRect(tabX + rw - 58, tabY + 8, 5, 12);

  // Metal mess tins and mugs
  ctx.fillStyle = '#95a5a6';
  for (let mi = 0; mi < 3; mi++) {
    ctx.fillRect(tabX + 8 + mi * 14, tabY - 3, 7, 3);
  }
}

function renderArmoryProps(ctx, r, rx, ry, rw, rh) {
  // Steel Wire Mesh Partition
  ctx.strokeStyle = 'rgba(120, 130, 145, 0.4)';
  ctx.lineWidth = 1;
  for (let x = rx + 12; x < rx + rw - 12; x += 6) {
    ctx.beginPath(); ctx.moveTo(x, ry + 12); ctx.lineTo(x, ry + rh - 4); ctx.stroke();
  }

  // Rifle Rack with Automatic Rifles
  const rkX = rx + 12;
  const rkY = ry + rh - 42;
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(rkX, rkY, 38, 38);
  ctx.fillStyle = '#3a404c';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(rkX + 6 + i * 11, rkY + 6, 3, 26);
    ctx.fillRect(rkX + 4 + i * 11, rkY + 24, 7, 4);
  }

  // Olive Drab Ammo Crates
  const crX = rx + rw - 34;
  const crY = ry + rh - 22;
  ctx.fillStyle = '#2d3b27';
  ctx.fillRect(crX, crY, 26, 18);
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 6.5px monospace';
  ctx.fillText('7.62x39', crX + 2, crY + 11);
}

function renderInfirmaryProps(ctx, r, rx, ry, rw, rh) {
  // Stainless Steel Hospital Bed
  const bedX = rx + 12;
  const bedY = ry + rh - 26;
  ctx.fillStyle = '#2c333d';
  ctx.fillRect(bedX, bedY, 46, 22);
  ctx.fillStyle = '#ecf0f1'; // sterile white sheet
  ctx.fillRect(bedX + 2, bedY + 3, 42, 6);
  ctx.fillRect(bedX + 4, bedY + 1, 10, 4); // pillow

  // Mobile IV Drip Stand with saline bag
  const ivX = bedX + 52;
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ivX, ry + rh - 4);
  ctx.lineTo(ivX, ry + 16);
  ctx.stroke();

  // Saline drip bag
  ctx.fillStyle = 'rgba(230, 245, 255, 0.8)';
  ctx.fillRect(ivX - 2.5, ry + 17, 5, 8);

  // Vitals ECG Monitor with glowing pulse
  const monX = rx + rw - 28;
  const monY = ry + 16;
  ctx.fillStyle = '#111417';
  ctx.fillRect(monX, monY, 22, 16);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(monX + 2, monY + 9);
  ctx.lineTo(monX + 7, monY + 9);
  ctx.lineTo(monX + 10, monY + 4);
  ctx.lineTo(monX + 13, monY + 13);
  ctx.lineTo(monX + 16, monY + 9);
  ctx.lineTo(monX + 20, monY + 9);
  ctx.stroke();
}

function renderWorkshopProps(ctx, r, rx, ry, rw, rh) {
  // Heavy Industrial Workbench
  const bX = rx + 12;
  const bY = ry + rh - 22;
  const bW = rw - 24;

  ctx.fillStyle = '#422817';
  ctx.fillRect(bX, bY, bW, 8);
  ctx.fillStyle = '#23272e';
  ctx.fillRect(bX + 3, bY + 8, 6, 12);
  ctx.fillRect(bX + bW - 9, bY + 8, 6, 12);

  // Bench Vice
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(bX + 4, bY - 8, 9, 8);

  // Wall Pegboard with tool silhouettes
  const pbX = rx + rw / 2 - 20;
  const pbY = ry + 16;
  ctx.fillStyle = '#282b30';
  ctx.fillRect(pbX, pbY, 40, 16);
  ctx.fillStyle = '#4a505a';
  for (let x = pbX + 4; x < pbX + 36; x += 6) {
    ctx.fillRect(x, pbY + 4, 2, 8);
  }
}

function renderSchoolProps(ctx, r, rx, ry, rw, rh) {
  // Slate Blackboard
  const bbX = rx + rw / 2 - 24;
  const bbY = ry + 14;
  ctx.fillStyle = '#152b1b';
  ctx.fillRect(bbX, bbY, 48, 20);
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bbX, bbY, 48, 20);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '6px monospace';
  ctx.fillText('КОЛОНИЯ ЗЕМЛЯ', bbX + 4, bbY + 8);
  ctx.fillText('ВЫЖИВАНИЕ, ГЛ.1', bbX + 4, bbY + 16);

  // Student Desks
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(rx + 10, ry + rh - 18, 24, 15);
  ctx.fillRect(rx + rw - 34, ry + rh - 18, 24, 15);
}

function renderLatrineProps(ctx, r, rx, ry, rw, rh) {
  // Stainless Steel Sanitation Stalls
  const stX = rx + 12;
  const stY = ry + rh - 38;
  ctx.fillStyle = '#2c323b';
  ctx.fillRect(stX, stY, rw - 24, 35);
  ctx.strokeStyle = '#434c59';
  ctx.lineWidth = 1;
  ctx.strokeRect(stX, stY, rw - 24, 35);

  // Stall divider door
  ctx.fillStyle = '#1f242b';
  ctx.fillRect(stX + 6, stY + 4, 18, 28);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(stX + 22, stY + 16, 2, 4); // brass latch
}

export const ROOM_RENDERERS = {
  bunker: renderBunkerProps,
  quarters: renderQuartersProps,
  farm: renderFarmProps,
  hydro_uv: renderHydroUvProps,
  waterPump: renderWaterPumpProps,
  generator: renderGeneratorProps,
  kitchen: renderKitchenProps,
  armory: renderArmoryProps,
  infirmary: renderInfirmaryProps,
  workshop: renderWorkshopProps,
  school: renderSchoolProps,
  latrine: renderLatrineProps
};

export function drawRooms(ctx, G) {
  if (!G.rooms) return;

  G.rooms.forEach(r => {
    const rx = r.x * CELL_SIZE;
    const ry = r.y * CELL_SIZE;
    const rw = r.w * CELL_SIZE;
    const rh = r.h * CELL_SIZE;

    // 1. Draw Architectural Room Shell & Ambient Occlusion
    renderRoomShell(ctx, r, rx, ry, rw, rh, G);

    // 2. Draw Specific Interior Props
    const renderer = ROOM_RENDERERS[r.type] || renderBunkerProps;
    renderer(ctx, r, rx, ry, rw, rh);
  });
}
