import { G } from '../core/state.js';
import { CELL_SIZE } from '../core/constants.js';

export function getAlivePop() {
  return G.colonists.filter(c => c.status === 'alive' && !G.mechanics.scavengeTeam.includes(c.id)).length;
}

export function getTotalAlivePop() {
  return G.populationOverride || G.colonists.filter(c => c.status !== 'dead').length;
}

export function updateColonists(simDt) {
  G.colonists.forEach(c => {
    if (c.status === 'dead') return;
    if (G.mechanics.scavengeTeam && G.mechanics.scavengeTeam.includes(c.id)) return;
    if (!c._wanderTimer) c._wanderTimer = 0;
    c._wanderTimer += simDt;
    if (c._wanderTimer > 3000 + Math.random() * 4000) {
      c._wanderTimer = 0;
      c.x += (Math.random() - 0.5) * 10;
      c.y += (Math.random() - 0.5) * 6;
    }
  });
}
