import { G } from '../core/state.js';
import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';

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
  G.shake = 0;
  G.cam.x = 0;
  G.cam.y = 0;
  hideAllStoryInsets();
  setBreachOverlay(false);

  eventBus.emit('canvas_resize');
  eventBus.emit('sound', { type: 'horde_roar' });
}

export function updatePrologue(dt) {
  G.prologue.t += dt;
  const t = G.prologue.t;
  const hatchX = G.prologue.hatchX;
  const W = viewport.w;
  const H = viewport.h;
  const surfaceCamY = Math.max(0, SURFACE_Y * CELL_SIZE - H * 0.62);

  // Camera tracking centered on surface city streets
  if (t < 7500) {
    const leadX = 80 + (t / 7000) * (hatchX - 80);
    G.cam.x = leadX - W / 3;
    G.cam.y = surfaceCamY;
  } else if (t < 11000) {
    G.cam.x = hatchX - W / 2;
    G.cam.y = surfaceCamY;
    if (!G.prologue.soundSlam) {
      G.prologue.soundSlam = true;
      eventBus.emit('sound', { type: 'metal_clang' });
      eventBus.emit('sound', { type: 'horde_roar' });
      G.shake = 20;
    }
  } else {
    // Pan down into bunker
    const progress = Math.min(1, (t - 11000) / 2500);
    const startY = surfaceCamY;
    const targetY = (SURFACE_Y + 4) * CELL_SIZE - H / 2 + 60;
    G.cam.x = hatchX - W / 2;
    G.cam.y = startY + (targetY - startY) * progress;
  }

  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 0.03);

  if (t >= 14000) {
    finishPrologue();
  }
}

export function finishPrologue() {
  G.state = 'game';
  eventBus.emit('canvas_resize');
  const hatchCol = Math.floor(MAP_COLS / 2);
  const W = window.innerWidth || 1200;
  G.cam.x = (hatchCol + 1) * CELL_SIZE - W / 2;
  G.cam.y = 35;
  const jn = document.getElementById('journal-note');
  if (jn) jn.style.display = 'block';
  eventBus.emit('hud_update');
  eventBus.emit('log', 'D1 FOUR STRANGERS REACH THE OLD SHELTER');
  eventBus.emit('sound', { type: 'good' });
}

