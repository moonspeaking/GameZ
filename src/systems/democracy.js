import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { ROOM_CATALOG, autoPlaceRoom } from '../world/rooms.js';
import { countRoomsByType } from './resources.js';
import { getTotalAlivePop } from '../entities/colonists.js';

export function updateGameModeUI() {
  const btn = document.getElementById('btn-mode-indicator');
  if (btn) {
    if (G.gameMode === 'democracy') {
      btn.innerHTML = '🏛️ ДЕМОКРАТИЯ ▼';
      btn.style.color = '#2ecc71';
      btn.style.borderColor = '#27ae60';
      btn.style.background = '#16241a';
    } else if (G.gameMode === 'overseer') {
      btn.innerHTML = '👑 КОМЕНДАНТ ▼';
      btn.style.color = '#e67e22';
      btn.style.borderColor = '#d35400';
      btn.style.background = '#281d14';
    } else {
      btn.innerHTML = '⚡ АНАРХИЯ ▼';
      btn.style.color = '#e74c3c';
      btn.style.borderColor = '#c0392b';
      btn.style.background = '#281616';
    }
  }

  ['democracy', 'overseer', 'anarchy'].forEach(m => {
    const card = document.getElementById(`gm-card-${m}`);
    const badge = document.getElementById(`gm-badge-${m}`);
    const active = G.gameMode === m;
    if (card) {
      card.style.borderColor = active ? (m === 'democracy' ? '#2ecc71' : (m === 'overseer' ? '#e67e22' : '#e74c3c')) : '#444';
      card.style.background = active ? '#22252f' : '#1b1d24';
    }
    if (badge) badge.style.display = active ? 'inline-block' : 'none';
  });
}

export function setGameMode(mode) {
  G.gameMode = mode;
  updateGameModeUI();
  eventBus.emit('hud_update');

  if (mode === 'democracy') {
    eventBus.emit('toast', { text: '🏛️ Режим изменён: ДЕМОКРАТИЯ (Колонисты голосуют и строят сами)', style: 'toast-good' });
    eventBus.emit('log', '🏛️ ПРАВЛЕНИЕ: Власть передана Совету Колонии. Решения принимаются большинством голосов.');
    eventBus.emit('sound', { type: 'good' });
  } else if (mode === 'overseer') {
    eventBus.emit('toast', { text: '👑 Режим изменён: КОМЕНДАНТ (Прямое единоличное управление)', style: 'toast-gold' });
    eventBus.emit('log', '👑 ПРАВЛЕНИЕ: Введено прямое правление Коменданта. Все решения за вами.');
    eventBus.emit('sound', { type: 'tone', freq: 320, dur: 0.2, wave: 'sawtooth', vol: 0.25 });
  } else if (mode === 'anarchy') {
    eventBus.emit('toast', { text: '⚡ Режим изменён: АНАРХИЯ (Свободная воля колонистов)', style: 'toast-bad' });
    eventBus.emit('log', '⚡ ПРАВЛЕНИЕ: Совет распущен! Анархия: каждый житель предоставлен сам себе.');
    eventBus.emit('sound', { type: 'bad' });
  }
}

