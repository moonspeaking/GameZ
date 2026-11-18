import { CELL_SIZE } from '../core/constants.js';
import { isValidPlacement } from '../world/rooms.js';

export function drawBlueprints(ctx, G) {
  G.blueprints.forEach(bp => {
    const bx = bp.x * CELL_SIZE;
    const by = bp.y * CELL_SIZE;
    const bw = bp.w * CELL_SIZE;
    const bh = bp.h * CELL_SIZE;

    // Cyan dashed blueprint outline
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    // Cyan blueprint semi-transparent fill
    ctx.fillStyle = 'rgba(52, 152, 219, 0.12)';
    ctx.fillRect(bx, by, bw, bh);

    // Center icon badge
    ctx.fillStyle = 'rgba(41, 128, 185, 0.85)';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + bh / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bp.icon || '🏗️', bx + bw / 2, by + bh / 2 + 4);

    // Construction progress bar & label
    if (bp.daysLeft !== undefined && bp.totalDays) {
      const prog = Math.max(0, Math.min(1, 1 - bp.daysLeft / bp.totalDays));
      const barW = bw - 20;
      const barH = 5;
      const barX = bx + 10;
      const barY = by + bh - 12;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(barX, barY, barW * prog, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = '#d4af37';
      ctx.font = '8px sans-serif';
      ctx.fillText(`${bp.daysLeft} дн.`, bx + bw / 2, barY - 3);
    }
    ctx.textAlign = 'left';
  });
}

export function drawInteractivePlacementOverlay(ctx, G) {
  if (G.toolMode === 'place_room' && G.placingRoom) {
    const r = G.placingRoom;
    const col = G.hoverCell.c;
    const row = G.hoverCell.r;
    const valid = isValidPlacement(r, col, row);
    const gx = col * CELL_SIZE;
    const gy = row * CELL_SIZE;
    const gw = r.w * CELL_SIZE;
    const gh = r.h * CELL_SIZE;

    ctx.fillStyle = valid ? 'rgba(46, 204, 113, 0.28)' : 'rgba(231, 76, 60, 0.35)';
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = valid ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((r.icon || '🏗️') + ' ' + r.name, gx + gw / 2, gy + gh / 2 - 4);
    ctx.fillStyle = valid ? '#2ecc71' : '#ff9999';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(valid ? '✔ КЛИК ДЛЯ ПОСТРОЙКИ' : '✖ ПРЕПЯТСТВИЕ / ПОРОДА', gx + gw / 2, gy + gh / 2 + 12);
    ctx.textAlign = 'left';

  } else if (G.toolMode === 'demolish') {
    const col = G.hoverCell.c;
    const row = G.hoverCell.r;
    const targetRoom = G.rooms.find(r => col >= r.x && col < r.x + r.w && row >= r.y && row < r.y + r.h);
    const targetBp = G.blueprints.find(bp => col >= bp.x && col < bp.x + bp.w && row >= bp.y && row < bp.y + bp.h);
    const target = targetRoom || targetBp;
    if (target) {
      const gx = target.x * CELL_SIZE;
      const gy = target.y * CELL_SIZE;
      const gw = target.w * CELL_SIZE;
      const gh = target.h * CELL_SIZE;
      ctx.fillStyle = 'rgba(231, 76, 60, 0.35)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💥 СНЕСТИ: ${target.name}`, gx + gw / 2, gy + gh / 2 + 4);
      ctx.textAlign = 'left';
    }
  }
}
