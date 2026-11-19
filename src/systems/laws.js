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
    eventBus.emit('laws_changed');
    calcResourceRates();
    eventBus.emit('hud_update');
  } else {
    // Democracy: propose to Council
    eventBus.emit('whiteboard_close');
    startCouncilVote(
      '🏛️ СОВЕТ: ПЕРЕСМОТР ЗАКОНА',
      `Предложено изменить закон «${lawKey}» на новое значение: «${newVal}».`,
      `ПРИНЯТЬ НОВЫЙ ЗАКОН`,
      `ОСТАВИТЬ БЕЗ ИЗМЕНЕНИЙ`,
      () => {
        if (!G.laws) G.laws = {};
        G.laws[lawKey] = newVal;
        eventBus.emit('laws_changed');
        calcResourceRates();
        eventBus.emit('hud_update');
      },
      () => {
        eventBus.emit('log', `🏛️ Совет оставил директиву «${lawKey}» без изменений.`);
      }
    );
  }
}
