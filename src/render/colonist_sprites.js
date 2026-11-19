import { CELL_SIZE } from '../core/constants.js';
import { spawnDigParticles, spawnWeldingSparks } from './particles.js';
import { drawPerson, drawNameTag } from './person.js';
import { isAsleep } from '../entities/colonists.js';
import { gameNow } from '../core/clock.js';

export function drawColonists(ctx, G) {
  const isNight = (G.timeHour >= 21 || G.timeHour < 6);

  G.colonists.forEach(c => {
    if (c.status === 'dead') return;
    if (G.mechanics.scavengeTeam && G.mechanics.scavengeTeam.includes(c.id)) return;

    const cx = c.x;
    const cy = c.y;
    const isWalking = Math.abs(c.targetX - c.x) > 2;
    const facingDir = (c.targetX && c.targetX < c.x) ? -1 : 1;
    const legOffset = isWalking ? Math.sin(gameNow() * 0.015) * 5 : 0;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sleeping colonists lie still on their bunks
    const isInBunks = isAsleep(c);

    if (isNight && isInBunks) {
      drawSleepingColonist(ctx, cx, cy, c);
      return;
    }

    // Natural wander and job idle animation
    if (G.paused || G.speed === 0) {
      // frozen
    } else if (!c.targetX || Math.abs(c.x - c.targetX) < 2) {
      if (Math.random() < 0.015) {
        c.targetX = c.x + (Math.random() - 0.5) * 60;
      }
    } else {
      c.x += (c.targetX > c.x ? 1 : -1) * 0.45;
    }


    // Slim figure in the style of the original, with per-hero clothes
    const idle = !isWalking;
    drawPerson(ctx, cx, cy, {
      id: c.id, color: c.color,
      pose: idle ? 'stand' : 'walk',
      facing: facingDir,
      phase: gameNow() * 0.0075 + (c.id.length * 1.7),
      tag: null
    });

    // Walt keeps swinging his pick while idle
    if (c.id === 'walt' && idle) {
      const pickAngle = Math.sin(gameNow() * 0.008) * 0.6 + 0.3;
      ctx.save();
      ctx.translate(cx + facingDir * 4, cy - 17);
      ctx.rotate(facingDir * pickAngle);
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(facingDir * 12, -8); ctx.stroke();
      ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(facingDir * 10, -13); ctx.lineTo(facingDir * 14, -3); ctx.stroke();
      ctx.restore();
      if (Math.random() < 0.04 && G.particles) spawnDigParticles(G.particles, cx + facingDir * 16, cy - 2);
    }

    // 4. Mood indicator dot (hopeful green, stressed amber, broken purple)
    const moodColors = { hopeful: '#2ecc71', stressed: '#e67e22', broken: '#9b59b6' };
    const moodDot = moodColors[c.mood] || '#95a5a6';
    ctx.fillStyle = moodDot;
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 47, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. White name tag, as in the original
    drawNameTag(ctx, cx, cy - 52, c.name.substring(0, 6).toUpperCase());

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
  const zT = (gameNow() * 0.002) % 1;
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
  const by = cy - 70;

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
