import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { CHAPTERS } from '../systems/story.js';
import { ROOM_CATALOG } from '../world/rooms.js';
import { updateGameModeUI } from './gamemode_view.js';
import { getColonistPerk } from '../entities/colonists.js';
import { AudioSys } from '../audio/audio_sys.js';
import { AmbienceEngine } from '../audio/ambience.js';
import { roleLabel } from '../core/i18n.js';

export function openChaptersModal() {
  const grid = document.getElementById('chapters-grid');
  if (!grid) return;
  grid.innerHTML = '';
  CHAPTERS.forEach(ch => {
    const c = document.createElement('div');
    c.className = `ch-card ${G.activeChapterId === ch.id ? 'active' : ''}`;
    c.innerHTML = `
      <div class="ch-badge">
        <span>${ch.time}</span>
        ${G.activeChapterId === ch.id ? '<span style="color:#2ecc71;">● ТЕКУЩАЯ</span>' : ''}
      </div>
      <div class="ch-title">${ch.title}</div>
      <div class="ch-desc">${ch.desc}</div>
      <button class="ch-btn">ЗАПУСТИТЬ ГЛАВУ ▶</button>
    `;
    c.querySelector('.ch-btn').onclick = () => {
      closeChaptersModal();
      G.activeChapterId = ch.id;
      ch.act();
    };
    grid.appendChild(c);
  });
  const m = document.getElementById('chapters-modal');
  if (m) m.style.display = 'flex';
}

export function closeChaptersModal() {
  const m = document.getElementById('chapters-modal');
  if (m) m.style.display = 'none';
}

export function openGameModeModal() {
  const m = document.getElementById('gamemode-modal');
  if (!m) return;
  m.style.display = 'flex';
  updateGameModeUI();
}

export function closeGameModeModal() {
  const m = document.getElementById('gamemode-modal');
  if (m) m.style.display = 'none';
}

export function selectRoomForPlacement(r) {
  if ((G.res.materials || 0) < r.matCost) {
    eventBus.emit('toast', { text: `⚠ Недостаточно материалов! Нужно: ${r.matCost} 🪨, есть: ${G.res.materials || 0}`, style: 'toast-bad' });
    eventBus.emit('sound', { type: 'bad' });
    return;
  }
  const m = document.getElementById('build-modal');
  if (m) m.style.display = 'none';

  G.toolMode = 'place_room';
  G.placingRoom = r;
  const banner = document.getElementById('placement-banner');
  const txt = document.getElementById('pb-text');
  if (banner) banner.style.display = 'flex';
  if (txt) txt.textContent = `🔨 Размещение: ${r.name} (${r.w}x${r.h}) — Кликните в шахте для постройки`;
  eventBus.emit('toast', { text: `Выберите место в шахте для «${r.name}» (клик для постройки, ESC для отмены)`, style: 'toast-gold' });
  eventBus.emit('sound', { type: 'tone', freq: 520, dur: 0.1, wave: 'sine', vol: 0.2 });
}

