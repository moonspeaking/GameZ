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
    const legOffset = isWalking ? Math.sin(Date.now() * 0.015) * 5 : 0;

    // 1. Legs with dark trousers & shoes
    ctx.strokeStyle = '#1e2124';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 8); ctx.lineTo(cx - 4 + legOffset, cy);
    ctx.moveTo(cx + 3, cy - 8); ctx.lineTo(cx + 4 - legOffset, cy);
    ctx.stroke();

    // 2. Torso with Character Costume
    ctx.fillStyle = c.color || '#3498db';
    ctx.fillRect(cx - 5, cy - 22, 10, 14);

    // Character specific gear & props
    if (c.id === 'walt') {
      ctx.fillStyle = '#e67e22'; ctx.fillRect(cx - 5, cy - 20, 10, 10);
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(cx, cy - 29, 6.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 8, cy - 29, 16, 2.5);
      ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + 5, cy - 14); ctx.lineTo(cx + 12, cy - 8); ctx.stroke();
    } else if (c.id === 'ray') {
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(cx - 6, cy - 12, 12, 3);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(cx - 5, cy - 30, 10, 4);
    } else if (c.id === 'nora') {
      ctx.fillStyle = '#ecf0f1'; ctx.fillRect(cx - 5, cy - 21, 10, 13);
      ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy - 17, 3.5, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = '#4a2311';
      ctx.beginPath(); ctx.arc(cx, cy - 28, 5, 0, Math.PI * 2); ctx.fill();
    } else if (c.id === 'eli') {
      ctx.fillStyle = '#c0392b'; ctx.fillRect(cx - 5, cy - 22, 10, 14);
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - 21); ctx.lineTo(cx + 4, cy - 9); ctx.stroke();
      ctx.fillStyle = '#922b21';
      ctx.beginPath(); ctx.arc(cx, cy - 27, 5.5, Math.PI, 0); ctx.fill();
    } else if (c.id === 'marcus') {
      ctx.fillStyle = '#27ae60'; ctx.fillRect(cx - 5, cy - 22, 10, 14);
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(cx - 6, cy - 30, 12, 4);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 4, cy - 22); ctx.lineTo(cx + 10, cy - 8); ctx.stroke();
    } else if (c.id === 'toby' || c.id === 'lily') {
      ctx.fillStyle = c.color; ctx.fillRect(cx - 4, cy - 16, 8, 10);
    }

    // 3. Head & Face
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath(); ctx.arc(cx, cy - 25, 4.5, 0, Math.PI * 2); ctx.fill();

    // 4. Mood indicator dot above head (tiny colored circle)
    const moodColors = { hopeful: '#2ecc71', stressed: '#e67e22', broken: '#8e44ad' };
    const moodDot = moodColors[c.mood] || '#888';
    ctx.fillStyle = moodDot;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 31, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. White Rounded Name Badge Placard
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 16, cy - 40, 32, 11, 2.5);
    } else {
      ctx.rect(cx - 16, cy - 40, 32, 11);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, cx, cy - 32);
    ctx.textAlign = 'left';

    // 6. Thought bubble — triggered randomly, shows c.thought
    if (c.thought && c._showThought && !isNight) {
      drawThoughtBubble(ctx, cx, cy, c.thought, c.mood);
    }

    // Randomly toggle thought bubble every ~3s
    if (!c._thoughtTimer) c._thoughtTimer = 0;
    c._thoughtTimer++;
    if (c._thoughtTimer > 180 + Math.floor(Math.random() * 240)) {
      c._thoughtTimer = 0;
      c._showThought = Math.random() < 0.4; // 40% chance to show
    }

    // Sleep "Zzz" particles when night
    if (isNight && Math.random() < 0.05) {
      G.particles.push({
        x: cx + 8,
        y: cy - 36,
        vx: 0.3,
        vy: -0.6,
        life: 40,
        color: '#d4af37',
        text: 'z'
      });
    }
  });
}

// -------------------------------------------------
// Draw speech/thought bubble above a colonist
// -------------------------------------------------
function drawThoughtBubble(ctx, cx, cy, text, mood) {
  const maxLen = 28;
  const display = text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

  const pad = 5;
  ctx.font = '7px sans-serif';
  const tw = ctx.measureText(display).width;
  const bw = tw + pad * 2;
  const bh = 14;
  const bx = cx - bw / 2;
  const by = cy - 56;

  // Mood-tinted border color
  const borderColor = mood === 'hopeful' ? '#2ecc71'
                    : mood === 'broken'  ? '#8e44ad'
                    : '#e67e22';

  // Bubble body
  ctx.fillStyle = 'rgba(10,10,14,0.88)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 4);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  // Tail (small triangle pointing down)
  ctx.fillStyle = 'rgba(10,10,14,0.88)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, by + bh);
  ctx.lineTo(cx + 3, by + bh);
  ctx.lineTo(cx, by + bh + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = mood === 'broken' ? '#c084fc'
                : mood === 'stressed' ? '#fbbf24'
                : '#d4f7d4';
  ctx.font = '7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(display, cx, by + bh - 4);
  ctx.textAlign = 'left';
}
