import { G } from '../core/state.js';
import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED, PROLOGUE } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { viewport } from '../core/viewport.js';
import { GAME_DEFAULT_ZOOM, centerOn } from '../core/camera.js';

// Story UI is rendered by ui/story_view.js; this module only emits semantic events.
function setLabel(key, text) {
  eventBus.emit('story_label', { key, text });
}

function showInset(id) {
  eventBus.emit('story_inset', { id });
}

function showJournal(day, body, sig) {
  eventBus.emit('story_journal', { day, body, sig });
}

function setBreachOverlay(active) {
  eventBus.emit('breach_overlay', { active });
}

export function hideAllStoryInsets() {
  eventBus.emit('story_insets_reset');
}

export function setDialogue(avatar, name, text) {
  eventBus.emit('story_dialogue', { avatar, name, text });
}

export function startPrologue() {
  G.state = 'prologue';
  G.prologue.t = 0;
  G.prologue.soundHorde = false;
  G.prologue.soundSlam = false;
  G.prologue.soundOpen = false;
  G.shake = 0;
  G.cam.x = 0;
  G.cam.y = 0;
  G.cam.zoom = 1;
  hideAllStoryInsets();
  setBreachOverlay(false);

  eventBus.emit('canvas_resize');
  eventBus.emit('hud_update');
}

export function updatePrologue(dt) {
  G.prologue.t += dt;
  const t = G.prologue.t;
  const hatchX = G.prologue.hatchX;
  const W = viewport.w;
  const H = viewport.h;
  const surfaceCamY = Math.max(0, SURFACE_Y * CELL_SIZE - H * 0.62);

  if (!G.prologue.soundHorde) {
    G.prologue.soundHorde = true;
    eventBus.emit('sound', { type: 'horde_roar' });
  }
  if (t >= PROLOGUE.openStart && !G.prologue.soundOpen) {
    G.prologue.soundOpen = true;
    eventBus.emit('sound', { type: 'metal_clang' });
  }
  if (t >= PROLOGUE.closeEnd && !G.prologue.soundSlam) {
    G.prologue.soundSlam = true;
    eventBus.emit('sound', { type: 'metal_clang' });
    eventBus.emit('sound', { type: 'horde_roar' });
  }

  // Camera: follow the runners along the street, close in on the hatch to show the climb down,
  // then drop into the bunker.
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = v => v * v * (3 - 2 * v);
  const skyY = SURFACE_Y * CELL_SIZE;
  const run = clamp01(t / PROLOGUE.arrive.RAY);
  const leadX = 80 + run * (hatchX - 80);
  const followCx = leadX + W * (1 / 6 - run / 6);
  const followCy = surfaceCamY + H / 2;
  const hatchCx = hatchX + 33, hatchCy = skyY + 55;
  const zIn = smooth(clamp01((t - PROLOGUE.zoomStart) / 2500));
  let cx = followCx + (hatchCx - followCx) * zIn;
  let cy = followCy + (hatchCy - followCy) * zIn;
  let zoom = 1 + 0.55 * zIn;
  if (t >= PROLOGUE.pan) {
    const k = smooth(clamp01((t - PROLOGUE.pan) / 2500));
    cy = hatchCy + (((SURFACE_Y + 4) * CELL_SIZE + 60) - hatchCy) * k;
    zoom = 1.55 - 0.55 * k;
    cx = hatchCx;
  }
  G.cam.zoom = zoom;
  G.cam.x = cx - W / zoom / 2;
  G.cam.y = cy - H / zoom / 2;

  if (t >= PROLOGUE.end) {
    finishPrologue();
  }
}

export function finishPrologue() {
  G.state = 'game';
  eventBus.emit('canvas_resize');
  const hatchCol = Math.floor(MAP_COLS / 2);
  G.cam.zoom = GAME_DEFAULT_ZOOM;
  // Centre on the hatch, with the surface line near the top of the screen
  centerOn((hatchCol + 1) * CELL_SIZE, SURFACE_Y * CELL_SIZE + viewport.h / GAME_DEFAULT_ZOOM * 0.3);
  showInset('journal-note');
  eventBus.emit('hud_update');
  eventBus.emit('log', 'Д1 ЧЕТВЕРО НЕЗНАКОМЦЕВ ДОБРАЛИСЬ ДО СТАРОГО УБЕЖИЩА');
  eventBus.emit('sound', { type: 'good' });
}

