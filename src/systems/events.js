import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { getTotalAlivePop } from '../entities/colonists.js';
import { showCrisisChoice } from './democracy.js';

export function triggerNewcomerEvent() {
  const count = 1 + Math.floor(Math.random() * 3);
  const roles = ['WORKER', 'FARMER', 'MEDIC', 'GUARD', 'ENGINEER', 'TEACHER'];
  const names = ['VERA', 'ADAM', 'LENA', 'BORIS', 'KATE', 'YURI', 'DIMA', 'ANYA', 'SASHA', 'OLGA', 'IVAN', 'TANYA', 'FELIX', 'ROSA', 'VLAD'];

  const availNames = names.filter(n => !G.colonists.some(c => c.name === n));
  if (availNames.length === 0) return;

  const newcomerNames = availNames.slice(0, count);
  const newcomerRole = roles[Math.floor(Math.random() * roles.length)];
  const icons = { WORKER: '👷', FARMER: '🌾', MEDIC: '💉', GUARD: '🛡️', ENGINEER: '🔧', TEACHER: '📖' };

  eventBus.emit('modal:decision', {
    title: `🚪 СТУК В ЛЮКЕ (ДЕНЬ ${G.day})`,
    text: `${count} выживших стучат в люк! "${newcomerNames.join(', ')} - нас ${count}, мы ${newcomerRole === 'GUARD' ? 'бывшие военные' : newcomerRole === 'MEDIC' ? 'медики' : newcomerRole === 'FARMER' ? 'фермеры' : 'рабочие'}. Пожалуйста, пустите!"<br><br>Население: ${getTotalAlivePop()}/${G.mechanics.popCap}`,
    b1: `ВПУСТИТЬ (+${count})`,
    b2: 'ОТКАЗАТЬ',
    onAccept: () => {
      newcomerNames.forEach(n => {
        G.colonists.push({
          id: n.toLowerCase() + '_' + G.day,
          name: n, age: 20 + Math.floor(Math.random() * 30),
          role: newcomerRole, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          icon: icons[newcomerRole] || '👤', hp: 100, x: 0, y: 0, status: 'alive',
          task: 'Карантин', thought: 'Мы в безопасности...'
        });
      });
      eventBus.emit('log', `🚪 ПРИНЯТЫ ${count} БЕЖЕНЦЕВ: ${newcomerNames.join(', ')}`);
      G.mechanics.morale = Math.min(100, G.mechanics.morale + 3);
      eventBus.emit('sound', { type: 'good' });
      eventBus.emit('hud_update');
    },
    onDecline: () => {
      eventBus.emit('log', `🚫 Беженцам отказано. ${newcomerNames.join(', ')} ушли.`);
      G.mechanics.morale = Math.max(0, G.mechanics.morale - 5);
      eventBus.emit('sound', { type: 'bad' });
    }
  });
}

