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
function ensureMemorial() {
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

// -------------------------------------------------
// MEMORIAL MODAL RENDER
// -------------------------------------------------
export function openMemorialModal() {
  ensureMemorial();
  renderMemorialModal();
  const m = document.getElementById('memorial-modal');
  if (m) m.style.display = 'flex';
}

export function closeMemorialModal() {
  const m = document.getElementById('memorial-modal');
  if (m) m.style.display = 'none';
}

export function renderMemorialModal() {
  const container = document.getElementById('memorial-content');
  if (!container) return;
  ensureMemorial();

  const fallen = G.memorial.fallen;
  const incidents = G.memorial.incidents || [];
  const totalDeaths = fallen.length;
  const totalDays = G.day;

  // Header stats
  const statsEl = document.getElementById('memorial-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#e74c3c;">${totalDeaths}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Погибших</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#f1c40f;">${G.colonists.filter(c => c.status === 'alive').length}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Выживших</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#38bdf8;">${totalDays}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Дней</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px; font-weight:bold; color:#2ecc71;">${G.mechanics.totalBorn || 0}</div>
          <div style="font-size:10px; color:#888; text-transform:uppercase;">Рождённых</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = '';

  if (fallen.length === 0 && incidents.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:#666;">
        <div style="font-size:36px; margin-bottom:12px;">🕊</div>
        <div style="font-size:14px;">Никто не погиб. Колония держится.</div>
        <div style="font-size:11px; color:#444; margin-top:6px;">Пусть так будет всегда.</div>
      </div>
    `;
    return;
  }

  // ---- FALLEN COLONISTS ----
  if (fallen.length > 0) {
    const header = document.createElement('div');
    header.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #2a2a2a;';
    header.textContent = '⚰ ПАВШИЕ';
    container.appendChild(header);

    fallen.slice().reverse().forEach(r => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #100f0d;
        border: 1px solid #2c2a24;
        border-left: 3px solid #8b1a1a;
        border-radius: 4px;
        padding: 10px 14px;
        margin-bottom: 8px;
        position: relative;
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:22px; filter:grayscale(1) opacity(0.7);">${r.icon}</span>
            <div>
              <div style="font-weight:bold; font-size:14px; color:#cfbfad;">
                ${r.name}
                <span style="font-size:11px; color:#666; font-weight:normal;"> · ${r.role}</span>
              </div>
              <div style="font-size:11px; color:#8b1a1a; margin-top:1px;">☠ ${r.cause}</div>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:10px;">
            <div style="font-size:11px; color:#666;">ДЕНЬ ${r.day}</div>
            <div style="font-size:10px; color:#555;">${r.daysSurvived} дн. в бункере</div>
          </div>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#7a6a5a; font-style:italic; border-top:1px solid #1a1a1a; padding-top:6px;">
          «${r.epitaph}»
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ---- INCIDENTS LOG ----
  if (incidents.length > 0) {
    const incHeader = document.createElement('div');
    incHeader.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:2px; margin:16px 0 8px; padding-bottom:6px; border-bottom:1px solid #2a2a2a;';
    incHeader.textContent = '⚡ ИНЦИДЕНТЫ';
    container.appendChild(incHeader);

    incidents.slice(-15).reverse().forEach(inc => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; margin-bottom: 4px;
        background: #12120f; border-radius: 3px;
        font-size: 11px; color: #8d7b6a;
        border-left: 2px solid #5c3d2e;
      `;
      row.innerHTML = `
        <span>${inc.name} — ${inc.type}</span>
        <span style="color:#555;">День ${inc.day}</span>
      `;
      container.appendChild(row);
    });
  }
}
