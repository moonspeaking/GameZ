/**
 * Memorial System
 * - Records fallen colonists with name, role, day, cause, and epitaph
 * - Tracks colony incidents (fights, sabotage, desertion)
 * - Renders the memorial wall modal
 * Zero imports from render/* or ui/*
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';

// -------------------------------------------------
// EPITAPH GENERATORS
// -------------------------------------------------
const EPITAPHS = {
  starvation: [
    'Последним отдал свой паёк товарищам.',
    'Голод взял своё — но дух остался с нами.',
    'Прожил в бункере каждый день с достоинством.',
  ],
  dehydration: [
    'Мечтал о дожде и первой весне на поверхности.',
    'Последнюю воду отдал ребёнку.',
    'Жажда — не победа. Ты — наша память.',
  ],
  expedition: [
    'Вышел наружу ради нас. Не вернулся.',
    'Пустошь взяла своё, но колония выжила.',
    'Герой без имени в руинах города.',
  ],
  desertion: [
    'Сломлен, но не виноват. Бункер слишком давил.',
    'Ушёл один в ночь. Мы помним.',
    'Поверхность его приняла — мы молимся о нём.',
  ],
  disease: [
    'Боролся с лихорадкой до последнего часа.',
    'Нора не смогла его удержать. Нет таблеток — нет жизни.',
    'Вирус не щадит никого.',
  ],
  zombie: [
    'Принял первый удар, чтобы шлюз держался.',
    'Встретил орду лицом к лицу.',
    'Герой шахты.',
  ],
  wound: [
    'Получил рану на вылазке. Не выжил.',
    'Дрался до конца.',
    'Пал в бою, но не сдался.',
  ],
  default: [
    'Прожил каждый день под землёй с надеждой.',
    'Колония помнит.',
    'Один из нас.',
  ],
};

function pickEpitaph(cause) {
  const key = cause?.toLowerCase().includes('голод')      ? 'starvation'
            : cause?.toLowerCase().includes('вод')        ? 'dehydration'
            : cause?.toLowerCase().includes('вылазк')     ? 'expedition'
            : cause?.toLowerCase().includes('дезертир')   ? 'desertion'
            : cause?.toLowerCase().includes('боле')       ? 'disease'
            : cause?.toLowerCase().includes('зомби')      ? 'zombie'
            : cause?.toLowerCase().includes('ран')        ? 'wound'
            : 'default';
  const pool = EPITAPHS[key] || EPITAPHS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// -------------------------------------------------
// Ensure G.memorial is initialized
// -------------------------------------------------
export function ensureMemorial() {
  if (!G.memorial) G.memorial = { fallen: [], incidents: [] };
  if (!G.memorial.fallen) G.memorial.fallen = [];
  if (!G.memorial.incidents) G.memorial.incidents = [];
}

// -------------------------------------------------
// Kill a colonist and record them to the memorial
// Called from morale.js (incidents) and loop.js (deaths)
// -------------------------------------------------
export function killColonist(colonistId, cause, day) {
  ensureMemorial();
  const c = G.colonists.find(cc => cc.id === colonistId);
  if (!c || c.status === 'dead') return;

  c.status = 'dead';
  G.mechanics.totalDeaths = (G.mechanics.totalDeaths || 0) + 1;

  const record = {
    id: c.id,
    name: c.name,
    role: c.role,
    icon: c.icon || '👤',
    age: c.age,
    day: day || G.day,
    cause: cause || 'Неизвестно',
    epitaph: pickEpitaph(cause),
    daysSurvived: (day || G.day) - 1,
  };

  G.memorial.fallen.push(record);

  eventBus.emit('log', `⚰ МЕМОРИАЛ: ${c.name} (${c.role}) — ${cause}`);
  eventBus.emit('sound', { type: 'bad' });
  eventBus.emit('hud_update');

  return record;
}

// -------------------------------------------------
// Patch loop.js death paths to use killColonist
// Called by loop once per game to wire events
// -------------------------------------------------
export function patchDeathEvents() {
  // Listen for colonist-death events emitted by loop
  eventBus.on('colonist:death', ({ id, cause, day }) => {
    killColonist(id, cause, day);
  });
}
