import { G } from '../core/state.js';
import { CELL_SIZE } from '../core/constants.js';

export const COLONIST_PERKS = {
  ray: { trait: '⚡ Электромастер', desc: '-15% расход энергии колонией' },
  nora: { trait: '💉 Главврач', desc: '+30% скорость выздоровления в лазарете' },
  walt: { trait: '⛏️ Горный мастер', desc: '+20% скорость строительства и раскопок' },
  eli: { trait: '🎒 Быстрый скаут', desc: '+50% шанс избежать ранений на поверхности' },
  marcus: { trait: '🛡️ Ветеран обороны', desc: '+15 к защите при ночных атаках' },
  sarah: { trait: '🌾 Агроном', desc: '+25% к урожаю грибной фермы' },
  toby: { trait: '📖 Любознательный', desc: '+1 очко науки в день' },
  lily: { trait: '⭐ Вдохновитель', desc: '+5 к морали окружающих' }
};

export function getColonistPerk(colonist) {
  if (colonist.id && COLONIST_PERKS[colonist.id]) return COLONIST_PERKS[colonist.id];
  if (!colonist.perk) {
    const randomPerks = [
      { trait: '🌟 Оптимист', desc: 'Устойчив к падению морали' },
      { trait: '🔨 Трудоголик', desc: '+1 стройматериал раз в 5 дней' },
      { trait: '🍞 Экономный', desc: 'Потребляет на 20% меньше пайка' },
      { trait: '💪 Крепыш', desc: '+25 максимального запаса здоровья' }
    ];
    colonist.perk = randomPerks[Math.floor(Math.random() * randomPerks.length)];
  }
  return colonist.perk;
}

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