export function triggerRandomEvent() {
  const year = Math.floor((G.day - 1) / 365) + 1;
  const events = [
    { name: 'DISEASE', weight: 15, minYear: 1 },
    { name: 'WATER_CONTAMINATION', weight: 15, minYear: 1 },
    { name: 'RAT_INFESTATION', weight: 15, minYear: 1 },
    { name: 'SURVIVOR_CARAVAN', weight: 14, minYear: 2 },
    { name: 'SOLAR_STORM', weight: 12, minYear: 2 },
    { name: 'COLONIST_INVENTION', weight: 16, minYear: 1 },
    { name: 'MUTANT_ZOMBIE', weight: 14, minYear: 3 },
    { name: 'EARTHQUAKE', weight: 8, minYear: 3 },
    { name: 'RADIO_SIGNAL', weight: 12, minYear: 4 },
    { name: 'ZOMBIE_HORDE', weight: 15, minYear: 2 },
    { name: 'LUCKY_FIND', weight: 15, minYear: 1 },
    { name: 'PIPE_BURST', weight: 12, minYear: 2 },
    { name: 'GOOD_HARVEST', weight: 15, minYear: 1 },
    { name: 'CAVE_IN', weight: 8, minYear: 5 }
  ];

  const eligible = events.filter(e => year >= e.minYear);
  const totalW = eligible.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalW;
  let chosen = eligible[0];
  for (const e of eligible) {
    roll -= e.weight;
    if (roll <= 0) { chosen = e; break; }
  }

  switch (chosen.name) {
    case 'DISEASE': {
      const alive = G.colonists.filter(c => c.status === 'alive');
      const sickCount = Math.min(alive.length, 1 + Math.floor(Math.random() * 3));
      const newSick = [];
      for (let i = 0; i < sickCount; i++) {
        const c = alive[Math.floor(Math.random() * alive.length)];
        if (!G.mechanics.sickColonists.includes(c.id)) {
          G.mechanics.sickColonists.push(c.id);
          c.hp = Math.max(20, c.hp - 25);
          newSick.push(c.name);
        }
      }
      if (newSick.length > 0) {
        eventBus.emit('log', `🦠 ВСПЫШКА БОЛЕЗНИ! Заболели: ${newSick.join(', ')}. Нужны медикаменты!`);
        eventBus.emit('sound', { type: 'bad' });
        if (G.res.med < 5) {
          eventBus.emit('log', '⚠ МЕДИКАМЕНТОВ КРИТИЧЕСКИ МАЛО!');
        }
      }
      break;
    }
    case 'EARTHQUAKE': {
      const dmg = 5 + Math.floor(Math.random() * 15);
      G.res.materials = Math.max(0, (G.res.materials || 0) - dmg);
      G.shake = 20;
      setTimeout(() => { G.shake = 0; }, 2000);
      eventBus.emit('log', `🌋 ЗЕМЛЕТРЯСЕНИЕ! Потеряно ${dmg} материалов. Часть туннелей повреждена.`);
      eventBus.emit('sound', { type: 'bad' });
      G.mechanics.morale = Math.max(0, G.mechanics.morale - 10);
      break;
    }
    case 'RADIO_SIGNAL': {
      eventBus.emit('log', '📻 РАДИОСИГНАЛ! Слабый голос: "Есть кто живой? Координаты 52°N, 34°E... Мы тоже выжили."');
      G.mechanics.morale = Math.min(100, G.mechanics.morale + 10);
      eventBus.emit('sound', { type: 'good' });
      break;
    }
    case 'ZOMBIE_HORDE': {
      const hordeSize = 10 + Math.floor(Math.random() * 30);
      const defended = G.mechanics.defenseRating > hordeSize;
      if (defended) {
        G.res.ammo = Math.max(0, G.res.ammo - Math.floor(hordeSize * 0.5));
        eventBus.emit('log', `🧟 АТАКА ОРДЫ (${hordeSize} зомби)! Оборона ВЫДЕРЖАЛА. Потрачено ${Math.floor(hordeSize * 0.5)} патронов.`);
        eventBus.emit('sound', { type: 'alert' });
      } else {
        G.res.ammo = Math.max(0, G.res.ammo - Math.floor(hordeSize * 0.8));
        const alive = G.colonists.filter(c => c.status === 'alive');
        const casualty = alive[Math.floor(Math.random() * alive.length)];
        if (casualty) {
          casualty.hp = Math.max(10, casualty.hp - 40);
          eventBus.emit('log', `🧟 АТАКА ОРДЫ (${hordeSize})! Оборона ПРОРВАНА! ${casualty.name} ранен!`);
        }
        G.mechanics.morale = Math.max(0, G.mechanics.morale - 15);
        G.shake = 15;
        setTimeout(() => { G.shake = 0; }, 1500);
        eventBus.emit('sound', { type: 'siren' });
      }
      break;
    }
    case 'LUCKY_FIND': {
      const findType = Math.random();
      if (findType < 0.33) {
        const amt = 10 + Math.floor(Math.random() * 20);
        G.res.food += amt;
        eventBus.emit('log', `🍀 НАХОДКА! Обнаружен тайник с ${amt} единицами еды в старых шахтах!`);
      } else if (findType < 0.66) {
        const amt = 5 + Math.floor(Math.random() * 10);
        G.res.med += amt;
        eventBus.emit('log', `🍀 НАХОДКА! Аптечка с ${amt} мед. припасами в заброшенном вагоне!`);
      } else {
        const amt = 10 + Math.floor(Math.random() * 15);
        G.res.ammo += amt;
        eventBus.emit('log', `🍀 НАХОДКА! Ящик патронов (${amt}) в старой штольне!`);
      }
      eventBus.emit('sound', { type: 'good' });
      break;
    }
    case 'PIPE_BURST': {
      const loss = 10 + Math.floor(Math.random() * 20);
      G.res.water = Math.max(0, G.res.water - loss);
      eventBus.emit('log', `💧 ПРОРЫВ ТРУБЫ! Потеряно ${loss} воды. Ремонт нужен!`);
      eventBus.emit('sound', { type: 'bad' });
      break;
    }
    case 'GOOD_HARVEST': {
      const bonus = 15 + Math.floor(Math.random() * 25);
      G.res.food += bonus;
      eventBus.emit('log', `🌾 УРОЖАЙ! Грибная ферма дала +${bonus} еды сверх нормы!`);
      G.mechanics.morale = Math.min(100, G.mechanics.morale + 5);
      eventBus.emit('sound', { type: 'good' });
      break;
    }
    case 'CAVE_IN': {
      eventBus.emit('log', '⛏ ОБВАЛ! Часть верхних туннелей обрушилась. Нужны рабочие для расчистки.');
      G.mechanics.morale = Math.max(0, G.mechanics.morale - 8);
      eventBus.emit('sound', { type: 'bad' });
      G.shake = 12;
      setTimeout(() => { G.shake = 0; }, 1500);
      break;
    }
    case 'WATER_CONTAMINATION': {
      showCrisisChoice(
        '☣️ ЗАРАЖЕНИЕ ГРУНТОВЫХ ВОД',
        'Трупный яд зомби просочился в водоносный горизонт! Вода в колодце мутнеет. Доктор Нора предлагает экстренную термоочистку.',
        'СЖЕЧЬ 25 ТОПЛИВА (Очистить воду)',
        'ЭКОНОМИТЬ ТОПЛИВО (Риск болезни)',
        () => {
          if ((G.res.fuel || 0) >= 25) {
            G.res.fuel -= 25;
            eventBus.emit('log', '💧 Вода очищена кипячением (-25 топлива). Вспышка предотвращена!');
            eventBus.emit('toast', { text: '💧 Вода очищена кипячением (-25 топлива)', style: 'toast-good' });
            eventBus.emit('sound', { type: 'good' });
          } else {
            G.res.fuel = 0;
            G.mechanics.morale = Math.max(0, G.mechanics.morale - 10);
            eventBus.emit('log', '⚠ Не хватило топлива! Вода заражена, мораль упала.');
            eventBus.emit('sound', { type: 'bad' });
          }
          eventBus.emit('hud_update');
        },
        () => {
          const alive = G.colonists.filter(c => c.status === 'alive');
          alive.slice(0, 2).forEach(c => {
            if (!G.mechanics.sickColonists.includes(c.id)) {
              G.mechanics.sickColonists.push(c.id);
              c.hp = Math.max(25, c.hp - 35);
            }
          });
          G.mechanics.morale = Math.max(0, G.mechanics.morale - 15);
          eventBus.emit('log', '☣ 2 колониста отравились токсинами из колодца! Нужны медикаменты.');
          eventBus.emit('toast', { text: '☣ Вспышка интоксикации! Колонисты заболели.', style: 'toast-bad' });
          eventBus.emit('sound', { type: 'bad' });
          eventBus.emit('hud_update');
        }
      );
      break;
    }
    case 'RAT_INFESTATION': {
      showCrisisChoice(
        '🐀 ПОДЗЕМНЫЕ КРЫСЫ В СКЛАДЕ',
        'Орда гигантских серых крыс прогрызла ящики с провизией на нижнем ярусе. Уолт предлагает переловить их на мясо.',
        'ОХОТА НА КРЫС (+20 еды, риск ран)',
        'ОТРАВИТЬ (-4 медикамента, безопасно)',
        () => {
          G.res.food += 20;
          const alive = G.colonists.filter(c => c.status === 'alive');
          const hunter = alive[Math.floor(Math.random() * alive.length)];
          if (hunter) {
            hunter.hp = Math.max(30, hunter.hp - 20);
            eventBus.emit('log', `🐀 Поймано 20 ед. мяса! ${hunter.name} получил укус в схватке.`);
          }
          eventBus.emit('toast', { text: '🍗 Получено +20 еды (мясо крыс)!', style: 'toast-gold' });
          eventBus.emit('sound', { type: 'good' });
          eventBus.emit('hud_update');
        },
        () => {
          if ((G.res.med || 0) >= 4) {
            G.res.med -= 4;
            eventBus.emit('log', '🧪 Крысы уничтожены дезинфекцией (-4 медикамента). Запасы целы.');
            eventBus.emit('toast', { text: '🧪 Крысы уничтожены дезинфекцией (-4 медикамента)', style: 'toast-good' });
          } else {
            G.res.food = Math.max(0, G.res.food - 15);
            eventBus.emit('log', '⚠ Не хватило реактивов! Крысы уничтожили 15 запасов еды.');
            eventBus.emit('toast', { text: '⚠ Крысы уничтожили 15 запасов еды!', style: 'toast-bad' });
            eventBus.emit('sound', { type: 'bad' });
          }
          eventBus.emit('hud_update');
        }
      );
      break;
    }
    case 'SURVIVOR_CARAVAN': {
      showCrisisChoice(
        '🦺 БРОДЯЧИЙ ТОРГОВЕЦ-КРОТ',
        'К наружному тамбуру подошел торговец в тяжелом водолазном костюме. Он предлагает обмен: 30 стройматериалов за 15 патронов и 5 медикаментов.',
        'ОБМЕН (-30 🪨 / +15 🎯 +5 💉)',
        'ОТКАЗАТЬСЯ (Сохранить камень)',
        () => {
          if ((G.res.materials || 0) >= 30) {
            G.res.materials -= 30;
            G.res.ammo = (G.res.ammo || 0) + 15;
            G.res.med = (G.res.med || 0) + 5;
            eventBus.emit('log', '🤝 Сделка состоялась: -30 материалов, +15 патронов, +5 лекарств!');
            eventBus.emit('toast', { text: '🤝 Сделка завершена (+15 патронов, +5 лекарств)', style: 'toast-good' });
            eventBus.emit('sound', { type: 'good' });
          } else {
            eventBus.emit('toast', { text: '⚠ Недостаточно материалов для обмена!', style: 'toast-bad' });
            eventBus.emit('sound', { type: 'bad' });
          }
          eventBus.emit('hud_update');
        },
        () => {
          eventBus.emit('log', '🚶 Торговец ушел дальше в туннели метро.');
          eventBus.emit('toast', { text: 'Торговец покинул шлюз', style: 'toast-gold' });
        }
      );
      break;
    }
    case 'SOLAR_STORM': {
      eventBus.emit('log', '⚡ КОРОТКОЕ ЗАМЫКАНИЕ! Перегрузка в силовом кабеле ствола шахты.');
      G.res.power = Math.max(5, (G.res.power || 0) - 40);
      eventBus.emit('sound', { type: 'bad' });
      eventBus.emit('toast', { text: '⚡ Перегрузка электросети! Энергия упала.', style: 'toast-bad' });
      break;
    }
    case 'COLONIST_INVENTION': {
      showCrisisChoice(
        '💡 ИНЖЕНЕРНЫЙ ПРОРЫВ В БУНКЕРЕ',
        'Ночью Уолт и Рэй нашли способ модифицировать горнопроходческие буры или оптимизировать светодиоды ламп!',
        'МОДИФИКАЦИЯ БУРА (+50 🪨)',
        'ДИОДНОЕ ОСВЕЩЕНИЕ (+25% энергии)',
        () => {
          G.res.materials = (G.res.materials || 0) + 50;
          eventBus.emit('log', '⚙️ Уолт модернизировал буры: добыто +50 стройматериалов!');
          eventBus.emit('toast', { text: '⚙️ Модификация бура: +50 материалов!', style: 'toast-good' });
          eventBus.emit('sound', { type: 'good' });
          eventBus.emit('hud_update');
        },
        () => {
          G.res.power = Math.min(100, (G.res.power || 0) + 25);
          G.mechanics.morale = Math.min(100, G.mechanics.morale + 10);
          eventBus.emit('log', '⚡ Рэй перепаял освещение: энергосеть оптимизирована (+25%)!');
          eventBus.emit('toast', { text: '⚡ Освещение оптимизировано (+25% энергии)', style: 'toast-good' });
          eventBus.emit('sound', { type: 'good' });
          eventBus.emit('hud_update');
        }
      );
      break;
    }
    case 'MUTANT_ZOMBIE': {
      eventBus.emit('sound', { type: 'horde_roar' });
      G.shake = 15;
      setTimeout(() => { G.shake = 0; }, 1500);
      const def = G.mechanics.defenseRating || 15;
      if (def >= 25 && (G.res.ammo || 0) >= 10) {
        G.res.ammo -= 10;
        G.res.materials = (G.res.materials || 0) + 25;
        G.mechanics.morale = Math.min(100, G.mechanics.morale + 12);
        eventBus.emit('log', '💀 МУТАНТ-ГРОМИЛА УНИЧТОЖЕН у внешнего шлюза! (-10 патронов, +25 трофеев)');
        eventBus.emit('toast', { text: '💀 Мутант уничтожен часовыми! (+12 морали, +25 материалов)', style: 'toast-good' });
        eventBus.emit('sound', { type: 'good' });
      } else {
        G.res.ammo = Math.max(0, (G.res.ammo || 0) - 15);
        G.mechanics.morale = Math.max(0, G.mechanics.morale - 15);
        const alive = G.colonists.filter(c => c.status === 'alive');
        if (alive.length > 0) {
          alive[0].hp = Math.max(10, alive[0].hp - 40);
          eventBus.emit('log', `🚨 МУТАНТ ПОВРЕДИЛ ШЛЮЗ! ${alive[0].name} тяжело ранен в схватке.`);
        }
        eventBus.emit('toast', { text: '🚨 Мутант нанес урон колонии! Шлюз деформирован.', style: 'toast-bad' });
        eventBus.emit('sound', { type: 'bad' });
      }
      break;
    }
  }
}

