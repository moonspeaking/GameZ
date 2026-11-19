import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { gameNow } from '../core/clock.js';

export function updateSurveillanceFeed(G) {
  const camCanvas = document.getElementById('cam-feed-canvas');
  if (!camCanvas) return;
  const camCtx = camCanvas.getContext('2d');
  if (!camCtx) return;

  const cw = camCanvas.width;
  const ch = camCanvas.height;
  const t = gameNow() * 0.003;

  camCtx.fillStyle = '#06130b';
  camCtx.fillRect(0, 0, cw, ch);

  if (G.activeCamIdx === 0) {
    // CAM 1: HATCH YARD & ZOMBIES ON TOP
    camCtx.fillStyle = '#0f2418';
    camCtx.fillRect(0, ch - 32, cw, 32);
    camCtx.fillStyle = '#1d3e2b';
    camCtx.fillRect(cw / 2 - 25, ch - 42, 50, 14);

    if (G.day < 365 * 3) {
      camCtx.fillStyle = '#3f6b4d';
      for (let i = 0; i < 9; i++) {
        const zx = cw / 2 - 40 + i * 9 + Math.sin(t + i) * 3;
        const zy = ch - 42 - Math.abs(Math.sin(t * 2 + i * 1.5)) * 8;
        camCtx.fillRect(zx, zy, 5, 8);
        camCtx.beginPath(); camCtx.arc(zx + 2.5, zy - 3, 3, 0, Math.PI * 2); camCtx.fill();
      }
    } else {
      camCtx.fillStyle = '#2a4b36';
      camCtx.beginPath();
      camCtx.moveTo(cw / 2 - 40, ch);
      camCtx.lineTo(cw / 2, ch - 50);
      camCtx.lineTo(cw / 2 + 40, ch);
      camCtx.fill();
      camCtx.fillStyle = '#5dade2';
      camCtx.fillText('МАРКУС', cw / 2 - 16, ch - 54);
      camCtx.fillRect(cw / 2 - 3, ch - 50, 6, 12);
    }

  } else if (G.activeCamIdx === 1) {
    // CAM 2: MAIN SHAFT & LADDER CLIMBER
    camCtx.fillStyle = '#091811';
    camCtx.fillRect(cw / 2 - 35, 0, 70, ch);
    camCtx.strokeStyle = '#1b3b29';
    camCtx.lineWidth = 1.5;
    camCtx.strokeRect(cw / 2 - 35, 0, 70, ch);

    camCtx.strokeStyle = '#2d5a3e';
    camCtx.beginPath();
    camCtx.moveTo(cw / 2 - 20, 0); camCtx.lineTo(cw / 2 - 20, ch);
    camCtx.moveTo(cw / 2 + 20, 0); camCtx.lineTo(cw / 2 + 20, ch);
    camCtx.stroke();

    camCtx.strokeStyle = '#3d7853';
    camCtx.lineWidth = 1.2;
    for (let ly = 6; ly < ch; ly += 10) {
      camCtx.beginPath();
      camCtx.moveTo(cw / 2 - 14, ly);
      camCtx.lineTo(cw / 2 + 14, ly);
      camCtx.stroke();
    }

    const climbY = ch - 20 - ((gameNow() * 0.04) % (ch - 30));
    camCtx.fillStyle = '#78b58f';
    camCtx.fillRect(cw / 2 - 4, climbY, 8, 14);
    camCtx.beginPath(); camCtx.arc(cw / 2, climbY - 4, 3.5, 0, Math.PI * 2); camCtx.fill();
    camCtx.strokeStyle = '#78b58f';
    camCtx.lineWidth = 1.5;
    camCtx.beginPath();
    camCtx.moveTo(cw / 2 - 6, climbY + 4); camCtx.lineTo(cw / 2 - 12, climbY - 2);
    camCtx.moveTo(cw / 2 + 6, climbY + 4); camCtx.lineTo(cw / 2 + 12, climbY - 2);
    camCtx.stroke();

  } else if (G.activeCamIdx === 2) {
    // CAM 3: SURFACE STREET
    camCtx.fillStyle = '#0b190f';
    camCtx.fillRect(0, ch - 24, cw, 24);
    camCtx.fillStyle = '#1c3e29';
    camCtx.fillRect(15, ch - 55, 35, 31);
    camCtx.fillRect(60, ch - 65, 45, 41);
    camCtx.fillRect(115, ch - 75, 40, 51);
    camCtx.fillStyle = Math.random() < 0.5 ? '#8cd9a5' : '#55aa75';
    camCtx.fillRect(80, ch - 35, 12, 10);

  } else {
    // CAM 4: TURBINE HALL & RIVER
    camCtx.fillStyle = '#051118';
    camCtx.fillRect(0, ch - 35, cw, 35);
    const ang = t * 3;
    camCtx.strokeStyle = '#4da375';
    camCtx.lineWidth = 2;
    camCtx.beginPath();
    camCtx.arc(cw / 2, ch / 2, 18, 0, Math.PI * 2);
    camCtx.stroke();
    for (let b = 0; b < 4; b++) {
      const a = ang + (b * Math.PI) / 2;
      camCtx.beginPath();
      camCtx.moveTo(cw / 2, ch / 2);
      camCtx.lineTo(cw / 2 + Math.cos(a) * 16, ch / 2 + Math.sin(a) * 16);
      camCtx.stroke();
    }
  }

  // Scanlines
  camCtx.fillStyle = 'rgba(0, 255, 100, 0.04)';
  for (let sy = 0; sy < ch; sy += 3) {
    camCtx.fillRect(0, sy, cw, 1);
  }

  // Corner brackets
  camCtx.strokeStyle = 'rgba(120, 220, 150, 0.45)';
  camCtx.lineWidth = 1;
  camCtx.strokeRect(6, 6, 12, 12);
  camCtx.strokeRect(cw - 18, 6, 12, 12);
  camCtx.strokeRect(6, ch - 18, 12, 12);
  camCtx.strokeRect(cw - 18, ch - 18, 12, 12);

  const sec = Math.floor((gameNow() / 1000) % 60).toString().padStart(2, '0');
  const min = Math.floor((gameNow() / 60000) % 60).toString().padStart(2, '0');
  const timerEl = document.getElementById('cam-timer');
  if (timerEl) timerEl.textContent = `00:${min}:${sec}`;
}

export function cycleCamera() {
  G.activeCamIdx = (G.activeCamIdx + 1) % 4;
  const names = ['КАМ. 1 · ДВОР У ЛЮКА', 'КАМ. 2 · ГЛАВНЫЙ СТВОЛ', 'КАМ. 3 · УЛИЦА', 'КАМ. 4 · ЗАЛ ТУРБИН'];
  const nameEl = document.getElementById('cam-name');
  if (nameEl) nameEl.textContent = names[G.activeCamIdx];
  eventBus.emit('sound', { type: 'metal_clang' });
}
