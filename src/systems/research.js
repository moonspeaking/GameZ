import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { calcResourceRates } from './resources.js';
import { startCouncilVote } from './democracy.js';

export const TECH_TREE = [
  {
    id: 'uv_accelerators',
    name: 'УФ-Ускорители Роста',
    icon: '🌱',
    cost: 50,
    desc: 'Оптимизация спектра ламп в грибных фермах и теплицах. Увеличивает выработку еды на 40%.',
    apply: (G) => {
      G.mechanics.foodBonusMultiplier = (G.mechanics.foodBonusMultiplier || 1.0) + 0.4;
    }
  },
  {
    id: 'water_recycler',
    name: 'Замкнутый Цикл Водоочистки',
    icon: '💧',
    cost: 65,
    desc: 'Керамические фильтры глубокой рециркуляции. Снижает суточный расход воды колонией на 30%.',
    apply: (G) => {
      G.mechanics.waterDrainMultiplier = 0.7;
    }
  },
  {
    id: 'reinforced_bulkheads',
    name: 'Усиленные Бронегермошлюзы',
    icon: '🛡️',
    cost: 75,
    desc: 'Титановые распорки внешнего шлюза. Дает постоянный бонус +20 к защите убежища.',
    apply: (G) => {
      G.mechanics.baseDefenseBonus = (G.mechanics.baseDefenseBonus || 0) + 20;
    }
  },
  {
    id: 'ground_radar',
    name: 'Глубинный Георадар',
    icon: '📡',
    cost: 85,
    desc: 'Акустическое сканирование пород. Ручные раскопки дают +1 дополнительный блок стройматериалов.',
    apply: (G) => {
      G.mechanics.miningYieldBonus = (G.mechanics.miningYieldBonus || 0) + 1;
    }
  },
  {
    id: 'sentry_turrets',
    name: 'Автоматические Турели',
    icon: '🎯',
    cost: 110,
    desc: 'Огневые турели в стволе шахты. Защита убежища +35, снижает потери при атаках орды.',
    apply: (G) => {
      G.mechanics.baseDefenseBonus = (G.mechanics.baseDefenseBonus || 0) + 35;
    }
  },
  {
    id: 'radio_booster',
    name: 'Усилитель Радиопередатчика',
    icon: '📻',
    cost: 95,
    desc: 'Мощный ретранслятор на поверхности. Новые группы беженцев прибывают в два раза чаще.',
    apply: (G) => {
      G.mechanics.newcomerFreqBonus = 0.5;
    }
  }
];

export function isTechResearched(techId) {
  return G.research && G.research.completed && G.research.completed.includes(techId);
}

export function calcDailyScience() {
  let sci = 1; // base progress
  const schools = G.rooms.filter(r => r.type === 'school').length;
  const workshops = G.rooms.filter(r => r.type === 'workshop').length;
  sci += schools * 2;
  sci += workshops * 3;

  // Specialists bonus
  G.colonists.forEach(c => {
    if (c.status === 'alive') {
      if (c.role === 'ELEC' || c.role === 'TECH' || c.role === 'ENG') sci += 1;
    }
  });
  return sci;
}

export function progressDailyResearch() {
  if (!G.research) G.research = { currentTechId: null, progress: 0, completed: [] };
  if (!G.research.currentTechId) return;

  const currentTech = TECH_TREE.find(t => t.id === G.research.currentTechId);
  if (!currentTech) return;

  const dailyPoints = calcDailyScience();
  G.research.progress = (G.research.progress || 0) + dailyPoints;

  if (G.research.progress >= currentTech.cost) {
    // Technology Completed!
    if (!G.research.completed) G.research.completed = [];
    G.research.completed.push(currentTech.id);
    if (typeof currentTech.apply === 'function') {
      currentTech.apply(G);
    }
    G.research.currentTechId = null;
    G.research.progress = 0;

    eventBus.emit('toast', { text: `🎉 ИССЛЕДОВАНИЕ ЗАВЕРШЕНО: «${currentTech.name}»!`, style: 'toast-good' });
    eventBus.emit('log', `🔬 НАУКА: Технология «${currentTech.name}» успешно освоена колонией!`);
    eventBus.emit('sound', { type: 'good' });
    calcResourceRates();
    eventBus.emit('hud_update');
  }
}

export function startResearch(techId) {
  const tech = TECH_TREE.find(t => t.id === techId);
  if (!tech) return;
  if (isTechResearched(techId)) return;

  if (G.gameMode === 'democracy') {
    eventBus.emit('research_close');
    startCouncilVote(
      '🏛️ СОВЕТ: НАУЧНЫЙ ПРОЕКТ',
      `Колонисты обсуждают запуск исследований: «${tech.name}». Требуется: ${tech.cost} очков науки.`,
      `УТВЕРДИТЬ ПРОЕКТ`,
      `ВЫБРАТЬ ДРУГОЕ`,
      () => {
        G.research.currentTechId = tech.id;
        G.research.progress = 0;
        eventBus.emit('toast', { text: `🔬 Проект «${tech.name}» утвержден Советом!`, style: 'toast-good' });
        eventBus.emit('log', `🔬 НАУКА: Совет утвердил проект «${tech.name}». Исследования начаты.`);
        eventBus.emit('sound', { type: 'good' });
        eventBus.emit('hud_update');
      },
      () => {
        eventBus.emit('log', `🏛️ Совет отклонил запуск исследования «${tech.name}».`);
      }
    );
  } else if (G.gameMode === 'overseer') {
    G.research.currentTechId = tech.id;
    G.research.progress = 0;
    eventBus.emit('toast', { text: `👑 Комендант: начато исследование «${tech.name}»!`, style: 'toast-gold' });
    eventBus.emit('log', `👑 КОМЕНДАНТ: Назначен приоритет науки: «${tech.name}».`);
    eventBus.emit('sound', { type: 'good' });
    eventBus.emit('research_close');
    eventBus.emit('hud_update');
  } else {
    // Anarchy
    if (Math.random() < 0.6) {
      G.research.currentTechId = tech.id;
      G.research.progress = 0;
      eventBus.emit('toast', { text: `⚡ Анархия: колонисты занялись проектом «${tech.name}»!`, style: 'toast-gold' });
    } else {
      const unresearched = TECH_TREE.filter(t => !isTechResearched(t.id));
      if (unresearched.length > 0) {
        const rand = unresearched[Math.floor(Math.random() * unresearched.length)];
        G.research.currentTechId = rand.id;
        G.research.progress = 0;
        eventBus.emit('toast', { text: `⚡ Анархия: колонисты спонтанно выбрали «${rand.name}»!`, style: 'toast-bad' });
      }
    }
    eventBus.emit('research_close');
    eventBus.emit('hud_update');
  }
}
