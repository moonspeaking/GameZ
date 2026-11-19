/**
 * Research tech-tree modal view. DOM only; actions go through systems/research.js.
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { TECH_TREE, calcDailyScience, isTechResearched } from '../systems/research.js';

export function openResearchModal() {
  renderResearchModal();
  const m = document.getElementById('research-modal');
  if (m) m.style.display = 'flex';
}

export function closeResearchModal() {
  const m = document.getElementById('research-modal');
  if (m) m.style.display = 'none';
}

export function renderResearchModal() {
  const container = document.getElementById('research-tech-list');
  if (!container) return;

  const currentId = G.research ? G.research.currentTechId : null;
  const currentProgress = G.research ? G.research.progress || 0 : 0;
  const dailySci = calcDailyScience();

  const curTech = TECH_TREE.find(t => t.id === currentId);
  const statusEl = document.getElementById('research-status-bar');
  if (statusEl) {
    if (curTech) {
      const pct = Math.min(100, Math.round((currentProgress / curTech.cost) * 100));
      statusEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Изучается: <strong style="color:var(--accent-gold);">${curTech.name}</strong> (${pct}%)</span>
          <span style="color:#38bdf8;">+${dailySci} науки/день</span>
        </div>
        <div style="background:#222; border-radius:4px; height:8px; overflow:hidden;">
          <div style="background:#38bdf8; width:${pct}%; height:100%; transition:width 0.3s ease;"></div>
        </div>
      `;
    } else {
      statusEl.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#aaa;">Ничего не исследуется. Выберите технологию ниже.</span>
          <span style="color:#38bdf8;">+${dailySci} науки/день</span>
        </div>
      `;
    }
  }

  container.innerHTML = '';
  TECH_TREE.forEach(tech => {
    const done = isTechResearched(tech.id);
    const active = currentId === tech.id;

    const card = document.createElement('div');
    card.style.cssText = `
      background: ${done ? '#18241b' : (active ? '#1e2430' : '#1b1d24')};
      border: 1px solid ${done ? '#2ecc71' : (active ? '#38bdf8' : '#444')};
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `;

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:24px;">${tech.icon}</span>
        <div>
          <div style="font-weight:bold; font-size:13px; color:${done ? '#2ecc71' : '#fff'};">
            ${tech.name} ${done ? '✔ (ИЗУЧЕНО)' : (active ? '⏳ (В ПРОЦЕССЕ)' : '')}
          </div>
          <div style="color:#888; font-size:11px; margin-top:2px;">${tech.desc}</div>
        </div>
      </div>
      <div>
        ${done
          ? '<span style="color:#2ecc71; font-size:11px; font-weight:bold;">ГОТОВО</span>'
          : (active
            ? '<span style="color:#38bdf8; font-size:11px; font-weight:bold;">ИЗУЧАЕТСЯ</span>'
            : `<button class="modal-btn" style="padding:6px 12px; font-size:11px; background:#2c3e50; color:#38bdf8; border:1px solid #0284c7; cursor:pointer;" onclick="startResearch('${tech.id}')">ИЗУЧАТЬ (${tech.cost} 🔬)</button>`
          )
        }
      </div>
    `;
    container.appendChild(card);
  });
}

eventBus.on('research_close', closeResearchModal);
