/**
 * Story/chapter UI: dialogue card, journal and inset notes, breach overlay,
 * header labels and the victory screen. DOM only; driven by events from systems/story.js.
 */
import { eventBus } from '../core/event_bus.js';

const INSET_IDS = ['journal-note', 'whiteboard-inset', 'ration-card-inset', 'council-vote-inset', 'radio-broadcast-inset'];
const INSET_DISPLAY = { 'journal-note': 'block' };
const LABEL_IDS = { dayPill: 'top-day-pill', constName: 'sb-const-name', dayText: 'sb-day-text' };

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setDisplay(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
}

eventBus.on('story_insets_reset', () => {
  INSET_IDS.forEach(id => setDisplay(id, 'none'));
  setDisplay('dialogue-card', 'flex');
});

eventBus.on('story_inset', ({ id }) => setDisplay(id, INSET_DISPLAY[id] || 'block'));

eventBus.on('story_journal', ({ day, body, sig }) => {
  const jn = document.getElementById('journal-note');
  if (!jn) return;
  setText('jn-day', day);
  setText('jn-body', body);
  setText('jn-sig', sig);
  jn.style.display = 'block';
});

eventBus.on('story_dialogue', ({ avatar, name, text, rotate }) => {
  setText('dlg-avatar', avatar);
  setText('dlg-name', name);
  setText('dlg-text', rotate ? text : `"${text}"`);
  if (!rotate) setDisplay('dialogue-card', 'flex');
});

eventBus.on('story_label', ({ key, text }) => {
  if (LABEL_IDS[key]) setText(LABEL_IDS[key], text);
});

eventBus.on('breach_overlay', ({ active }) => {
  setDisplay('red-alert-overlay', active ? 'block' : 'none');
  setDisplay('breach-banner', active ? 'flex' : 'none');
});

eventBus.on('victory', () => {
  const modal = document.getElementById('modal-screen');
  if (!modal) return;
  modal.innerHTML = `
    <h1 style="color:var(--accent-gold); font-size:36px; margin-bottom:14px;">ПОБЕДА: 30 ЛЕТ ПОД ЗЕМЛЕЙ!</h1>
    <p style="color:#cfbfad; font-size:15px; max-width:540px; text-align:center; line-height:1.8; margin-bottom:28px;">
      Четверо незнакомцев построили целый подземный мегаполис и сберегли огонь цивилизации под ордой зомби!
    </p>
    <button class="modal-btn" onclick="location.reload()">НАЧАТЬ ЗАНОВО</button>
  `;
  modal.style.display = 'flex';
});
