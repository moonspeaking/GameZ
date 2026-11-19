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

  const w = 96;
  const h = 96;
  // Warm sepia earth like the reference video: lighter near the surface, cooler and darker with depth.
  const baseTones = [
    { base: '#6e4c2c', noise: 26, dark: '#4a3119', light: '#8d6a43', stone: '#9a8466' }, // Topsoil & root earth
    { base: '#5e4026', noise: 22, dark: '#3f2815', light: '#7b5836', stone: '#85705a' }, // Compacted silt/clay
    { base: '#4d3520', noise: 22, dark: '#33210f', light: '#684a2d', stone: '#74624f' }, // Dense shale
    { base: '#3b2a1b', noise: 18, dark: '#261a0f', light: '#4f3925', stone: '#5d5047' }, // Deep slate & river bedrock
    { base: '#2a2630', noise: 16, dark: '#1a171e', light: '#38333f', stone: '#4a4553' }  // Basalt deep bedrock
  ];

  const tone = baseTones[Math.min(layerIndex, baseTones.length - 1)];
  const base = createNoiseCanvas(w, h, tone.base, tone.noise);
  const bCtx = base.getContext('2d');

  // Soft darker / lighter blotches so the soil does not look like flat noise
  for (let i = 0; i < 9; i++) {
    const bx = Math.random() * w, by = Math.random() * h, br = 10 + Math.random() * 16;
    const g = bCtx.createRadialGradient(bx, by, 1, bx, by, br);
    const col = i % 2 === 0 ? tone.dark : tone.light;
    g.addColorStop(0, col + '88');
    g.addColorStop(1, col + '00');
    bCtx.fillStyle = g;
    bCtx.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  // Stratified horizontal sediment lines (dark crack + pale highlight beneath)
  bCtx.lineWidth = 1;
  [[16, 20, 12], [50, 46, 54], [78, 82, 74]].forEach(([y0, y1, y2]) => {
    bCtx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    bCtx.beginPath(); bCtx.moveTo(0, y0); bCtx.bezierCurveTo(28, y1, 62, y2, w, y0 + 2); bCtx.stroke();
    bCtx.strokeStyle = 'rgba(255, 220, 160, 0.10)';
    bCtx.beginPath(); bCtx.moveTo(0, y0 + 1.5); bCtx.bezierCurveTo(28, y1 + 1.5, 62, y2 + 1.5, w, y0 + 3.5); bCtx.stroke();
  });

  // Embedded stones: pale rounded rocks with a shadow side
  for (let i = 0; i < 7; i++) {
    const sx = Math.random() * w, sy = Math.random() * h, sr = 2 + Math.random() * 3.5;
    bCtx.fillStyle = tone.dark;
    bCtx.beginPath(); bCtx.ellipse(sx + 0.8, sy + 1, sr, sr * 0.75, 0, 0, Math.PI * 2); bCtx.fill();
    bCtx.fillStyle = tone.stone;
    bCtx.beginPath(); bCtx.ellipse(sx, sy, sr, sr * 0.75, 0, 0, Math.PI * 2); bCtx.fill();
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    bCtx.beginPath(); bCtx.ellipse(sx - sr * 0.3, sy - sr * 0.25, sr * 0.4, sr * 0.28, 0, 0, Math.PI * 2); bCtx.fill();
  }

  // Fine dark grit
  bCtx.fillStyle = tone.dark;
  for (let i = 0; i < 26; i++) {
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
