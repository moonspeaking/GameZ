/**
 * Morale & Psychology System
 * - Individual colonist mood: 'hopeful' | 'stressed' | 'broken'
 * - Mood-driven thought bubbles rendered on canvas
 * - Incident triggers at low morale: fights, sabotage, desertion
 * - In Democracy: broken colonists vote No on everything
 * Zero imports from render/* or ui/*
 */
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { getTotalAlivePop } from '../entities/colonists.js';
import { killColonist } from './memorial.js';

// -------------------------------------------------
// MOOD THRESHOLDS
// -------------------------------------------------
export const MOOD = {
  HOPEFUL:  'hopeful',  // morale >= 60
  STRESSED: 'stressed', // morale 30–59
  BROKEN:   'broken'    // morale < 30
};

// Thought pool per mood and role
const THOUGHTS = {
  hopeful: [
    '«Мы справимся.»',
    '«Запасов хватает.»',
    '«Слышу музыку снизу!»',
    '«Скоро выберемся наверх.»',
    '«Колония крепнет.»',
    '«Есть немного лишней еды!»',
    '«Нора вылечила троих.»',
    '«Рэй починил генератор.»',
  ],
  stressed: [
    '«Когда это кончится...»',
    '«Еды всё меньше.»',
    '«Ночью орда выла у шлюза.»',
    '«Уже не помню солнца.»',
    '«Воды осталось мало.»',
    '«Как долго мы ещё продержимся?»',
    '«Бункер давит на психику.»',
    '«Не могу нормально спать.»',
  ],
  broken: [
    '«Больше не могу.»',
    '«Зачем всё это?»',
    '«Лучше бы я остался наверху.»',
    '«Мне нечем дышать.»',
    '«Я сломан.»',
    '«Не верю, что выберемся.»',
    '«Всё напрасно.»',
    '«Уйду — и не вернусь.»',
  ],
  // Role-specific overrides sprinkled in randomly
  role: {
    ELEC: ['«Генератор поёт ровно.»', '«Провода в норме.»', '«Нужна новая батарея.»'],
    MED:  ['«Запасы лекарств тают.»', '«Нужно больше бинтов.»', '«Все живы — и слава богу.»'],
    ENG:  ['«Порода здесь крепкая.»', '«Нашёл новый пласт.»', '«Крепь держит.»'],
    SCOUT:['«Там за углом — тишина.»', '«Выход чист.»', '«Орда ушла к востоку.»'],
    FARMER:['«Грибы взошли.»', '«Нужно больше ламп.»', '«Теплица держит тепло.»'],
    GUARD:['«Шлюз заперт.»', '«Ночью слышал шаги.»', '«Патронов мало.»'],
    TEACHER:['«Дети учатся хорошо.»', '«Знания — наш свет.»', '«Класс переполнен.»'],
    WORKER:['«Руки устали.»', '«Успеем.»', '«Инструменты целы.»'],
  }
};

// -------------------------------------------------
// Classify individual mood based on colony morale + personal HP
// -------------------------------------------------
export function calcColonistMood(colonist) {
  const baseMorale = G.mechanics.morale;
  const hpMod = colonist.hp < 40 ? -20 : colonist.hp < 70 ? -10 : 0;
  const sickMod = G.mechanics.sickColonists.includes(colonist.id) ? -15 : 0;
  // Lily (perk) buffers mood slightly
  const lilyPresent = G.colonists.some(c => c.id === 'lily' && c.status === 'alive');
  const lilyMod = lilyPresent ? 8 : 0;

  const effective = baseMorale + hpMod + sickMod + lilyMod;

  if (effective >= 60) return MOOD.HOPEFUL;
  if (effective >= 30) return MOOD.STRESSED;
  return MOOD.BROKEN;
}

// -------------------------------------------------
// Pick a contextual thought for a colonist
// -------------------------------------------------
export function pickThought(colonist) {
  const mood = colonist.mood || calcColonistMood(colonist);

  // 25% chance use role-specific thought
  const rolePool = THOUGHTS.role[colonist.role];
  if (rolePool && Math.random() < 0.25) {
    return rolePool[Math.floor(Math.random() * rolePool.length)];
  }
  const pool = THOUGHTS[mood] || THOUGHTS.stressed;
  return pool[Math.floor(Math.random() * pool.length)];
}

// -------------------------------------------------
// Daily mood refresh for all living colonists
// -------------------------------------------------
export function updateColonistMoods() {
  G.colonists.forEach(c => {
    if (c.status === 'dead') return;
    const newMood = calcColonistMood(c);
    if (c.mood !== newMood) {
      c.mood = newMood;
    }
    // Refresh thought every 5–10 days (stored in _nextThoughtDay)
    if (!c._nextThoughtDay || G.day >= c._nextThoughtDay) {
      c.thought = pickThought(c);
      c._nextThoughtDay = G.day + 5 + Math.floor(Math.random() * 6);
    }
  });
}

// -------------------------------------------------
// INCIDENTS — triggered when colony morale is low
// -------------------------------------------------
const INCIDENT_COOLDOWN = 15; // days between incidents
let _lastIncidentDay = 0;

