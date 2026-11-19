/**
 * Corridors linking rooms to the central shaft: concrete shell, warm plaster, ceiling pipe,
 * lamps and floor rail. Layout comes from world/rooms.js getCorridors().
 */
import { CELL_SIZE } from '../core/constants.js';
import { getCorridors } from '../world/rooms.js';
import { getConcretePattern } from './procedural_textures.js';

export function drawCorridors(ctx, G) {
  const concrete = getConcretePattern(ctx);
  getCorridors(G, CELL_SIZE).forEach(c => {
    const w = c.x2 - c.x1;

    // Outer concrete shell
    ctx.fillStyle = concrete || '#3c4046';
    ctx.fillRect(c.x1, c.y - 3, w, c.h + 6);

    // Interior: warm plaster over a darker wainscot
    ctx.fillStyle = '#5e5849';
    ctx.fillRect(c.x1, c.y, w, c.h);
    ctx.fillStyle = '#463f33';
    ctx.fillRect(c.x1, c.y + c.h * 0.58, w, c.h * 0.42);
    ctx.fillStyle = '#7a705d';
    ctx.fillRect(c.x1, c.y + c.h * 0.58 - 2, w, 2);

    // Ceiling shadow
    const ao = ctx.createLinearGradient(0, c.y, 0, c.y + 12);
    ao.addColorStop(0, 'rgba(15, 8, 2, 0.55)');
    ao.addColorStop(1, 'rgba(15, 8, 2, 0)');
    ctx.fillStyle = ao;
    ctx.fillRect(c.x1, c.y, w, 12);

    // Ceiling conduit and copper pipe
    ctx.fillStyle = '#111315';
    ctx.fillRect(c.x1, c.y + 3, w, 3);
    ctx.fillStyle = '#8d5524';
    ctx.fillRect(c.x1, c.y + 7, w, 2);

    // Structural ribs
    ctx.fillStyle = 'rgba(20, 12, 4, 0.35)';
    for (let x = c.x1 + 24; x < c.x2 - 6; x += 48) ctx.fillRect(x, c.y + 4, 3, c.h - 4);

    // Lamps
    for (let x = c.x1 + 40; x < c.x2 - 10; x += 96) {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x - 4, c.y + 9, 8, 3);
      ctx.fillStyle = 'rgba(255, 226, 150, 0.95)';
      ctx.fillRect(x - 3, c.y + 12, 6, 2);
    }

    // Floor rail
    ctx.fillStyle = '#1b1d21';
    ctx.fillRect(c.x1, c.y + c.h - 3, w, 3);
  });
}
