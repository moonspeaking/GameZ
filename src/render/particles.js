/**
 * High-performance Particle FX Engine (0 external dependencies).
 * Simulates excavation rock chips, welding sparks, steam puffs, generator exhaust,
 * and blood splatter.
 */

const MAX_PARTICLES = 160;

export function createParticleSystem() {
  return [];
}

export function spawnDigParticles(particles, x, y) {
  if (particles.length > MAX_PARTICLES) return;
  const count = 5 + Math.floor(Math.random() * 4);
  const colors = ['#5a4632', '#786248', '#3d2c1c', '#a69076'];

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
    const speed = 1.2 + Math.random() * 2.8;
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.12,
      size: 1.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      life: 0,
      maxLife: 25 + Math.random() * 20,
      type: 'dust'
    });
  }
}

export function spawnWeldingSparks(particles, x, y) {
  if (particles.length > MAX_PARTICLES) return;
  const count = 4 + Math.floor(Math.random() * 3);
  const colors = ['#ffffff', '#fff3a8', '#ffae19', '#ff5722'];

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.14,
      size: 1.2 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      life: 0,
      maxLife: 15 + Math.random() * 12,
      type: 'spark'
    });
  }
}

export function spawnSteam(particles, x, y) {
  if (particles.length > MAX_PARTICLES) return;
  particles.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.6 - Math.random() * 0.6,
    gravity: -0.01,
    size: 2.5 + Math.random() * 2.5,
    growth: 0.08,
    color: 'rgba(215, 235, 255, 0.4)',
    alpha: 0.6,
    life: 0,
    maxLife: 45 + Math.random() * 25,
    type: 'steam'
  });
}

export function spawnSmoke(particles, x, y) {
  if (particles.length > MAX_PARTICLES) return;
  particles.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y,
    vx: 0.2 + (Math.random() - 0.5) * 0.5,
    vy: -0.8 - Math.random() * 0.8,
    gravity: -0.015,
    size: 2.8 + Math.random() * 3,
    growth: 0.1,
    color: 'rgba(50, 48, 45, 0.6)',
    alpha: 0.65,
    life: 0,
    maxLife: 55 + Math.random() * 30,
    type: 'smoke'
  });
}

export function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life++;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    if (p.growth) p.size += p.growth;
    p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
  }
}

export function drawParticles(ctx, particles) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