export function populateFullMetropolis() {
  const hatchCol = Math.floor(MAP_COLS / 2);
  G.rooms = [
    // Tier 1 (-15m)
    { id: 'shelter_main', type: 'bunker', name: 'SHELTER 4', x: hatchCol - 6, y: SURFACE_Y + 4, w: 12, h: 4 },
    { id: 'latrine_1', type: 'waterPump', name: 'WATER FILTER', x: hatchCol - 13, y: SURFACE_Y + 4, w: 6, h: 4 },
    { id: 'bunks_founders', type: 'bunker', name: 'FOUNDERS BUNK', x: hatchCol + 7, y: SURFACE_Y + 4, w: 8, h: 4 },

    // Tier 2 (-25m)
    { id: 'farm_roots', type: 'farm', name: 'MUSHROOM ROOTS', x: hatchCol - 12, y: SURFACE_Y + 9, w: 10, h: 4 },
    { id: 'kitchen_mess', type: 'bunker', name: 'CENTRAL MESS', x: hatchCol + 3, y: SURFACE_Y + 9, w: 10, h: 4 },

    // Tier 3 (-38m)
    { id: 'dorm_upper', type: 'bunker', name: 'DORMITORY A', x: hatchCol - 15, y: SURFACE_Y + 15, w: 13, h: 4 },
    { id: 'school_hall', type: 'bunker', name: 'BELOW SCHOOL', x: hatchCol + 3, y: SURFACE_Y + 15, w: 8, h: 4 },
    { id: 'clinic_nora', type: 'bunker', name: 'CLINIC (NORA)', x: hatchCol + 12, y: SURFACE_Y + 15, w: 6, h: 4 },

    // Tier 4 (-50m)
    { id: 'workshop_ray', type: 'bunker', name: 'RAY WORKSHOP', x: hatchCol - 14, y: SURFACE_Y + 21, w: 12, h: 4 },
    { id: 'armory_marcus', type: 'bunker', name: 'ARMORY & GUARD', x: hatchCol + 3, y: SURFACE_Y + 21, w: 10, h: 4 },

    // Tier 5 (-65m)
    { id: 'subway_depot', type: 'bunker', name: 'SUBWAY DEPOT', x: hatchCol - 16, y: SURFACE_Y + 28, w: 14, h: 4 },
    { id: 'hydro_uv', type: 'farm', name: 'UV HYDROPONICS', x: hatchCol + 3, y: SURFACE_Y + 28, w: 12, h: 4 },

    // Tier 6 (-78m)
    { id: 'hydro_pump', type: 'waterPump', name: 'HYDRO TURBINES', x: hatchCol - 10, y: 43, w: 9, h: 4 },
    { id: 'radio_room', type: 'bunker', name: 'RADIO ROOM', x: hatchCol + 3, y: 43, w: 8, h: 4 },

    // Tier 7 (-95m)
    { id: 'vault_zero', type: 'bunker', name: 'VAULT ZERO GATE', x: hatchCol - 6, y: 52, w: 12, h: 4 }
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
    { id: 'shelter_main', type: 'bunker', name: 'SHELTER 4', x: hatchCol - 5, y: SURFACE_Y + 4, w: 12, h: 4 }
  ];

  G.colonists = [
    { id: 'ray', name: 'RAY', age: 41, role: 'ELEC', color: '#3498db', icon: '⚡', hp: 100, x: (hatchCol - 3.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'nora', name: 'NORA', age: 34, role: 'MED', color: '#2ecc71', icon: '💉', hp: 100, x: (hatchCol - 1.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'walt', name: 'WALT', age: 47, role: 'ENG', color: '#f39c12', icon: '⛏️', hp: 100, x: (hatchCol + 1.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' },
    { id: 'eli', name: 'ELI', age: 19, role: 'SCOUT', color: '#e74c3c', icon: '🎒', hp: 100, x: (hatchCol + 3.5)*CELL_SIZE, y: (SURFACE_Y + 6.5)*CELL_SIZE, status: 'alive' }
  ];

  hideAllStoryInsets();
  showJournal('Day 1', '"A concrete room built for twenty. Four of us. We don\'t know each other\'s last names."', '- NORA');

  setDialogue('⚡', 'RAY', 'Ray. Electrician. The generator works. We have light.');
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
    G.rooms.push({ id: 'farm_roots', type: 'farm', name: 'MUSHROOMS', x: hatchCol - 10, y: SURFACE_Y + 5, w: 7, h: 4 });
  }
  setLabel('constName', 'MUSHROOMS [69%]');
  setLabel('dayText', 'DAY 87');
  setLabel('dayPill', '⏱ DAY 87 · ROOTS & SPORES');
  setDialogue('🎒', 'ELI', 'The birch roots broke through the ceiling. Mushrooms are growing on the damp soil!');
  eventBus.emit('log', 'D86 ELI GOES UP FOR FOOD');
  eventBus.emit('hud_update');
}

export function applyChapter3() {
  applyChapter2();
  G.activeChapterId = 'ch3';
  G.day = 761;
  G.populationOverride = 7;
  G.hasDirtMound = true;
  hideAllStoryInsets();
  showJournal('Day 761', '"Knocking on the hatch at dawn. Voices. Many of them."', '- NORA');

  setDialogue('🛡️', 'MARCUS', 'We have a child with us. And hydroponics blueprints. Please let us in.');
  setLabel('dayPill', '⏱ DAY 761 · STRANGERS AT THE HATCH');

  G.colonists.push({ id: 'marcus', name: 'MARCUS', age: 46, role: 'GUARD', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' });
  G.colonists.push({ id: 'sarah', name: 'SARAH', age: 40, role: 'FARM', color: '#8e44ad', icon: '🌾', hp: 100, x: 0, y: 0, status: 'alive' });
  G.colonists.push({ id: 'toby', name: 'TOBY', age: 7, role: 'CHILD', color: '#f39c12', icon: '🎒', hp: 100, x: 0, y: 0, status: 'alive' });
  eventBus.emit('log', 'YEAR 3: REFUGEES ACCEPTED INTO COLONY');
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
    G.rooms.push({ id: 'hydro_pump', type: 'waterPump', name: 'HYDRO TURBINES', x: hatchCol - 8, y: 43, w: 7, h: 4 });
  }
  G.res.water = 200;
  G.res.power = 100;
  setDialogue('⛏️', 'WALT', 'The night all the lights turned on! The underground river generates endless power.');
  setLabel('dayPill', '⏱ DAY 1160 · THE DEEP RIVER');
  eventBus.emit('log', 'YEAR 4: DEEP RIVER REACHED. POWER TURBINES ACTIVE');
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
  G.rooms.push({ id: 'school_hall', type: 'bunker', name: 'BELOW SCHOOL', x: hatchCol + 3, y: SURFACE_Y + 14, w: 8, h: 4 });
  G.rooms.push({ id: 'clinic_nora', type: 'bunker', name: 'CLINIC (NORA)', x: hatchCol - 12, y: SURFACE_Y + 14, w: 7, h: 4 });

  const walt = G.colonists.find(c => c.id === 'walt');
  if (walt) walt.status = 'dead';

  G.colonists = [
    { id: 'ray', name: 'RAY', age: 49, role: 'TECH', color: '#3498db', icon: '⚡', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'nora', name: 'NORA', age: 44, role: 'MED', color: '#2ecc71', icon: '💉', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'walt', name: 'WALT', age: 47, role: 'ENG', color: '#7f8c8d', icon: '⛏️', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'eli', name: 'ELI', age: 27, role: 'SCOUT', color: '#e74c3c', icon: '🎒', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'lily', name: 'LILY', age: 6, role: 'CHILD', color: '#f1c40f', icon: '👶', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'marcus', name: 'MARCUS', age: 52, role: 'GUARD', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'toby', name: 'TOBY', age: 13, role: 'STUDENT', color: '#f39c12', icon: '📖', hp: 100, x: 0, y: 0, status: 'alive' }
  ];

  setDialogue('💉', 'NORA', '48 hours of quarantine for newcomers. No work, no second bowl. Those are the rules.');
  setLabel('dayPill', '⏱ DAY 2952 · RULES & RATIONS');
  setLabel('constName', 'SCHOOL [91%]');
  eventBus.emit('log', 'YEAR 9: WHITEBOARD RULES RATIFIED. RATION CARDS ISSUED');
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

  setDialogue('🛡️', 'MARCUS', 'Breach in the eastern tunnel! The horde broke through the old subway!');
  setLabel('dayPill', '⏱ DAY 4596 · THE BREACH');
  eventBus.emit('log', 'YEAR 13: BREACH IN UPPER MINE! RED ALERT!');
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

  setDialogue('📻', 'MARCUS', 'The council is suspended. Until this city is safe, the Security Council governs.');
  setLabel('dayPill', '⏱ DAY 5101 · TWO CITIES');
  eventBus.emit('log', 'YEAR 14: TWO CITIES SPLIT. ELEVATOR ONLINE');
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
  showJournal('Day 10,657', '"Snow on the surface. We can see it on the cameras. None of our children have ever touched it."', '- NORA (ELDER)');

  G.colonists = [
    { id: 'ray', name: 'RAY', age: 71, role: 'ELEC', color: '#7f8c8d', icon: '⚡', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'nora', name: 'NORA', age: 65, role: 'ELDER', color: '#9b59b6', icon: '👵', hp: 95, x: 0, y: 0, status: 'alive' },
    { id: 'walt', name: 'WALT', age: 47, role: 'ENG', color: '#7f8c8d', icon: '⛏️', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'eli', name: 'ELI', age: 31, role: 'SCOUT', color: '#7f8c8d', icon: '🎒', hp: 0, x: 0, y: 0, status: 'dead' },
    { id: 'lily', name: 'LILY', age: 27, role: 'TECH', color: '#3498db', icon: '🔧', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'marcus', name: 'MARCUS', age: 68, role: 'OUTSIDE', color: '#1abc9c', icon: '🛡️', hp: 100, x: 0, y: 0, status: 'alive' },
    { id: 'toby', name: 'TOBY', age: 34, role: 'LEADER', color: '#f39c12', icon: '⭐', hp: 100, x: 0, y: 0, status: 'alive' }
  ];

  setDialogue('👵', 'NORA (ELDER)', 'Year 30. 473 of us now. We carved an entire civilization out of bedrock.');
  setLabel('dayPill', '⏱ DAY 10,657 · THE CITY BELOW (ГОД 30)');
  eventBus.emit('log', 'YEAR 30: 6-TIER METROPOLIS WITH 473 CITIZENS');
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
  const H = window.innerHeight || 700;
  G.cam.y = 48 * CELL_SIZE - H / 2;

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
  { id: 'ch0', time: '0:00 · Пролог', title: 'Побег в шахту (Cold Open)', desc: 'Орда зомби настигает четверых незнакомцев. Прыжок в старый люк заброшенной шахты.', act: () => startPrologue() },
  { id: 'ch1', time: '0:40 · Год 1', title: 'Запертый люк (The Hatch)', desc: '4 выживших: Рэй, Нора, Уолт, Элай. 90 банок консервов. Ночное царапанье зомби в люк.', act: () => applyChapter1() },
  { id: 'ch2', time: '4:21 · Год 1', title: 'Корни (Roots)', desc: 'Грибная ферма в корнях березы, сборка велогенератора, чистая вода из колодца.', act: () => applyChapter2() },
  { id: 'ch3', time: '7:51 · Год 3', title: 'Чужаки (Strangers)', desc: 'Моральный выбор: пустить семью беженцев с чертежами гидропоники или запереть вход.', act: () => applyChapter3() },
  { id: 'ch4', time: '11:21 · Год 4', title: 'Глубина (The Deep)', desc: 'Шахта пробита на 50 метров. Открытие подземной реки и ГЭС: «Ночь, когда зажглись все огни».', act: () => applyChapter4() },
  { id: 'ch5', time: '14:51 · Год 9', title: 'Правила (Rules)', desc: 'Белая доска законов колонии: нормы пайков, комендантский час тишины, карантин Норы.', act: () => applyChapter5() },
  { id: 'ch6', time: '18:57 · Год 13', title: 'Прорыв (The Breach)', desc: 'Сирены, прорыв орды через верхний шлюз! Экстренное запирание бронешлюзов.', act: () => applyChapter6() },
  { id: 'ch7', time: '22:27 · Год 14', title: 'Два Города (Two Cities)', desc: 'Верхний Оплот (оборона) и Нижний Город. Скоростной моторизованный лифт в стволе.', act: () => applyChapter7() },
  { id: 'ch8', time: '26:58 · Год 30', title: 'Подземный Город (The City Below)', desc: '6-ярусный мегаполис: УФ-гидропоника, школа, лазарет, 470+ жителей. Зима на поверхности.', act: () => applyChapter8() },
  { id: 'ch9', time: '30:18 · Год 30', title: 'Что таится внизу (What Lies Below)', desc: 'Бурение монолитного базальта открывает титановые двери древнего Бункера Ноль. Финал.', act: () => applyChapter9() }
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