export function startCouncilVote(title, prompt, optA, optB, onOptionA, onOptionB) {
  if (G.gameMode === 'overseer') {
    eventBus.emit('modal:decision', { title, text: prompt, b1: optA, b2: optB, onAccept: onOptionA, onDecline: onOptionB });
    return;
  }

  const modal = document.getElementById('council-vote-modal');
  if (!modal) {
    eventBus.emit('modal:decision', { title, text: prompt, b1: optA, b2: optB, onAccept: onOptionA, onDecline: onOptionB });
    return;
  }

  const tEl = document.getElementById('cv-title');
  const pEl = document.getElementById('cv-prompt-text');
  const dEl = document.getElementById('cv-desc-text');
  const vEl = document.getElementById('cv-voters-count');
  if (tEl) tEl.textContent = title || 'СОВЕТ КОЛОНИИ: ГОЛОСОВАНИЕ';
  if (pEl) pEl.textContent = prompt;
  if (dEl) dEl.textContent = `Вариант А: ${optA} | Вариант Б: ${optB}`;

  const alive = G.colonists.filter(c => c.status === 'alive');
  if (vEl) vEl.textContent = `${alive.length} граждан`;

  const votes = [];
  let yesCount = 0;
  let noCount = 0;

  alive.forEach(c => {
    let vote = 'A';
    let quote = '';

    if (c.role === 'ELEC' || c.id === 'ray') {
      if (prompt.includes('энерг') || prompt.includes('диод') || prompt.includes('топлив')) {
        vote = 'A'; quote = '«Нам важна стабильность энергосети! Голосую за.»';
      } else if (prompt.includes('риск') || prompt.includes('мясо')) {
        vote = 'B'; quote = '«Слишком рискованно для проводки и безопасности.»';
      } else {
        vote = Math.random() < 0.65 ? 'A' : 'B';
        quote = vote === 'A' ? '«Технически осуществимо. Поддерживаю.»' : '«Нецелесообразный расход ресурсов.»';
      }
    } else if (c.role === 'MED' || c.id === 'nora') {
      if (prompt.includes('болезн') || prompt.includes('токсин') || prompt.includes('очист') || prompt.includes('ОТРАВИТЬ') || prompt.includes('карантин')) {
        vote = 'A'; quote = '«Здоровье колонистов на первом месте! Никаких компромиссов.»';
      } else if (prompt.includes('риск')) {
        vote = 'B'; quote = '«Я против неоправданного риска жизнями людей.»';
      } else {
        vote = Math.random() < 0.6 ? 'A' : 'B';
        quote = vote === 'A' ? '«Санитарные нормы позволяют.»' : '«Я воздержусь или проголосую против.»';
      }
    } else if (c.role === 'ENG' || c.id === 'walt') {
      if (prompt.includes('бур') || prompt.includes('пород') || prompt.includes('строит') || prompt.includes('ферм') || prompt.includes('постройка')) {
        vote = 'A'; quote = '«Отличный проект! Я подготовлю крепи и инструмент.»';
      } else if (prompt.includes('камень') || prompt.includes('материал')) {
        vote = 'A'; quote = '«Камня у нас хватит, работаем дальше.»';
      } else {
        vote = Math.random() < 0.7 ? 'A' : 'B';
        quote = vote === 'A' ? '«Я за развитие и расширение бункера.»' : '«Надо сначала укрепить существующие штольни.»';
      }
    } else if (c.role === 'SCOUT' || c.id === 'eli') {
      if (prompt.includes('чужак') || prompt.includes('торгов') || prompt.includes('развед') || prompt.includes('патрон')) {
        vote = 'A'; quote = '«Я знаю внешние ходы, это отличная возможность!»';
      } else {
        vote = Math.random() < 0.65 ? 'A' : 'B';
        quote = vote === 'A' ? '«Давайте попробуем. Мы не должны закрываться.»' : '«Чутьё подсказывает быть осторожнее.»';
      }
    } else {
      vote = Math.random() < (G.mechanics.morale > 50 ? 0.7 : 0.45) ? 'A' : 'B';
      quote = vote === 'A' ? '«Поддерживаю решение большинства.»' : '«Опасаюсь последствий для нашей безопасности.»';
    }

    if (vote === 'A') yesCount++; else noCount++;
    votes.push({ colonist: c, vote, quote });
  });

  const listEl = document.getElementById('cv-voters-list');
  if (listEl) {
    listEl.innerHTML = '';
    votes.forEach(v => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#18191f; padding:5px 10px; border-radius:5px; border-left:3px solid ' + (v.colonist.color || '#d4af37') + ';';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:15px;">${v.colonist.icon || '👤'}</span>
          <div>
            <span style="color:#fff; font-weight:bold; font-size:11px;">${v.colonist.name}</span>
            <span style="color:#888; font-size:10px; margin-left:4px;">${v.quote}</span>
          </div>
        </div>
        <span style="font-size:10px; font-weight:bold; padding:2px 7px; border-radius:3px; ${v.vote === 'A' ? 'background:rgba(46,204,113,0.2); color:#2ecc71; border:1px solid #27ae60;' : 'background:rgba(231,76,60,0.2); color:#e74c3c; border:1px solid #c0392b;'}">${v.vote === 'A' ? 'ЗА' : 'ПРОТИВ'}</span>
      `;
      listEl.appendChild(row);
    });
  }

  const total = yesCount + noCount;
  const yesPct = total > 0 ? (yesCount / total) * 100 : 50;
  const yLbl = document.getElementById('cv-yes-label');
  const nLbl = document.getElementById('cv-no-label');
  const bYes = document.getElementById('cv-bar-yes');
  const bNo = document.getElementById('cv-bar-no');
  if (yLbl) yLbl.textContent = `ЗА: ${yesCount}`;
  if (nLbl) nLbl.textContent = `ПРОТИВ: ${noCount}`;
  if (bYes) bYes.style.width = `${yesPct}%`;
  if (bNo) bNo.style.width = `${100 - yesPct}%`;

  modal.style.display = 'flex';
  eventBus.emit('sound', { type: 'tone', freq: 480, dur: 0.15, wave: 'sine', vol: 0.25 });

  const btnA = document.getElementById('cv-btn-opt-a');
  const btnB = document.getElementById('cv-btn-opt-b');

  if (btnA) {
    btnA.textContent = `👍 ГОЛОСУЮ ЗА (${optA.split(' (')[0]})`;
    btnA.onclick = () => {
      modal.style.display = 'none';
      yesCount++;
      resolveVote(yesCount >= noCount);
    };
  }

  if (btnB) {
    btnB.textContent = `👎 ГОЛОСУЮ ПРОТИВ (${optB.split(' (')[0]})`;
    btnB.onclick = () => {
      modal.style.display = 'none';
      noCount++;
      resolveVote(yesCount > noCount);
    };
  }

  function resolveVote(passed) {
    if (passed) {
      eventBus.emit('toast', { text: `🏛️ СОВЕТ ПРИНЯЛ РЕШЕНИЕ: «${optA}» (${yesCount} ЗА, ${noCount} ПРОТИВ)`, style: 'toast-good' });
      eventBus.emit('sound', { type: 'good' });
      eventBus.emit('log', `🏛️ ГОЛОСОВАНИЕ: Совет утвердил «${optA}» (${yesCount} за, ${noCount} против)`);
      if (onOptionA) onOptionA();
    } else {
      eventBus.emit('toast', { text: `🏛️ СОВЕТ ОТКЛОНИЛ: «${optB}» (${noCount} ПРОТИВ)`, style: 'toast-bad' });
      eventBus.emit('sound', { type: 'bad' });
      eventBus.emit('log', `🏛️ ГОЛОСОВАНИЕ: Совет отклонил предложение, выбрано «${optB}»`);
      if (onOptionB) onOptionB();
    }
  }
}

export function showCrisisChoice(title, desc, optA, optB, onA, onB) {
  if (G.gameMode === 'democracy') {
    startCouncilVote(title, desc, optA, optB, onA, onB);
  } else if (G.gameMode === 'overseer') {
    eventBus.emit('modal:decision', { title, text: desc, b1: optA, b2: optB, onAccept: onA, onDecline: onB });
  } else {
    // Anarchy mode: flip coin
    if (Math.random() < 0.5) {
      eventBus.emit('toast', { text: `⚡ Анархия: колонисты выбрали «${optA}»!`, style: 'toast-gold' });
      if (onA) onA();
    } else {
      eventBus.emit('toast', { text: `⚡ Анархия: колонисты выбрали «${optB}»!`, style: 'toast-bad' });
      if (onB) onB();
    }
  }
}

export function evaluateAutonomousBuilding() {
  if (G.gameMode !== 'democracy' && G.gameMode !== 'anarchy') return;
  if (G.mechanics.buildQueue.length > 0) return;
  if ((G.res.materials || 0) < 20) return;

  const pop = getTotalAlivePop();
  let candidateRoom = null;

  const farms = countRoomsByType('farm') + countRoomsByType('hydro_uv');
  const pumps = countRoomsByType('waterPump');
  const gens = countRoomsByType('generator');
  const armories = G.rooms.filter(r => r.type === 'armory' || (r.name && r.name.includes('ARMORY'))).length;

  if (G.res.food < pop * 15 && farms < 6) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'hydro_uv' && G.res.materials >= r.matCost) ||
                    ROOM_CATALOG.find(r => r.type === 'farm');
  } else if (G.res.water < pop * 20 && pumps < 4) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'waterPump');
  } else if (pop >= G.mechanics.popCap - 1) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'quarters');
  } else if (G.mechanics.defenseRating < 30 && armories < 3) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'armory');
  } else if (G.res.power < 50 && gens < 3) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'generator');
  } else if (G.mechanics.sickColonists.length > 0 && !G.rooms.some(r => r.type === 'infirmary')) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'infirmary');
  } else if (G.mechanics.morale < 70 && !G.rooms.some(r => r.type === 'school')) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'school');
  } else if (G.res.materials >= 45 && Math.random() < 0.4) {
    candidateRoom = ROOM_CATALOG.find(r => r.type === 'workshop') || ROOM_CATALOG.find(r => r.type === 'quarters');
  }

  if (!candidateRoom) return;
  if ((G.res.materials || 0) < candidateRoom.matCost) return;

  if (G.gameMode === 'democracy') {
    startCouncilVote(
      '🏛️ СОВЕТ: ПЛАН СТРОИТЕЛЬСТВА',
      `Колонисты вынесли на голосование проект нового сектора: «${candidateRoom.name}». Стоимость: ${candidateRoom.matCost} 🪨.`,
      `УТВЕРДИТЬ СТРОИТЕЛЬСТВО`,
      `ОТЛОЖИТЬ ПРОЕКТ`,
      () => {
        autoPlaceRoom(candidateRoom);
      },
      () => {
        eventBus.emit('log', `🏛️ Совет решил пока отложить постройку «${candidateRoom.name}».`);
      }
    );
  } else if (G.gameMode === 'anarchy') {
    if (Math.random() < 0.6) {
      eventBus.emit('toast', { text: `⚡ Анархия: колонисты самовольно начали строить «${candidateRoom.name}»!`, style: 'toast-gold' });
      autoPlaceRoom(candidateRoom);
    }
  }
}
