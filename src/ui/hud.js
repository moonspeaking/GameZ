import { G } from '../core/state.js';
import { CELL_SIZE, MAP_COLS, MAP_ROWS } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { showColonistModal } from './modals.js';
import { roleLabel } from '../core/i18n.js';

export function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function setElWidth(id, width) {
  const el = document.getElementById(id);
  if (el) el.style.width = width;
}

export function showToast(text, styleClass = 'toast-gold') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${styleClass}`;
  toast.innerHTML = text;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

export function toggleMobileHUD() {
  const sb = document.getElementById('sidebar-hud');
  if (!sb) return;
  sb.classList.toggle('mobile-open');
  const btn = document.getElementById('mobile-hud-btn');
  if (btn) {
    btn.textContent = sb.classList.contains('mobile-open') ? '✕ ЗАКРЫТЬ' : '📋 МЕНЮ';
  }
}

export function addLog(text) {
  const list = document.getElementById('sb-log-list');
  if (!list) return;
  const entry = document.createElement('div');
  entry.className = 'sb-log-entry';
  entry.innerHTML = `<span class="sb-log-day">D${G.day}</span> ${text}`;
  list.prepend(entry);
}

export function updateGrowthCurve(year, pop) {
  const path = document.getElementById('sb-chart-path');
  if (!path) return;
  let d = "M0,34 L20,34 L40,32 L60,32";
  if (year >= 3) d += " L70,30 L80,26";
  if (year >= 9) d += " L90,20 L100,16";
  if (year >= 13) d += " L105,18 L110,14";
  if (year >= 14) d += " L115,16 L120,12";
  if (year >= 30) d += " L125,8 L130,4";
  path.setAttribute('d', d);
}

export function updateWorkMeters(year, pop) {
  const wrap = document.getElementById('sb-work-bars');
  if (!wrap) return;
  if (year <= 2) {
    wrap.innerHTML = `
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:35%;"></div></div><span>1 DIR</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:35%;"></div></div><span>1 TECH</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:35%;"></div></div><span>1 MED</span></div>
    `;
  } else if (year < 14) {
    wrap.innerHTML = `
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:55%;"></div></div><span>15 DIR</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:40%;"></div></div><span>11 HAUL</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:70%;"></div></div><span>21 FARM</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:30%;"></div></div><span>6 COOK</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:50%;"></div></div><span>12 GRD</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:45%;"></div></div><span>9 TECH</span></div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:70%;"></div></div><span>47 DIR</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:90%;"></div></div><span>70 HAUL</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:85%;"></div></div><span>63 FARM</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:45%;"></div></div><span>27 COOK</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:50%;"></div></div><span>24 GRD</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:60%;"></div></div><span>33 TECH</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:40%;"></div></div><span>18 MED</span></div>
      <div class="sb-work-col"><div class="sb-work-meter-wrap"><div class="sb-work-meter-fill" style="height:35%;"></div></div><span>14 TCH</span></div>
    `;
  }
}

export function drawMinimap() {
  const mmCanvas = document.getElementById('sb-minimap-canvas');
  if (!mmCanvas) return;
  const mctx = mmCanvas.getContext('2d');
  if (!mctx) return;
  const mw = mmCanvas.width;
  const mh = mmCanvas.height;
  const W = window.innerWidth || 1200;
  const H = window.innerHeight || 700;

  mctx.fillStyle = '#3d2b1b';
  mctx.fillRect(0, 0, mw, mh);

  mctx.fillStyle = '#615f66';
  mctx.fillRect(0, 0, mw, 8);

  mctx.fillStyle = '#141416';
  mctx.fillRect(mw / 2 - 4, 8, 8, mh - 16);

  G.rooms.forEach(r => {
    const rx = (r.x / MAP_COLS) * mw;
    const ry = (r.y / MAP_ROWS) * mh;
    const rw = (r.w / MAP_COLS) * mw;
    const rh = (r.h / MAP_ROWS) * mh;
    mctx.fillStyle = '#d4af37';
    mctx.fillRect(rx, ry, rw, rh);
  });

  const vp = document.getElementById('sb-minimap-viewport');
  if (vp) {
    const zoom = G.cam.zoom || 1;
    const boxW = (W / zoom / (MAP_COLS * CELL_SIZE)) * mw;
    const boxH = (H / zoom / (MAP_ROWS * CELL_SIZE)) * mh;
    const boxX = (G.cam.x / (MAP_COLS * CELL_SIZE)) * mw;
    const boxY = (G.cam.y / (MAP_ROWS * CELL_SIZE)) * mh;
    vp.style.width = `${Math.min(mw, Math.max(16, boxW))}px`;
    vp.style.height = `${Math.min(mh, Math.max(12, boxH))}px`;
    vp.style.left = `${Math.max(0, Math.min(mw - boxW, boxX))}px`;
    vp.style.top = `${Math.max(0, Math.min(mh - boxH, boxY))}px`;
  }
}

export function updateHUD() {
  const year = Math.floor((G.day - 1) / 365) + 1;
  const dayInYear = ((G.day - 1) % 365) + 1;

  setElText('sb-year-text', `ГОД ${year}`);
  setElText('sb-day-text', `ДЕНЬ ${dayInYear}`);
  setElText('pill-title', (G.day === 1) ? 'ДЕНЬ 1 · НАЧАЛО ЗАРАЖЕНИЯ' : `ДЕНЬ ${G.day} · ГОД ${year}`);

  const isNight = (G.timeHour >= 21 || G.timeHour < 6);
  setElText('sb-time-icon', isNight ? '🌙' : '☀️');
  setElText('sb-time-clock', `${G.timeHour.toString().padStart(2, '0')}:${Math.floor(G.timeMin).toString().padStart(2, '0')}`);

  const pop = G.populationOverride || G.colonists.filter(c => c.status !== 'dead').length;
  setElText('sb-pop-val', pop);
  document.body.classList.toggle('prologue-active', G.state === 'prologue');
  setElText('tb-zoom-label', `${Math.round((G.cam.zoom || 1) * 100)}%`);

  updateGrowthCurve(year, pop);

  const foodDays = Math.max(0, Math.round(G.res.food));
  const waterDays = Math.max(0, Math.round(G.res.water));
  const powerPct = Math.max(0, Math.min(100, Math.round(G.res.power)));
  const fRate = G.mechanics.foodProduction - (pop * 0.15);
  const wRate = G.mechanics.waterProduction - (pop * 0.12);

  setElWidth('bar-food', `${Math.min(100, (foodDays / 100) * 100)}%`);
  setElText('val-food', `${foodDays} ${fRate >= 0 ? '(+' + fRate.toFixed(1) + '/д)' : '(' + fRate.toFixed(1) + '/д)'}`);

  setElWidth('bar-water', `${Math.min(100, (waterDays / 150) * 100)}%`);
  setElText('val-water', `${waterDays} ${wRate >= 0 ? '(+' + wRate.toFixed(1) + '/д)' : '(' + wRate.toFixed(1) + '/д)'}`);

  setElWidth('bar-power', `${powerPct}%`);
  setElText('val-power', `${powerPct}%`);

  setElWidth('bar-fuel', `${Math.min(100, G.res.fuel / 3)}%`);
  setElText('val-fuel', `${Math.round(G.res.fuel)}`);

  setElWidth('bar-med', `${Math.min(100, G.res.med * 5)}%`);
  setElText('val-med', `${Math.round(G.res.med)}${G.mechanics.sickColonists.length > 0 ? ' 🦠' + G.mechanics.sickColonists.length : ''}`);

  setElWidth('bar-ammo', `${Math.min(100, G.res.ammo)}%`);
  setElText('val-ammo', `${Math.round(G.res.ammo)}`);

  const moraleEl = document.getElementById('sb-morale-val');
  if (moraleEl) moraleEl.textContent = `${G.mechanics.morale}%`;

  if (G.mechanics.buildQueue.length > 0) {
    const bq = G.mechanics.buildQueue[0];
    const pct = Math.round(100 - (bq.daysLeft / (5 + bq.blueprint.matCost * 0.8)) * 100);
    setElText('sb-const-name', `${bq.blueprint.name.split(' (')[0]} [${pct}%]`);
  }

  if (G.mechanics.scavengeTeam.length > 0) {
    setElText('sb-scav-status', `🏙 Вылазка: ${G.mechanics.scavengeDayLeft}д`);
  } else {
    setElText('sb-scav-status', '');
  }

  updateWorkMeters(year, pop);

  const peopleGrid = document.getElementById('sb-people-grid');
  if (peopleGrid) {
    peopleGrid.innerHTML = '';
    G.colonists.slice(0, 8).forEach(c => {
      const card = document.createElement('div');
      card.className = `sb-person-card ${c.status === 'dead' ? 'deceased' : ''}`;
      card.onclick = () => showColonistModal(c);
      card.innerHTML = `
        <div class="sb-person-avatar">${c.icon}</div>
        <div class="sb-person-info">
          <div class="sb-person-name">${c.name}</div>
          <div class="sb-person-sub">ВОЗРАСТ ${c.age} · ${c.status === 'dead' ? 'ПОГИБ' : roleLabel(c.role)}</div>
        </div>
      `;
      peopleGrid.appendChild(card);
    });
  }

  drawMinimap();
}

// Event bindings
eventBus.on('hud_update', updateHUD);
eventBus.on('zoom_changed', () => setElText('tb-zoom-label', `${Math.round((G.cam.zoom || 1) * 100)}%`));
eventBus.on('log', addLog);
// Accepts { text, style } or the legacy (text, style) form
eventBus.on('toast', (arg, style) => {
  if (typeof arg === 'string') showToast(arg, style);
  else showToast(arg.text, arg.style);
});
eventBus.on('save_status', ({ text }) => {
  const el = document.getElementById('sb-save-time');
  if (el) el.textContent = text;
});
