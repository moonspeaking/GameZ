/**
 * Surface-expedition dialog view. DOM only: renders destinations and squad choices
 * prepared by systems/events.js and reports the selection via confirm(teamIds, destId).
 */
import { eventBus } from '../core/event_bus.js';

export function showScavengeDialog({ alive, isNight, destinations, confirm }) {
  const modal = document.getElementById('modal-screen');
  if (!modal) return;


  let destHtml = destinations.map((d, i) => `
    <label style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#181920; border:1px solid #3d3527; border-radius:6px; cursor:pointer; margin:4px 0;">
      <div style="display:flex; align-items:center; gap:8px;">
        <input type="radio" name="scav-dest" value="${d.id}" ${i === 0 ? 'checked' : ''} style="accent-color:#d4af37;">
        <div>
          <div style="color:#fff; font-weight:bold; font-size:12px;">${d.name}</div>
          <div style="color:#888; font-size:10px;">${d.desc}</div>
        </div>
      </div>
      <span style="font-size:10px; font-weight:bold; padding:2px 6px; border-radius:3px; background:#222; color:#d4af37;">${d.risk}</span>
    </label>
  `).join('');

  let teamHtml = alive.map(c => `
    <label style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#1a1a1f; border-radius:6px; cursor:pointer; margin:3px 0;">
      <input type="checkbox" class="scav-check" value="${c.id}" style="accent-color:#d4af37;">
      <span style="font-size:18px;">${c.icon}</span>
      <span style="color:#e8d5b7; font-size:12px;">${c.name} (${c.role}) HP:${c.hp}</span>
    </label>
  `).join('');

  modal.innerHTML = `
    <div style="background:#14151a; border:1px solid var(--accent-gold); border-radius:8px; padding:20px; max-width:540px; width:92%; max-height:88vh; overflow-y:auto; color:#fff;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:12px;">
        <h2 style="color:var(--accent-gold); font-size:20px; margin:0;">🏙 ВЫЛАЗКА НА ПОВЕРХНОСТЬ</h2>
        <span style="font-size:11px; color:${isNight ? '#e74c3c' : '#f1c40f'}; font-weight:bold;">${isNight ? '🌙 НОЧЬ (ПОВЫШЕННЫЙ РИСК)' : '☀️ ДЕНЬ'}</span>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-weight:bold; font-size:12px; color:var(--accent-gold); margin-bottom:6px;">1. ВЫБЕРИТЕ ТОЧКУ НАЗНАЧЕНИЯ:</div>
        ${destHtml}
      </div>

      <div style="margin-bottom:14px;">
        <div style="font-weight:bold; font-size:12px; color:var(--accent-gold); margin-bottom:6px;">2. ВЫБЕРИТЕ ОТРЯД (1–3 ВЫЖИВШИХ):</div>
        <div style="max-height:140px; overflow-y:auto; border:1px solid #333; border-radius:6px; padding:4px;">
          ${teamHtml}
        </div>
      </div>

      <div style="display:flex; gap:12px; justify-content:flex-end;">
        <button class="modal-btn" id="m-btn-1" style="background:#27ae60; color:#fff;">ОТПРАВИТЬ ОТРЯД ▶</button>
        <button class="modal-btn" style="background:#333; color:#fff;" id="m-btn-2">ОТМЕНА</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  const b1 = document.getElementById('m-btn-1');
  const b2 = document.getElementById('m-btn-2');

  if (b1) {
    b1.onclick = () => {
      const checked = [...document.querySelectorAll('.scav-check:checked')].map(cb => cb.value);
      const selDest = document.querySelector('input[name="scav-dest"]:checked')?.value || 'food_mart';
      if (confirm(checked, selDest)) modal.style.display = 'none';
    };
  }

  if (b2) {
    b2.onclick = () => { modal.style.display = 'none'; };
  }
}

eventBus.on('scavenge_dialog', showScavengeDialog);