export function cancelPlacement() {
  G.toolMode = 'select';
  G.placingRoom = null;
  const banner = document.getElementById('placement-banner');
  if (banner) banner.style.display = 'none';
  ['btn-tool-build', 'btn-tool-dig', 'btn-tool-demo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}

export function toggleBuildMenu(forceOpen) {
  const m = document.getElementById('build-modal');
  if (!m) return;
  const shouldOpen = forceOpen !== undefined ? forceOpen : (m.style.display !== 'flex');
  if (!shouldOpen) {
    m.style.display = 'none';
  } else {
    const list = document.getElementById('bm-list');
    if (!list) return;
    list.innerHTML = '';
    ROOM_CATALOG.forEach(r => {
      const canAfford = (G.res.materials || 0) >= r.matCost;
      const inQueue = G.mechanics.buildQueue.some(bq => bq.blueprint && bq.blueprint.type === r.type);
      const item = document.createElement('div');
      item.className = 'bm-item';
      item.style.opacity = canAfford ? '1' : '0.55';
      item.innerHTML = `
        <div class="bm-icon">${r.icon}</div>
        <div>
          <div class="bm-name">${r.name}${inQueue ? ' 🔨' : ''}</div>
          <div class="bm-cost">${r.matCost} 🪨 | ${r.desc}</div>
        </div>
      `;
      item.onclick = () => {
        if (!canAfford) {
          eventBus.emit('log', `⚠ Недостаточно материалов для «${r.name}»! Нужно: ${r.matCost} 🪨`);
          eventBus.emit('toast', { text: `⚠ Нужно ${r.matCost} 🪨 (есть ${G.res.materials || 0})`, style: 'toast-bad' });
          eventBus.emit('sound', { type: 'bad' });
          return;
        }
        selectRoomForPlacement(r);
      };
      list.appendChild(item);
    });

    if (G.mechanics.buildQueue.length > 0) {
      const qHeader = document.createElement('div');
      qHeader.style.cssText = 'color:#d4af37; font-size:12px; margin-top:12px; padding:6px; border-top:1px solid #333;';
      qHeader.textContent = `🔨 В СТРОИТЕЛЬСТВЕ (${G.mechanics.buildQueue.length}):`;
      list.appendChild(qHeader);
      G.mechanics.buildQueue.forEach(bq => {
        const qItem = document.createElement('div');
        qItem.className = 'bm-item';
        qItem.style.opacity = '0.7';
        qItem.innerHTML = `<div class="bm-icon">🔨</div><div><div class="bm-name">${bq.blueprint.name}</div><div class="bm-cost">Осталось ${bq.daysLeft} дней</div></div>`;
        list.appendChild(qItem);
      });
    }

    m.style.display = 'flex';
  }
}

export function showColonistModal(c) {
  const modal = document.getElementById('modal-screen');
  if (!modal) return;
  const perk = getColonistPerk(c);
  modal.innerHTML = `
    <div style="background:#18181c; border:1px solid #3d3527; border-radius:8px; padding:24px; max-width:440px; width:90%; color:#fff;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div style="width:40px; height:40px; border-radius:50%; background:#282832; display:flex; align-items:center; justify-content:center; font-size:20px;">${c.icon}</div>
        <div>
          <h2 style="font-size:18px; color:var(--accent-gold); margin:0;">${c.name}</h2>
          <div style="font-size:11px; color:var(--text-muted);">ВОЗРАСТ ${c.age} · ${roleLabel(c.role)} ${c.status === 'dead' ? '· (ПОГИБ)' : ''}</div>
        </div>
      </div>
      <div style="font-size:12px; line-height:1.6; margin-bottom:16px; background:#121214; padding:12px; border-radius:4px;">
        <div><strong>Состояние:</strong> ${c.status === 'dead' ? 'Погиб в шахте' : c.hp + '/100 HP'}</div>
        <div><strong>Занятие:</strong> ${c.task || 'Обустройство убежища'}</div>
        <div style="margin-top:6px; padding:6px 8px; background:#24252e; border-left:3px solid var(--accent-gold); border-radius:2px;">
          <div style="color:var(--accent-gold); font-weight:bold; font-size:11px;">ОСОБЕННОСТЬ: ${perk.trait}</div>
          <div style="color:#aaa; font-size:10px;">${perk.desc}</div>
        </div>
        <div style="margin-top:8px; font-style:italic; color:#e2b765;">"${c.thought || 'Мы должны выжить...'}"</div>
      </div>
      <div style="text-align:right;">
        <button class="modal-btn" id="m-colonist-close">ЗАКРЫТЬ</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  const closeBtn = document.getElementById('m-colonist-close');
  if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
}

export function showDecisionModal(title, text, b1, b2, onAccept, onDecline) {
  const modal = document.getElementById('modal-screen');
  if (!modal) return;
  modal.innerHTML = `
    <h1 style="color:var(--accent-gold); font-size:32px; margin-bottom:12px;">${title}</h1>
    <p style="color:#cfbfad; font-size:14px; max-width:520px; text-align:center; line-height:1.7; margin-bottom:24px;">${text}</p>
    <div style="display:flex; gap:16px;">
      <button class="modal-btn" id="m-btn-1">${b1}</button>
      <button class="modal-btn" style="background:#333; color:#fff;" id="m-btn-2">${b2}</button>
    </div>
  `;
  modal.style.display = 'flex';
  const btn1 = document.getElementById('m-btn-1');
  const btn2 = document.getElementById('m-btn-2');
  if (btn1) btn1.onclick = () => { modal.style.display = 'none'; if (onAccept) onAccept(); };
  if (btn2) btn2.onclick = () => { modal.style.display = 'none'; if (onDecline) onDecline(); };
}

eventBus.on('modal:decision', ({ title, text, b1, b2, onAccept, onDecline }) => {
  showDecisionModal(title, text, b1, b2, onAccept, onDecline);
});

export function openSettingsModal() {
  const m = document.getElementById('settings-modal');
  if (!m) return;
  m.style.display = 'flex';
  const chkLight = document.getElementById('set-opt-lighting');
  const chkPart = document.getElementById('set-opt-particles');
  const rngSfx = document.getElementById('set-opt-sfx');
  const rngAmb = document.getElementById('set-opt-amb');

  if (chkLight) chkLight.checked = G.settings.lightingEnabled !== false;
  if (chkPart) chkPart.checked = G.settings.particlesEnabled !== false;
  if (rngSfx) rngSfx.value = (AudioSys.sfxVolume !== undefined ? AudioSys.sfxVolume : 0.8) * 100;
  if (rngAmb) rngAmb.value = (AmbienceEngine.volume !== undefined ? AmbienceEngine.volume : 0.5) * 100;
}

export function closeSettingsModal() {
  const m = document.getElementById('settings-modal');
  if (m) m.style.display = 'none';
}

export function applySettings() {
  const chkLight = document.getElementById('set-opt-lighting');
  const chkPart = document.getElementById('set-opt-particles');
  const rngSfx = document.getElementById('set-opt-sfx');
  const rngAmb = document.getElementById('set-opt-amb');

  if (chkLight) G.settings.lightingEnabled = chkLight.checked;
  if (chkPart) G.settings.particlesEnabled = chkPart.checked;
  if (rngSfx) AudioSys.setSFXVolume(Number(rngSfx.value) / 100);
  if (rngAmb) AmbienceEngine.setVolume(Number(rngAmb.value) / 100);

  eventBus.emit('toast', { text: '⚙️ Настройки графики и звука обновлены!', style: 'toast-gold' });
  closeSettingsModal();
}
