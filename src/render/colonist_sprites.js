import { CELL_SIZE } from '../core/constants.js';
import { spawnDigParticles, spawnWeldingSparks } from './particles.js';

export function drawColonists(ctx, G) {
  const isNight = (G.timeHour >= 21 || G.timeHour < 6);

  G.colonists.forEach(c => {
    if (c.status === 'dead') return;
    if (G.mechanics.scavengeTeam && G.mechanics.scavengeTeam.includes(c.id)) return;

    // Natural wander and job idle animation
    if (!c.targetX || Math.abs(c.x - c.targetX) < 2) {
      if (Math.random() < 0.015) {
        c.targetX = c.x + (Math.random() - 0.5) * 60;
      }
    } else {
      c.x += (c.targetX > c.x ? 1 : -1) * 0.45;
    }

    const cx = c.x;
    const cy = c.y;
    const isWalking = Math.abs(c.targetX - c.x) > 2;
    const facingDir = (c.targetX && c.targetX < c.x) ? -1 : 1;
    const legOffset = isWalking ? Math.sin(Date.now() * 0.015) * 5 : 0;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Check if sleeping at night in a living quarters room
    const isInBunks = G.rooms && G.rooms.some(r =>
      (r.type === 'quarters' || r.type === 'bunker') &&
      cx >= r.x * CELL_SIZE && cx <= (r.x + r.w) * CELL_SIZE &&
      cy >= r.y * CELL_SIZE && cy <= (r.y + r.h) * CELL_SIZE + 4
    );

    if (isNight && isInBunks) {
      drawSleepingColonist(ctx, cx, cy, c);
      return;
    }

    // 1. Legs with dark rugged industrial trousers & work boots
    ctx.strokeStyle = '#1b1d20';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 8); ctx.lineTo(cx - 4 + legOffset, cy);
    ctx.moveTo(cx + 3, cy - 8); ctx.lineTo(cx + 4 - legOffset, cy);
    ctx.stroke();

    // Heavy leather work boots
    ctx.fillStyle = '#111214';
    ctx.fillRect(cx - 6 + legOffset, cy - 2, 4.5, 2.5);
    ctx.fillRect(cx + 2 - legOffset, cy - 2, 4.5, 2.5);

    // 2. Torso with Character Costume & Work Gear
    ctx.fillStyle = c.color || '#34495e';
    ctx.fillRect(cx - 5.5, cy - 22, 11, 14);

    // Character specific gear & realistic equipment
    if (c.id === 'walt') {
      // Walt: Heavy orange miner jumpsuit, tool harness, yellow safety helmet with lit headlamp
      ctx.fillStyle = '#d35400';
      ctx.fillRect(cx - 5.5, cy - 21, 11, 13);
      // Tool harness straps
      ctx.strokeStyle = '#273746';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 21); ctx.lineTo(cx + 4, cy - 9);
      ctx.moveTo(cx + 4, cy - 21); ctx.lineTo(cx - 4, cy - 9);
      ctx.stroke();

      // Yellow mining helmet with peak
      ctx.fillStyle = '#f39c12';
      ctx.beginPath(); ctx.arc(cx, cy - 28, 6.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 8, cy - 28, 16, 2.5);

      // Lit miner headlamp with front lens
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + (facingDir === 1 ? 4 : -6), cy - 30, 3, 3);

      // Mining Pickaxe swing animation if working or idle
      const pickAngle = isWalking ? 0.3 : Math.sin(Date.now() * 0.008) * 0.6 + 0.3;
      ctx.save();
      ctx.translate(cx + facingDir * 5, cy - 14);
      ctx.rotate(facingDir * pickAngle);
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; // wooden handle
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(facingDir * 12, -8); ctx.stroke();
      ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 3; // steel pick head
      ctx.beginPath(); ctx.moveTo(facingDir * 10, -13); ctx.lineTo(facingDir * 14, -3); ctx.stroke();
      ctx.restore();

      // Spawn subtle dust when striking
      if (!isWalking && Math.random() < 0.04 && G.particles) {
        spawnDigParticles(G.particles, cx + facingDir * 16, cy - 2);
      }
    } else if (c.id === 'ray') {
      // Ray: Electrician navy coveralls, leather tool belt with pliers
      ctx.fillStyle = '#1f3a52';
      ctx.fillRect(cx - 5.5, cy - 21, 11, 13);
      // Leather tool belt
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(cx - 6, cy - 11, 12, 3);
      ctx.fillStyle = '#d4ac0d'; // brass buckle
      ctx.fillRect(cx - 1.5, cy - 11, 3, 3);
      // Safety goggles on forehead
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(cx - 5, cy - 29, 10, 3);
      ctx.fillStyle = '#5dade2';
      ctx.fillRect(cx - 4, cy - 28, 3, 1.8);
      ctx.fillRect(cx + 1, cy - 28, 3, 1.8);
    } else if (c.id === 'nora') {
      // Nora: Field medic white coat over olive fatigues, stethoscope
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(cx - 5.5, cy - 22, 11, 14);
      // Stethoscope around neck
      ctx.strokeStyle = '#2f3640';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy - 18, 3.5, 0, Math.PI); ctx.stroke();
      // Medical red cross armband
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(cx - (facingDir === 1 ? 5 : -3), cy - 19, 2.5, 5);
      // Dark brown hair
      ctx.fillStyle = '#382212';
      ctx.beginPath(); ctx.arc(cx, cy - 27, 5.2, 0, Math.PI * 2); ctx.fill();
    } else if (c.id === 'eli') {
      // Eli: Courier athletic windbreaker, tactical courier backpack
      ctx.fillStyle = '#a93226';
      ctx.fillRect(cx - 5.5, cy - 21, 11, 13);
      // Tactical backpack on back
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(cx - facingDir * 8, cy - 21, 4, 10);
      // Baseball cap
      ctx.fillStyle = '#78281f';
      ctx.beginPath(); ctx.arc(cx, cy - 27, 5.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx + (facingDir === 1 ? 0 : -8), cy - 28, 8, 2);
    } else {
      // Colony survivors / workers: Rugged grey/slate worker jackets
      ctx.fillStyle = c.color || '#485460';
      ctx.fillRect(cx - 5, cy - 20, 10, 12);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(cx - 4, cy - 28, 8, 3); // cap
    }

    // 3. Head & Face with skin tones & eyes
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath(); ctx.arc(cx, cy - 25, 4.5, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(cx + facingDir * 1.5, cy - 26, 1.2, 1.5);

    // 4. Mood indicator dot (hopeful green, stressed amber, broken purple)
    const moodColors = { hopeful: '#2ecc71', stressed: '#e67e22', broken: '#9b59b6' };
    const moodDot = moodColors[c.mood] || '#95a5a6';
    ctx.fillStyle = moodDot;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 32, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Military Stenciled Name Badge
    ctx.fillStyle = 'rgba(15, 17, 21, 0.85)';
    ctx.strokeStyle = '#3a414d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 16, cy - 41, 32, 10, 2);
    } else {
      ctx.rect(cx - 16, cy - 41, 32, 10);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dcdde1';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.name.substring(0, 6).toUpperCase(), cx, cy - 33.5);
    ctx.textAlign = 'left';

    // 6. Thought bubble
    if (c.thought && c._showThought && !isNight) {
      drawThoughtBubble(ctx, cx, cy, c.thought, c.mood);
    }

    if (!c._thoughtTimer) c._thoughtTimer = 0;
    c._thoughtTimer++;
    if (c._thoughtTimer > 180 + Math.floor(Math.random() * 240)) {
      c._thoughtTimer = 0;
      c._showThought = Math.random() < 0.4;
    }
  });
}