export function populateFullMetropolis() {
  const hatchCol = Math.floor(MAP_COLS / 2);
  // Wide layout: two rooms per side on most tiers, joined to the shaft by long galleries (see getCorridors)
  const h = hatchCol;
  const T = (n) => SURFACE_Y + n;
  G.rooms = [
    // Tier 1 (-15m)
    { id: 'shelter_main', type: 'bunker', name: 'УБЕЖИЩЕ №4', x: h - 6, y: T(4), w: 12, h: 4 },
    { id: 'latrine_1', type: 'waterPump', name: 'ВОДЯНОЙ ФИЛЬТР', x: h - 20, y: T(4), w: 6, h: 4 },
    { id: 'bunks_founders', type: 'bunker', name: 'КАЮТЫ ОСНОВАТЕЛЕЙ', x: h + 14, y: T(4), w: 8, h: 4 },

    // Tier 2 (-25m)
    { id: 'cold_store', type: 'kitchen', name: 'ХОЛОДИЛЬНЫЙ СКЛАД', x: h - 29, y: T(9), w: 7, h: 4 },
    { id: 'farm_roots', type: 'farm', name: 'ГРИБНЫЕ КОРНИ', x: h - 17, y: T(9), w: 10, h: 4 },
    { id: 'kitchen_mess', type: 'bunker', name: 'ОБЩАЯ СТОЛОВАЯ', x: h + 7, y: T(9), w: 10, h: 4 },
    { id: 'water_tanks', type: 'waterPump', name: 'ЦИСТЕРНЫ С ВОДОЙ', x: h + 22, y: T(9), w: 8, h: 4 },

    // Tier 3 (-38m)
    { id: 'dorm_b', type: 'quarters', name: 'ОБЩЕЖИТИЕ Б', x: h - 31, y: T(15), w: 10, h: 4 },
    { id: 'dorm_upper', type: 'bunker', name: 'ОБЩЕЖИТИЕ А', x: h - 17, y: T(15), w: 13, h: 4 },
    { id: 'school_hall', type: 'school', name: 'ПОДЗЕМНАЯ ШКОЛА', x: h + 6, y: T(15), w: 8, h: 4 },
    { id: 'clinic_nora', type: 'infirmary', name: 'ЛАЗАРЕТ (НОРА)', x: h + 18, y: T(15), w: 6, h: 4 },

    // Tier 4 (-50m)
    { id: 'forge', type: 'workshop', name: 'КУЗНИЦА', x: h - 30, y: T(21), w: 9, h: 4 },
    { id: 'workshop_ray', type: 'bunker', name: 'МАСТЕРСКАЯ РЭЯ', x: h - 17, y: T(21), w: 12, h: 4 },
    { id: 'armory_marcus', type: 'bunker', name: 'АРСЕНАЛ И ОХРАНА', x: h + 6, y: T(21), w: 10, h: 4 },
    { id: 'range', type: 'armory', name: 'ТИР', x: h + 21, y: T(21), w: 9, h: 4 },

    // Tier 5 (-65m)
    { id: 'motor_pool', type: 'generator', name: 'АВТОПАРК', x: h - 30, y: T(28), w: 8, h: 4 },
    { id: 'subway_depot', type: 'bunker', name: 'ДЕПО МЕТРО', x: h - 19, y: T(28), w: 14, h: 4 },
    { id: 'hydro_uv', type: 'farm', name: 'УФ-ГИДРОПОНИКА', x: h + 6, y: T(28), w: 12, h: 4 },
    { id: 'seed_vault', type: 'farm', name: 'ХРАНИЛИЩЕ СЕМЯН', x: h + 22, y: T(28), w: 8, h: 4 },

    // Tier 6 (-78m)
    { id: 'hydro_pump', type: 'waterPump', name: 'ГИДРОТУРБИНЫ', x: h - 14, y: 43, w: 9, h: 4 },
    { id: 'radio_room', type: 'bunker', name: 'РАДИОРУБКА', x: h + 6, y: 43, w: 8, h: 4 },
    { id: 'server_room', type: 'workshop', name: 'СЕРВЕРНАЯ', x: h + 19, y: 43, w: 7, h: 4 },

    // Tier 7 (-95m)
    { id: 'vault_zero', type: 'bunker', name: 'ВРАТА БУНКЕРА НОЛЬ', x: h - 6, y: 52, w: 12, h: 4 }
  ];

  for (let r = SURFACE_Y + 1; r <= 56; r++) {
    if (G.grid[r]) {
      G.grid[r][hatchCol] = C_EXCAVATED;
      G.grid[r][hatchCol + 1] = C_EXCAVATED;
    }
  }
  G.rooms.forEach(rm => {
    for (let dy = 0; dy < rm.h; dy++) {
      for (let dx = 0; dx < rm.w; dx++) {
        if (rm.y + dy < MAP_ROWS && rm.x + dx < MAP_COLS && rm.x + dx >= 0 && G.grid[rm.y + dy]) {
          G.grid[rm.y + dy][rm.x + dx] = C_EXCAVATED;
        }
      }
    }
  });
}