export function resolveScavenge() {
  const team = G.mechanics.scavengeTeam;
  if (!team || team.length === 0) return;

  const isNight = (G.timeHour >= 21 || G.timeHour < 6);
  const dangerBase = isNight ? 0.45 : 0.25;
  const danger = dangerBase - (G.mechanics.defenseRating * 0.005);

  let loot = { food: 0, water: 0, med: 0, ammo: 0, fuel: 0, materials: 0 };
  let report = [];

  team.forEach(id => {
    const c = G.colonists.find(cc => cc.id === id);
    if (!c || c.status === 'dead') return;

    loot.food += 8 + Math.floor(Math.random() * 25);
    loot.med += Math.floor(Math.random() * 8);
    loot.ammo += 5 + Math.floor(Math.random() * 15);
    loot.fuel += 5 + Math.floor(Math.random() * 20);
    loot.materials += 3 + Math.floor(Math.random() * 10);

    if (Math.random() < danger) {
      const dmg = 15 + Math.floor(Math.random() * 30);
      c.hp = Math.max(5, c.hp - dmg);
      report.push(`${c.name} РАНЕН (-${dmg} HP)`);
      if (c.hp <= 10) {
        report.push(`${c.name} в КРИТИЧЕСКОМ состоянии!`);
      }
    } else {
      report.push(`${c.name} вернулся невредим`);
    }

    c.task = 'Отдых после вылазки';
  });

  G.res.food += loot.food;
  G.res.water += loot.water;
  G.res.med += loot.med;
  G.res.ammo += loot.ammo;
  G.res.fuel += loot.fuel;
  G.res.materials = (G.res.materials || 0) + loot.materials;

  const lootStr = Object.entries(loot).filter(([k, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(', ');
  eventBus.emit('log', `🏙 ВЫЛАЗКА ЗАВЕРШЕНА! ${report.join('. ')}. Добыча: ${lootStr}`);
  eventBus.emit('sound', { type: 'good' });

  G.mechanics.scavengeTeam = [];
  G.mechanics.scavengeReturning = false;
  eventBus.emit('hud_update');
}

export function launchSurfaceScavenge() {
  if (G.mechanics.scavengeTeam.length > 0) {
    eventBus.emit('log', '⚠ Команда уже на поверхности! Дождитесь возвращения.');
    eventBus.emit('sound', { type: 'bad' });
    return;
  }

  const alive = G.colonists.filter(c => c.status === 'alive' && c.role !== 'INFANT' && c.role !== 'CHILD');
  if (alive.length <= 1) {
    eventBus.emit('log', '⚠ Недостаточно людей для вылазки!');
    eventBus.emit('sound', { type: 'bad' });
    return;
  }

  const modal = document.getElementById('modal-screen');
  if (!modal) return;
  const isNight = (G.timeHour >= 21 || G.timeHour < 6);
  const dangerLevel = isNight ? 'ВЫСОКИЙ 🔴' : 'СРЕДНИЙ 🟡';

  let teamHtml = alive.map(c => `
    <label style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#1a1a1f; border-radius:6px; cursor:pointer; margin:3px 0;">
      <input type="checkbox" class="scav-check" value="${c.id}" style="accent-color:#d4af37;">
      <span style="font-size:18px;">${c.icon}</span>
      <span style="color:#e8d5b7; font-size:13px;">${c.name} (${c.role}) HP:${c.hp}</span>
    </label>
  `).join('');

  modal.innerHTML = `
    <h1 style="color:var(--accent-gold); font-size:28px; margin-bottom:10px;">🏙 ВЫЛАЗКА НА ПОВЕРХНОСТЬ</h1>
    <p style="color:#9a8b7a; font-size:13px; margin-bottom:6px;">Опасность: ${dangerLevel} ${isNight ? '(НОЧЬ)' : '(ДЕНЬ)'}</p>
    <p style="color:#7a6b5a; font-size:12px; margin-bottom:14px;">Выберите 1-3 колонистов для экспедиции (1-3 дня). Они могут найти еду, медикаменты, патроны, топливо.</p>
    <div style="max-height:220px; overflow-y:auto; margin-bottom:16px; width:300px;">
      ${teamHtml}
    </div>
    <div style="display:flex; gap:12px;">
      <button class="modal-btn" id="m-btn-1">ОТПРАВИТЬ</button>
      <button class="modal-btn" style="background:#333; color:#fff;" id="m-btn-2">ОТМЕНА</button>
    </div>
  `;
  modal.style.display = 'flex';

  const b1 = document.getElementById('m-btn-1');
  const b2 = document.getElementById('m-btn-2');

  if (b1) {
    b1.onclick = () => {
      const checked = [...document.querySelectorAll('.scav-check:checked')].map(cb => cb.value);
      if (checked.length === 0 || checked.length > 3) {
        eventBus.emit('log', '⚠ Выберите от 1 до 3 колонистов!');
        return;
      }
      modal.style.display = 'none';
      G.mechanics.scavengeTeam = checked;
      G.mechanics.scavengeDayLeft = 1 + Math.floor(Math.random() * 3);

      checked.forEach(id => {
        const c = G.colonists.find(cc => cc.id === id);
        if (c) c.task = 'Вылазка на поверхность';
      });

      eventBus.emit('log', `🏙 ВЫЛАЗКА: ${checked.map(id => G.colonists.find(c => c.id === id)?.name).join(', ')} ушли наверх (≈${G.mechanics.scavengeDayLeft} дн.)`);
      eventBus.emit('sound', { type: 'alert' });
      eventBus.emit('hud_update');
    };
  }

  if (b2) {
    b2.onclick = () => {
      modal.style.display = 'none';
    };
  }
}
