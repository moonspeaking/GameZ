/**
 * Whiteboard (laws) modal view. DOM only; reads G, delegates actions to systems/laws.js.
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { LAWS_CONFIG, handleLawClick } from '../systems/laws.js';

export function openWhiteboardModal() {
  renderWhiteboardLaws();
  const m = document.getElementById('whiteboard-modal');
  if (m) m.style.display = 'flex';
}

export function closeWhiteboardModal() {
  const m = document.getElementById('whiteboard-modal');
  if (m) m.style.display = 'none';
}

export function renderWhiteboardLaws() {
  const container = document.getElementById('wb-laws-container');
  if (!container) return;
  const status = document.getElementById('wb-mode-status');
  if (status) {
    if (G.gameMode === 'democracy') {
      status.textContent = 'РЕЖИМ: ДЕМОКРАТИЯ (Клик выносит закон на голосование Совета)';
      status.style.color = '#27ae60';
    } else if (G.gameMode === 'overseer') {
      status.textContent = 'РЕЖИМ: КОМЕНДАНТ (Клик меняет закон прямым декретом)';
      status.style.color = '#d35400';
    } else {
      status.textContent = 'РЕЖИМ: АНАРХИЯ (Законы не признаются колонией)';
      status.style.color = '#c0392b';
    }
  }

  container.innerHTML = '';
  LAWS_CONFIG.forEach(law => {
    const card = document.createElement('div');
    card.style.cssText = 'background:#f8f6f0; border:1px solid #d3ccbe; border-radius:4px; padding:10px 14px;';

    const btnWrapper = document.createElement('div');
    btnWrapper.style.cssText = 'display:flex; flex-wrap:wrap;';

    law.options.forEach(opt => {
      const isCur = G.laws && G.laws[law.key] === opt.val;
      const b = document.createElement('button');
      b.style.cssText = `padding:5px 10px; font-size:11px; font-family:monospace; border-radius:3px; cursor:pointer; font-weight:bold; margin-right:6px; margin-top:4px; ${isCur ? 'background:#2c3e50; color:#fff; border:1px solid #1a252f;' : 'background:#e0dacb; color:#333; border:1px solid #b5ab99;'}`;
      b.textContent = (isCur ? '✔ ' : '') + opt.label;
      b.onclick = () => handleLawClick(law.key, opt.val);
      btnWrapper.appendChild(b);
    });

    card.innerHTML = `
      <div style="font-weight:bold; font-size:12px; color:#2c3e50; margin-bottom:3px;">${law.title}</div>
      <div style="font-size:11px; color:#666; margin-bottom:8px;">${law.desc}</div>
    `;
    card.appendChild(btnWrapper);
    container.appendChild(card);
  });
}

eventBus.on('laws_changed', renderWhiteboardLaws);
eventBus.on('whiteboard_close', closeWhiteboardModal);