function drawSleepingColonist(ctx, cx, cy, c) {
  // Horizontal sleeping figure on bunk bed
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(cx - 16, cy - 14, 32, 12);

  // Wool blanket pulled up to chest
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(cx - 12, cy - 12, 24, 10);
  ctx.strokeStyle = '#1a252f';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 12, cy - 12, 24, 10);

  // Head resting on pillow
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Closed eye line
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 8); ctx.lineTo(cx - 13, cy - 8);
  ctx.stroke();

  // Floating Zzz
  const zT = (Date.now() * 0.002) % 1;
  ctx.fillStyle = 'rgba(241, 196, 15, 0.75)';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('Z', cx + 6 + zT * 6, cy - 16 - zT * 12);
  ctx.restore();
}

function drawThoughtBubble(ctx, cx, cy, text, mood) {
  const maxLen = 28;
  const display = text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

  const pad = 5;
  ctx.font = '7.5px sans-serif';
  const tw = ctx.measureText(display).width;
  const bw = tw + pad * 2;
  const bh = 14;
  const bx = cx - bw / 2;
  const by = cy - 58;

  const borderColor = mood === 'hopeful' ? '#2ecc71'
                    : mood === 'broken'  ? '#8e44ad'
                    : '#e67e22';

  ctx.fillStyle = 'rgba(15, 18, 24, 0.92)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 3);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  // Tail pointing to colonist
  ctx.fillStyle = 'rgba(15, 18, 24, 0.92)';
  ctx.beginPath();
  ctx.moveTo(cx - 3, by + bh);
  ctx.lineTo(cx + 3, by + bh);
  ctx.lineTo(cx, by + bh + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = mood === 'broken' ? '#c084fc'
                : mood === 'stressed' ? '#fbbf24'
                : '#e2f0d9';
  ctx.textAlign = 'center';
  ctx.fillText(display, cx, by + bh - 4);
  ctx.textAlign = 'left';
}
