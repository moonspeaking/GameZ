import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { calcResourceRates } from './resources.js';
import { startCouncilVote } from './democracy.js';

export const LAWS_CONFIG = [
  {
    key: 'rationing',
    title: '1. НОРМА ВЫДАЧИ ПАЙКОВ (FOOD RATIONING)',
    desc: 'Определяет суточный объем питания колонистов и уровень сытости.',
    options: [
      { val: 'strict', label: '🥖 Строгая экономия (0.7x еды, -5 мораль)' },
      { val: 'standard', label: '🍞 Стандартный паек (1.0x еды, норма)' },
      { val: 'abundant', label: '🍖 Усиленный паек (1.4x еды, +10 мораль)' }
    ]
  },
  {
    key: 'curfew',
    title: '2. КОМЕНДАНТСКИЙ ЧАС ТИШИНЫ (NIGHT SILENCE)',
    desc: 'Запрет на громкие работы с 22:00 до 06:00, чтобы не привлекать верхнюю орду зомби.',
    options: [
      { val: true, label: '🌙 Соблюдать тишину (+10 защита шлюза, ночью без строек)' },
      { val: false, label: '☀️ Круглосуточные работы (ночные стройки идут, риск шума)' }
    ]
  },
  {
    key: 'laborDuty',
    title: '3. ТРУДОВАЯ ПОВИННОСТЬ (LABOR DISCIPLINE)',
    desc: 'Режим рабочего дня для ускорения раскопок и строительства.',
    options: [
      { val: 'voluntary', label: '🛠️ Добровольный труд (стабильная мораль)' },
      { val: 'mandatory', label: '⛏️ Обязательная повинность (+35% скорости, -мораль)' }
    ]
  },
  {
    key: 'quarantine',
    title: '4. КАРАНТИННЫЙ ПРОТОКОЛ НОРЫ (QUARANTINE PROTOCOL)',
    desc: 'Правила допуска новых беженцев и изоляции раненых в лазарете.',
    options: [
      { val: 'strict', label: '☣️ 48ч изоляция (0% риска занести инфекцию в бункер)' },
      { val: 'open', label: '🚪 Открытые двери (быстрое заселение, но 20% шанс заражения)' }
    ]
  },
  {
    key: 'childSchool',
    title: '5. ОБРАЗОВАНИЕ «ДЕТИ ЗЕМЛИ» (EDUCATION OF CHILDREN)',
    desc: 'Обязательное обучение детей колонии в подземной школе.',
    options: [
      { val: true, label: '📚 Обязательная школа (+мораль родителям, подготовка профессий)' },
      { val: false, label: '🎒 Помощь в штольнях (дети собирают камень, но без школы)' }
    ]
  }
];

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

export function handleLawClick(lawKey, newVal) {
  if (G.gameMode === 'anarchy') {
    eventBus.emit('toast', { text: '⚡ В режиме анархии законы отвергаются колонистами!', style: 'toast-bad' });
    eventBus.emit('sound', { type: 'bad' });
    return;
  }

  if (G.laws && G.laws[lawKey] === newVal) return;

  if (G.gameMode === 'overseer') {
    if (!G.laws) G.laws = {};
    G.laws[lawKey] = newVal;
    eventBus.emit('toast', { text: '👑 Декрет Коменданта: закон изменён!', style: 'toast-gold' });
    eventBus.emit('sound', { type: 'tone', freq: 400, dur: 0.15, wave: 'triangle', vol: 0.25 });
    eventBus.emit('log', `👑 КОМЕНДАНТ: Издан указ об изменении директивы «${lawKey}» на «${newVal}».`);
    renderWhiteboardLaws();
    calcResourceRates();
    eventBus.emit('hud_update');
  } else {
    // Democracy: propose to Council
    closeWhiteboardModal();
    startCouncilVote(
      '🏛️ СОВЕТ: ПЕРЕСМОТР ЗАКОНА',
      `Предложено изменить закон «${lawKey}» на новое значение: «${newVal}».`,
      `ПРИНЯТЬ НОВЫЙ ЗАКОН`,
      `ОСТАВИТЬ БЕЗ ИЗМЕНЕНИЙ`,
      () => {
        if (!G.laws) G.laws = {};
        G.laws[lawKey] = newVal;
        renderWhiteboardLaws();
        calcResourceRates();
        eventBus.emit('hud_update');
      },
      () => {
        eventBus.emit('log', `🏛️ Совет оставил директиву «${lawKey}» без изменений.`);
      }
    );
  }
}