export function applyChapter1() {
  G.activeChapterId = 'ch1';
  G.day = 1;
  G.populationOverride = 4;
  G.res.food = 90;
  G.res.water = 150;
  G.res.power = 100;
  G.res.fuel = 244;
  G.res.med = 10;
  G.res.ammo = 74;
  G.hasDirtMound = false;
  G.isWinterSnow = false;
  G.elevator.unlocked = false;
  G.redAlert = false;
  setBreachOverlay(false);

  const hatchCol = Math.floor(MAP_COLS / 2);
  G.rooms = [
    { id: 'shelter_main', type: 'bunker', name: 'УБЕЖИЩЕ №4', x: hatchCol - 5, y: SURFACE_Y + 4, w: 12, h: 4 }
  ];

  G.colonists = [
    { id: 'ray', name: 'РЭЙ', age: 41, role: 'ELEC', color: '#3498db', icon: '⚡', hp: 100, x: (hatchCol - 3.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'nora', name: 'НОРА', age: 34, role: 'MED', color: '#2ecc71', icon: '💉', hp: 100, x: (hatchCol - 1.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'walt', name: 'УОЛТ', age: 47, role: 'ENG', color: '#f39c12', icon: '⛏️', hp: 100, x: (hatchCol + 1.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'eli', name: 'ЭЛАЙ', age: 19, role: 'SCOUT', color: '#e74c3c', icon: '🎒', hp: 100, x: (hatchCol + 3.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' }
  ];

  hideAllStoryInsets();
  showJournal('День 1', '«Бетонная комната, рассчитанная на двадцать человек. Нас четверо. Мы даже не знаем фамилий друг друга.»', '— НОРА');

  setDialogue('⚡', 'РЭЙ', 'Рэй. Электрик. Генератор работает. У нас есть свет.');
  finishPrologue();
  eventBus.emit('hud_update');
}

export function applyChapter2() {
  applyChapter1();
  G.activeChapterId = 'ch2';
  G.day = 87;
  G.populationOverride = 4;
  const hatchCol = Math.floor(MAP_COLS / 2);
  if (!G.rooms.some(r => r.id === 'farm_roots')) {
    G.rooms.push({ id: 'farm_roots', type: 'farm', name: 'ГРИБЫ', x: hatchCol - 16, y: SURFACE_Y + 4, w: 7, h: 4 });
  }
  setLabel('constName', 'ГРИБЫ [69%]');
  setLabel('dayText', 'ДЕНЬ 87');
  setLabel('dayPill', '⏱ ДЕНЬ 87 · КОРНИ И СПОРЫ');
  setDialogue('🎒', 'ЭЛАЙ', 'Корни берёзы пробили потолок. На сырой земле растут грибы!');
  eventBus.emit('log', 'Д86 ЭЛАЙ ОТПРАВИЛСЯ НАВЕРХ ЗА ЕДОЙ');
  eventBus.emit('hud_update');
}

export function applyChapter3() {
  applyChapter2();
  G.activeChapterId = 'ch3';
  G.day = 761;
  G.populationOverride = 7;
  G.hasDirtMound = true;
  hideAllStoryInsets();
  showJournal('День 761', '«На рассвете постучали в люк. Голоса. Много голосов.»', '— НОРА');

  setDialogue('🛡️', 'МАРКУС', 'С нами ребёнок. И чертежи гидропоники. Пожалуйста, впустите нас.');
  setLabel('dayPill', '⏱ ДЕНЬ 761 · ЧУЖАКИ У ЛЮКА');

  G.colonists.push({ id: 'marcus', name: 'МАРКУС', age: 46, role: 'GUARD', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' });
  G.colonists.push({ id: 'sarah', name: 'САРА', age: 40, role: 'FARM', color: '#8e44ad', icon: '🌾', hp: 100, x: 0, y: 0, status: 'alive' });
  G.colonists.push({ id: 'toby', name: 'ТОБИ', age: 7, role: 'CHILD', color: '#f39c12', icon: '🎒', hp: 100, x: 0, y: 0, status: 'alive' });
  eventBus.emit('log', 'ГОД 3: БЕЖЕНЦЫ ПРИНЯТЫ В КОЛОНИЮ');
  eventBus.emit('hud_update');
}

export function applyChapter4() {
  applyChapter2();
  G.activeChapterId = 'ch4';
  G.day = 1160;
  G.populationOverride = 12;
  G.hasDirtMound = true;
  const hatchCol = Math.floor(MAP_COLS / 2);
  for (let r = SURFACE_Y + 5; r <= 46; r++) {
    if (G.grid[r]) {
      G.grid[r][hatchCol] = C_EXCAVATED;
      G.grid[r][hatchCol + 1] = C_EXCAVATED;
    }
  }
  if (!G.rooms.some(r => r.id === 'hydro_pump')) {
    G.rooms.push({ id: 'hydro_pump', type: 'waterPump', name: 'ГИДРОТУРБИНЫ', x: hatchCol - 14, y: 43, w: 7, h: 4 });
  }
  G.res.water = 200;
  G.res.power = 100;
  setDialogue('⛏️', 'УОЛТ', 'Ночь, когда зажглись все огни! Подземная река даёт бесконечную энергию.');
  setLabel('dayPill', '⏱ ДЕНЬ 1160 · ГЛУБОКАЯ РЕКА');
  eventBus.emit('log', 'ГОД 4: ДОСТИГНУТА ГЛУБОКАЯ РЕКА. ТУРБИНЫ ЗАПУЩЕНЫ');
  eventBus.emit('hud_update');
}

export function applyChapter5() {
  applyChapter4();
  G.activeChapterId = 'ch5';
  G.day = 2952;
  G.populationOverride = 146;
  hideAllStoryInsets();
  showInset('whiteboard-inset');
  showInset('ration-card-inset');

  const hatchCol = Math.floor(MAP_COLS / 2);
  G.rooms.push({ id: 'school_hall', type: 'bunker', name: 'ПОДЗЕМНАЯ ШКОЛА', x: hatchCol + 8, y: SURFACE_Y + 14, w: 8, h: 4 });
  G.rooms.push({ id: 'clinic_nora', type: 'bunker', name: 'ЛАЗАРЕТ (НОРА)', x: hatchCol - 15, y: SURFACE_Y + 14, w: 7, h: 4 });

  const walt = G.colonists.find(c => c.id === 'walt');
  if (walt) walt.status = 'dead';

  G.colonists = [
    { id: 'ray', name: 'РЭЙ', age: 49, role: 'TECH', color: '#3498db', icon: '⚡', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'nora', name: 'НОРА', age: 44, role: 'MED', color: '#2ecc71', icon: '💉', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'walt', name: 'УОЛТ', age: 47, role: 'ENG', color: '#7f8c8d', icon: '⛏️', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'eli', name: 'ЭЛАЙ', age: 27, role: 'SCOUT', color: '#e74c3c', icon: '🎒', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'lily', name: 'ЛИЛИ', age: 6, role: 'CHILD', color: '#f1c40f', icon: '👶', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'marcus', name: 'МАРКУС', age: 52, role: 'GUARD', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'toby', name: 'ТОБИ', age: 13, role: 'STUDENT', color: '#f39c12', icon: '📖', hp: 100, x: 0, y: 0, status: 'alive' }
  ];

  setDialogue('💉', 'НОРА', '48 часов карантина для новеньких. Нет работы — нет добавки. Таковы правила.');
  setLabel('dayPill', '⏱ ДЕНЬ 2952 · ПРАВИЛА И РАЦИОНЫ');
  setLabel('constName', 'ШКОЛА [91%]');
  eventBus.emit('log', 'ГОД 9: ПРАВИЛА НА БЕЛОЙ ДОСКЕ УТВЕРЖДЕНЫ. ВЫДАНЫ КАРТОЧКИ РАЦИОНА');
  eventBus.emit('hud_update');
}

export function applyChapter6() {
  applyChapter4();
  G.activeChapterId = 'ch6';
  G.day = 4596;
  G.populationOverride = 210;
  hideAllStoryInsets();
  showInset('council-vote-inset');
  G.redAlert = true;
  setBreachOverlay(true);
  eventBus.emit('sound', { type: 'siren' });
  G.shake = 18;

  setDialogue('🛡️', 'МАРКУС', 'Прорыв в восточном туннеле! Орда прошла через старое метро!');
  setLabel('dayPill', '⏱ ДЕНЬ 4596 · ПРОРЫВ');
  eventBus.emit('log', 'ГОД 13: ПРОРЫВ В ВЕРХНЕЙ ШАХТЕ! КРАСНАЯ ТРЕВОГА!');
  eventBus.emit('hud_update');
}

export function applyChapter7() {
  applyChapter4();
  G.activeChapterId = 'ch7';
  G.day = 5101;
  G.populationOverride = 168;
  hideAllStoryInsets();
  showInset('radio-broadcast-inset');
  G.elevator.unlocked = true;
  const eli = G.colonists.find(c => c.id === 'eli');
  if (eli) eli.status = 'dead';
  eventBus.emit('sound', { type: 'elevator_hum' });

  setDialogue('📻', 'МАРКУС', 'Совет приостановлен. Пока город не станет безопасным, правит Совет безопасности.');
  setLabel('dayPill', '⏱ ДЕНЬ 5101 · ДВА ГОРОДА');
  eventBus.emit('log', 'ГОД 14: ГОРОД РАЗДЕЛИЛСЯ НА ДВА. ЛИФТ ЗАПУЩЕН');
  eventBus.emit('hud_update');
}

export function applyChapter8() {
  finishPrologue();
  populateFullMetropolis();
  G.activeChapterId = 'ch8';
  G.day = 10657;
  G.populationOverride = 473;
  G.hasDirtMound = true;
  G.isWinterSnow = true;
  G.elevator.unlocked = true;
  G.redAlert = false;
  setBreachOverlay(false);

  hideAllStoryInsets();
  showJournal('День 10 657', '«Снег на поверхности. Мы видим его на камерах. Ни один из наших детей никогда не касался его.»', '— НОРА (СТАРЕЙШИНА)');

  G.colonists = [
    { id: 'ray', name: 'РЭЙ', age: 71, role: 'ELEC', color: '#7f8c8d', icon: '⚡', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'nora', name: 'НОРА', age: 65, role: 'ELDER', color: '#9b59b6', icon: '👵', hp: 95, x: 0, y: 0, status: 'alive' },
    { id: 'walt', name: 'УОЛТ', age: 47, role: 'ENG', color: '#7f8c8d', icon: '⛏️', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'eli', name: 'ЭЛАЙ', age: 31, role: 'SCOUT', color: '#7f8c8d', icon: '🎒', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'lily', name: 'ЛИЛИ', age: 27, role: 'TECH', color: '#3498db', icon: '🔧', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'marcus', name: 'МАРКУС', age: 68, role: 'OUTSIDE', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'toby', name: 'ТОБИ', age: 34, role: 'LEADER', color: '#f39c12', icon: '⭐', hp: 100, x: 0, y: 0, status: 'alive' }
  ];

  setDialogue('👵', 'НОРА (СТАРЕЙШИНА)', 'Год 30. Теперь нас 473. Мы вырубили целую цивилизацию в скальной породе.');
  setLabel('dayPill', '⏱ ДЕНЬ 10 657 · ПОДЗЕМНЫЙ ГОРОД (ГОД 30)');
  eventBus.emit('log', 'ГОД 30: 6-ЯРУСНЫЙ МЕГАПОЛИС, 473 ЖИТЕЛЯ');
  eventBus.emit('hud_update');
}

export function triggerVictory() {
  G.won = true;
  eventBus.emit('victory');
}

export function applyChapter9() {
  applyChapter8();
  G.activeChapterId = 'ch9';
  G.day = 365 * 30 + 10;
  centerOn(G.cam.x + viewport.visibleW / (G.cam.zoom || 1) / 2, 48 * CELL_SIZE);

  eventBus.emit('modal:decision', {
    title: 'ФИНАЛ: ЧТО ТАИТСЯ ВНИЗУ (ГОД 30)',
    text: '30 ЛЕТ ВЫЖИВАНИЯ ПОД ЗЕМЛЕЙ. Бур наткнулся на титановые двери древнего Бункера Ноль. На табло загорелись зеленые сигналы связи с внешним миром!',
    b1: 'ПРИНЯТЬ ТРИУМФ 30 ЛЕТ',
    b2: 'СВОБОДНЫЙ РЕЖИМ',
    onAccept: () => triggerVictory(),
    onDecline: () => { eventBus.emit('log', 'СВОБОДНЫЙ РЕЖИМ ГОРОДА АКТИВИРОВАН'); }
  });
}

export const CHAPTERS = [
  { id: 'ch0', time: '0:00 · Пролог', title: 'Побег в шахту', desc: 'Орда зомби настигает четверых незнакомцев. Прыжок в старый люк заброшенной шахты.', act: () => startPrologue() },
  { id: 'ch1', time: '0:40 · Год 1', title: 'Запертый люк', desc: '4 выживших: Рэй, Нора, Уолт, Элай. 90 банок консервов. Ночное царапанье зомби в люк.', act: () => applyChapter1() },
  { id: 'ch2', time: '4:21 · Год 1', title: 'Корни', desc: 'Грибная ферма в корнях березы, сборка велогенератора, чистая вода из колодца.', act: () => applyChapter2() },
  { id: 'ch3', time: '7:51 · Год 3', title: 'Чужаки', desc: 'Моральный выбор: пустить семью беженцев с чертежами гидропоники или запереть вход.', act: () => applyChapter3() },
  { id: 'ch4', time: '11:21 · Год 4', title: 'Глубина', desc: 'Шахта пробита на 50 метров. Открытие подземной реки и ГЭС: «Ночь, когда зажглись все огни».', act: () => applyChapter4() },
  { id: 'ch5', time: '14:51 · Год 9', title: 'Правила', desc: 'Белая доска законов колонии: нормы пайков, комендантский час тишины, карантин Норы.', act: () => applyChapter5() },
  { id: 'ch6', time: '18:57 · Год 13', title: 'Прорыв', desc: 'Сирены, прорыв орды через верхний шлюз! Экстренное запирание бронешлюзов.', act: () => applyChapter6() },
  { id: 'ch7', time: '22:27 · Год 14', title: 'Два Города', desc: 'Верхний Оплот (оборона) и Нижний Город. Скоростной моторизованный лифт в стволе.', act: () => applyChapter7() },
  { id: 'ch8', time: '26:58 · Год 30', title: 'Подземный Город', desc: '6-ярусный мегаполис: УФ-гидропоника, школа, лазарет, 470+ жителей. Зима на поверхности.', act: () => applyChapter8() },
  { id: 'ch9', time: '30:18 · Год 30', title: 'Что таится внизу', desc: 'Бурение монолитного базальта открывает титановые двери древнего Бункера Ноль. Финал.', act: () => applyChapter9() }
];

export function sealBulkheads() {
  G.redAlert = false;
  setBreachOverlay(false);
  eventBus.emit('log', '🛡 Бронезаслонки запечатаны! Орда заблокирована в верхнем шлюзе.');
  eventBus.emit('toast', { text: '🛡 Бронезаслонки запечатаны! Внутренний город в безопасности.', style: 'toast-good' });
  eventBus.emit('sound', { type: 'metal_clang' });
  eventBus.emit('hud_update');
}

export function colonistsFightBreach() {
  G.redAlert = false;
  setBreachOverlay(false);

  if ((G.res.ammo || 0) >= 15) {
    G.res.ammo = Math.max(0, G.res.ammo - 15);
    G.mechanics.morale = Math.min(100, G.mechanics.morale + 8);
    eventBus.emit('log', '⚔ ОРДА РАЗБИТА В ТУННЕЛЕ! Часовые и ополченцы отстояли сектор (-15 патронов).');
    eventBus.emit('toast', { text: '⚔ Прорыв ликвидирован! Оборона выдержала.', style: 'toast-good' });
    eventBus.emit('sound', { type: 'good' });
  } else {
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 15);
    eventBus.emit('log', '🚨 Не хватило патронов! Отступили за внутренние гермоворота.');
    eventBus.emit('toast', { text: '🚨 Нехватка боеприпасов! Пришлось запереть сектор.', style: 'toast-bad' });
    eventBus.emit('sound', { type: 'bad' });
  }
  eventBus.emit('hud_update');
}

// Wire finish prologue from eventBus if requested
eventBus.on('prologue:finish', finishPrologue);

export function rotateDialogue(simDt) {
  G.dialogueTimer += simDt;
  if (G.dialogueTimer > 8000) {
    G.dialogueTimer = 0;
    G.dialogueIndex = (G.dialogueIndex + 1) % G.dialogues.length;
    const dlg = G.dialogues[G.dialogueIndex];
    eventBus.emit('story_dialogue', { avatar: dlg.icon, name: dlg.name, text: dlg.text, rotate: true });
  }
}
