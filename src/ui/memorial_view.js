/**
 * Memorial modal view. DOM only; reads G.memorial.
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { ensureMemorial } from '../systems/memorial.js';

export function openMemorialModal() {
  ensureMemorial();
  renderMemorialModal();
  const m = document.getElementById('memorial-modal');
  if (m) m.style.display = 'flex';
}

export function closeMemorialModal() {
  const m = document.getElementById('memorial-modal');
  if (m) m.style.display = 'none';
}

export function renderMemorialModal() {
  const container = document.getElementById('memorial-content');
  if (!container) return;
  ensureMemorial();

  const fallen = G.memorial.fallen;
  const incidents = G.memorial.incidents || [];
  const totalDeaths = fallen.length;
  const totalDays = G.day;

  // Header stats
  const statsEl = document.getElementById('memorial-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#e74c3c;">${totalDeaths}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Погибших</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#f1c40f;">${G.colonists.filter(c => c.status === 'alive').length}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Выживших</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#38bdf8;">${totalDays}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Дней</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#2ecc71;">${G.mechanics.totalBorn || 0}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Рождённых</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = '';

  if (fallen.length === 0 && incidents.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:#666;">
        <div style="font-size:36px; margin-bottom:12px;">🕊</div>
        <div style="font-size:14px;">Никто не погиб. Колония держится.</div>
        <div style="font-size:11px; color:#444; margin-top:6px;">Пусть так будет всегда.</div>
      </div>
    `;
    return;
  }

  // ---- FALLEN COLONISTS ----
  if (fallen.length > 0) {
    const header = document.createElement('div');
    header.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #2a2a2a;';
    header.textContent = '⚰ ПАВШИЕ';
    container.appendChild(header);

    fallen.slice().reverse().forEach(r => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #100f0d;
        border: 1px solid #2c2a24;
        border-left: 3px solid #8b1a1a;
        border-radius: 4px;
        padding: 10px 14px;
        margin-bottom: 8px;
        position: relative;
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:22px; filter:grayscale(1) opacity(0.7);">${r.icon}</span>
            <div>
              <div style="font-weight:bold; font-size:14px; color:#cfbfad;">
                ${r.name}
                <span style="font-size:11px; color:#666; font-weight:normal;"> · ${r.role}</span>
              </div>
              <div style="font-size:11px; color:#8b1a1a; margin-top:1px;">☠ ${r.cause}</div>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:10px;">
            <div style="font-size:11px; color:#666;">ДЕНЬ ${r.day}</div>
            <div style="font-size:10px; color:#555;">${r.daysSurvived} дн. в бункере</div>
          </div>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#7a6a5a; font-style:italic; border-top:1px solid #1a1a1a; padding-top:6px;">
          «${r.epitaph}»
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ---- INCIDENTS LOG ----
  if (incidents.length > 0) {
    const incHeader = document.createElement('div');
    incHeader.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:2px; margin:16px 0 8px; padding-bottom:6px; border-bottom:1px solid #2a2a2a;';
    incHeader.textContent = '⚡ ИНЦИДЕНТЫ';
    container.appendChild(incHeader);

    incidents.slice(-15).reverse().forEach(inc => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; margin-bottom: 4px;
        background: #12120f; border-radius: 3px;
        font-size: 11px; color: #8d7b6a;
        border-left: 2px solid #5c3d2e;
      `;
      row.innerHTML = `
        <span>${inc.name} — ${inc.type}</span>
        <span style="color:#555;">День ${inc.day}</span>
      `;
      container.appendChild(row);
    });
  }
}

eventBus.on('memorial_changed', renderMemorialModal);