export function checkMoraleIncidents() {
  if (G.mechanics.morale >= 35) return;
  if (G.day - _lastIncidentDay < INCIDENT_COOLDOWN) return;

  const alive = G.colonists.filter(c => c.status === 'alive');
  if (alive.length < 2) return;

  const roll = Math.random();

  if (roll < 0.33) {
    // --- FIGHT ---
    const a = alive[Math.floor(Math.random() * alive.length)];
    let b = alive[Math.floor(Math.random() * alive.length)];
    if (a.id === b.id) b = alive[(alive.indexOf(a) + 1) % alive.length];

    const dmg = 5 + Math.floor(Math.random() * 15);
    a.hp = Math.max(1, a.hp - dmg);
    b.hp = Math.max(1, b.hp - dmg);

    _lastIncidentDay = G.day;
    eventBus.emit('toast', {
      text: `⚔️ КОНФЛИКТ: ${a.name} и ${b.name} подрались в бараке! (-${dmg} HP каждому)`,
      style: 'toast-bad'
    });
    eventBus.emit('log', `⚔️ ИНЦИДЕНТ (День ${G.day}): ${a.name} и ${b.name} сцепились из-за пайков.`);
    eventBus.emit('sound', { type: 'bad' });
    addIncidentToMemorial(`${a.name} и ${b.name}`, 'Драка в бараке', G.day);

  } else if (roll < 0.60) {
    // --- SABOTAGE ---
    const matLoss = 10 + Math.floor(Math.random() * 20);
    const foodLoss = 5 + Math.floor(Math.random() * 15);
    G.res.materials = Math.max(0, (G.res.materials || 0) - matLoss);
    G.res.food = Math.max(0, (G.res.food || 0) - foodLoss);

    const perp = alive[Math.floor(Math.random() * alive.length)];
    _lastIncidentDay = G.day;
    eventBus.emit('toast', {
      text: `🔥 САБОТАЖ: ${perp.name} сорвался и повредил склад! (-${matLoss} 🪨 -${foodLoss} 🍞)`,
      style: 'toast-bad'
    });
    eventBus.emit('log', `🔥 ИНЦИДЕНТ (День ${G.day}): ${perp.name} устроил беспорядки на складе от отчаяния.`);
    eventBus.emit('sound', { type: 'bad' });
    G.shake = 6;
    addIncidentToMemorial(perp.name, 'Саботаж склада', G.day);

  } else if (roll < 0.80) {
    // --- DESERTION ---
    // Only non-core colonists can desert
    const deserter = alive.find(c => !['ray','nora','walt','eli'].includes(c.id));
    if (!deserter) return;

    _lastIncidentDay = G.day;
    eventBus.emit('toast', {
      text: `🚪 ДЕЗЕРТИРСТВО: ${deserter.name} бежал на поверхность в отчаянии!`,
      style: 'toast-bad'
    });
    eventBus.emit('log', `🚪 ИНЦИДЕНТ (День ${G.day}): ${deserter.name} (${deserter.role}) покинул колонию.`);
    eventBus.emit('sound', { type: 'bad' });
    G.shake = 4;

    // Mark them gone — record to memorial
    killColonist(deserter.id, 'Дезертировал на поверхность', G.day);

  } else {
    // --- BREAKDOWN: collective morale spiral ---
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 8);
    _lastIncidentDay = G.day;
    eventBus.emit('toast', {
      text: `😰 ПАНИКА: Всколыхнулась волна коллективной депрессии! (-8 Мораль)`,
      style: 'toast-bad'
    });
    eventBus.emit('log', `😰 ИНЦИДЕНТ (День ${G.day}): Психологический кризис в колонии.`);
    eventBus.emit('sound', { type: 'bad' });
  }

  eventBus.emit('hud_update');
}

// -------------------------------------------------
// Store incident in memorial log (non-death)
// -------------------------------------------------
function addIncidentToMemorial(name, type, day) {
  if (!G.memorial) G.memorial = { fallen: [], incidents: [] };
  if (!G.memorial.incidents) G.memorial.incidents = [];
  G.memorial.incidents.push({ name, type, day });
  if (G.memorial.incidents.length > 50) G.memorial.incidents.shift();
}

// -------------------------------------------------
// Democracy: broken colonists force-vote NO
// Used by democracy.js when tallying council votes
// -------------------------------------------------
export function countBrokenColonists() {
  return G.colonists.filter(c =>
    c.status === 'alive' && calcColonistMood(c) === MOOD.BROKEN
  ).length;
}

// -------------------------------------------------
// Convenience: get morale tier label & color
// -------------------------------------------------
export function getMoraleTierLabel(morale) {
  if (morale >= 80) return { label: 'ПРОЦВЕТАНИЕ', color: '#2ecc71' };
  if (morale >= 60) return { label: 'СТАБИЛЬНО', color: '#f1c40f' };
  if (morale >= 40) return { label: 'НАПРЯЖЕНИЕ', color: '#e67e22' };
  if (morale >= 20) return { label: 'КРИЗИС', color: '#e74c3c' };
  return { label: 'КОЛЛАПС', color: '#8e44ad' };
}
