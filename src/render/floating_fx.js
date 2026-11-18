/**
 * Floating Informational FX & Emoticons for Colonists & Production.
 * Renders floating numbers (+15 ⛏️, +5 ⚡, -2 🍞) and status icons (💤, ⚡⚠️, 💡).
 */

export function createFloatingTextSystem() {
  return [];
}

export function spawnFloatingText(list, x, y, text, color = '#2ecc71', size = 11) {
  if (list.length > 50) list.shift(); // keep bounded
  list.push({
    x,
    y,
    text,
    color,
    size,
    vy: -0.65,
    alpha: 1,
    life: 0,
    maxLife: 60
  });
}

export function updateFloatingTexts(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i];
    item.life++;
    if (item.life >= item.maxLife) {
      list.splice(i, 1);
      continue;
    }
    item.y += item.vy;
    item.vy *= 0.96; // gentle deceleration
    item.alpha = Math.max(0, 1 - (item.life / item.maxLife));
  }
}

export function drawFloatingTexts(ctx, list) {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    ctx.save();
    ctx.globalAlpha = item.alpha;
    ctx.font = `bold ${item.size}px sans-serif`;
    ctx.textAlign = 'center';

    // Black stroke shadow for high contrast
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeText(item.text, item.x, item.y);

    // Colored fill
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}
