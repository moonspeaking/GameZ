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
    closeResearchModal();
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
    closeResearchModal();
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
    closeResearchModal();
    eventBus.emit('hud_update');
  }
}

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
