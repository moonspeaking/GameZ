/**
 * Governance-mode indicator and selector view. DOM only.
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';

export function updateGameModeUI() {
  const btn = document.getElementById('btn-mode-indicator');
  if (btn) {
    if (G.gameMode === 'democracy') {
      btn.innerHTML = '🏛️ ДЕМОКРАТИЯ ▼';
      btn.style.color = '#2ecc71';
      btn.style.borderColor = '#27ae60';
      btn.style.background = '#16241a';
    } else if (G.gameMode === 'overseer') {
      btn.innerHTML = '👑 КОМЕНДАНТ ▼';
      btn.style.color = '#e67e22';
      btn.style.borderColor = '#d35400';
      btn.style.background = '#281d14';
    } else {
      btn.innerHTML = '⚡ АНАРХИЯ ▼';
      btn.style.color = '#e74c3c';
      btn.style.borderColor = '#c0392b';
      btn.style.background = '#281616';
    }
  }

  ['democracy', 'overseer', 'anarchy'].forEach(m => {
    const card = document.getElementById(`gm-card-${m}`);
    const badge = document.getElementById(`gm-badge-${m}`);
    const active = G.gameMode === m;
    if (card) {
      card.style.borderColor = active ? (m === 'democracy' ? '#2ecc71' : (m === 'overseer' ? '#e67e22' : '#e74c3c')) : '#444';
      card.style.background = active ? '#22252f' : '#1b1d24';
    }
    if (badge) badge.style.display = active ? 'inline-block' : 'none';
  });
}

eventBus.on('game_mode_changed', updateGameModeUI);
