/**
 * Procedural Canvas Textures for Industrial Realism (0 external assets).
 * Generates reusable patterns once on startup for concrete, steel, rock strata,
 * hazard stripes, and ambient occlusion.
 */

let cachedPatterns = {};

function createNoiseCanvas(w, h, baseColor, noiseIntensity, grainSize = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * noiseIntensity;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

/**
 * Concrete Pattern with formwork board seams, speckles, and micro-cracks
 */
export function getConcretePattern(ctx) {
  if (cachedPatterns.concrete) return cachedPatterns.concrete;
  if (!ctx) return null;

  const w = 64;
  const h = 64;
  const base = createNoiseCanvas(w, h, '#2c3035', 22);
  const bCtx = base.getContext('2d');

  // Formwork seams (horizontal joint line with shadow/highlight)
  bCtx.strokeStyle = '#1b1d20';
  bCtx.lineWidth = 1.2;
  bCtx.beginPath();
  bCtx.moveTo(0, 32); bCtx.lineTo(64, 32);
  bCtx.stroke();

  bCtx.strokeStyle = '#3e444b';
  bCtx.lineWidth = 0.8;
  bCtx.beginPath();
  bCtx.moveTo(0, 33); bCtx.lineTo(64, 33);
  bCtx.stroke();

  // Subtle aggregate specks and tiny pores
  bCtx.fillStyle = '#16181b';
  for (let i = 0; i < 20; i++) {
    const px = Math.random() * w;
    const py = Math.random() * h;
    bCtx.fillRect(px, py, 1.5, 1.5);
  }

  cachedPatterns.concrete = ctx.createPattern(base, 'repeat');
  return cachedPatterns.concrete;
}

/**
 * Weathered Industrial Steel with rivets and metal seams
 */
export function getSteelPattern(ctx) {
  if (cachedPatterns.steel) return cachedPatterns.steel;
  if (!ctx) return null;

  const w = 48;
  const h = 48;
  const base = createNoiseCanvas(w, h, '#3a3f47', 18);
  const bCtx = base.getContext('2d');

  // Brushed metal directional grain
  bCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 0; y < h; y += 3) {
    bCtx.fillRect(0, y, w, 1);
  }

  // Steel plate bevel edges
  bCtx.strokeStyle = '#4e5560';
  bCtx.lineWidth = 1;
  bCtx.strokeRect(0.5, 0.5, w - 1, h - 1);
  bCtx.strokeStyle = '#202327';
  bCtx.strokeRect(1.5, 1.5, w - 3, h - 3);

  // Rivets on corners
  bCtx.fillStyle = '#1e2126';
  const rivets = [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5]];
  rivets.forEach(([rx, ry]) => {
    bCtx.beginPath();
    bCtx.arc(rx, ry, 1.8, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#5a626d';
    bCtx.fillRect(rx - 0.5, ry - 0.5, 1, 1);
    bCtx.fillStyle = '#1e2126';
  });

  cachedPatterns.steel = ctx.createPattern(base, 'repeat');
  return cachedPatterns.steel;
}

/**
 * Industrial Hazard Stripe Pattern (Yellow/Dark Charcoal for blast doors & machinery)
 */
export function getHazardPattern(ctx) {
  if (cachedPatterns.hazard) return cachedPatterns.hazard;
  if (!ctx) return null;

  const w = 32;
  const h = 32;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const bCtx = c.getContext('2d');

  bCtx.fillStyle = '#181a1c';
  bCtx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#d4ac0d'; // desaturated industrial yellow
  bCtx.beginPath();
  bCtx.moveTo(0, 16); bCtx.lineTo(16, 0); bCtx.lineTo(24, 0); bCtx.lineTo(0, 24); bCtx.closePath(); bCtx.fill();
  bCtx.beginPath();
  bCtx.moveTo(0, 32); bCtx.lineTo(32, 0); bCtx.lineTo(40, 0); bCtx.lineTo(0, 40); bCtx.closePath(); bCtx.fill();
  bCtx.beginPath();
  bCtx.moveTo(8, 32); bCtx.lineTo(32, 8); bCtx.lineTo(32, 16); bCtx.lineTo(16, 32); bCtx.closePath(); bCtx.fill();

  cachedPatterns.hazard = ctx.createPattern(c, 'repeat');
  return cachedPatterns.hazard;
}

/**
 * Geological Earth Strata Patterns (Layered rock, silt, roots, deep basalt)
 */
export function getStrataPattern(ctx, layerIndex) {
  const key = `strata_${layerIndex}`;
  if (cachedPatterns[key]) return cachedPatterns[key];
  if (!ctx) return null;

  const w = 64;
  const h = 64;
  const baseTones = [
    { base: '#3b2819', noise: 24, specks: '#22150a' }, // Topsoil & root earth
    { base: '#322013', noise: 20, specks: '#1c1008' }, // Compacted silt/clay
    { base: '#26180e', noise: 22, specks: '#150c06' }, // Pre-war dense shale
    { base: '#1b1410', noise: 18, specks: '#100a06' }, // Deep slate & river bedrock
    { base: '#131217', noise: 16, specks: '#09080c' }  // Basalt deep bedrock
  ];

  const tone = baseTones[Math.min(layerIndex, baseTones.length - 1)];
  const base = createNoiseCanvas(w, h, tone.base, tone.noise);
  const bCtx = base.getContext('2d');

  // Stratified horizontal geological fissures and sediment lines
  bCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  bCtx.lineWidth = 1;
  bCtx.beginPath();
  bCtx.moveTo(0, 18); bCtx.bezierCurveTo(20, 22, 45, 14, 64, 19);
  bCtx.moveTo(0, 44); bCtx.bezierCurveTo(15, 41, 50, 48, 64, 43);
  bCtx.stroke();

  // Mineral/rock specks
  bCtx.fillStyle = tone.specks;
  for (let i = 0; i < 14; i++) {
    bCtx.fillRect(Math.random() * w, Math.random() * h, 2, 1.5);
  }

  cachedPatterns[key] = ctx.createPattern(base, 'repeat');
  return cachedPatterns[key];
}

/**
 * Clear cached patterns if canvas context is recreated or resized
 */
export function clearPatternCache() {
  cachedPatterns = {};
}
