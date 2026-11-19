/**
 * Council vote modal view. DOM only: renders the ballot prepared by systems/democracy.js
 * and reports the player's choice through ballot.cast('A' | 'B').
 */
import { eventBus } from '../core/event_bus.js';

export function showCouncilVote(ballot) {
  const { title, prompt, optA, optB, votes, yesCount, noCount, cast, fallback } = ballot;
  const modal = document.getElementById('council-vote-modal');
  if (!modal) {
    eventBus.emit('modal:decision', fallback);
    return;
  }

  const tEl = document.getElementById('cv-title');
  const pEl = document.getElementById('cv-prompt-text');
  const dEl = document.getElementById('cv-desc-text');
  const vEl = document.getElementById('cv-voters-count');
  if (tEl) tEl.textContent = title || 'СОВЕТ КОЛОНИИ: ГОЛОСОВАНИЕ';
  if (pEl) pEl.textContent = prompt;
  if (dEl) dEl.textContent = `Вариант А: ${optA} | Вариант Б: ${optB}`;
  if (vEl) vEl.textContent = `${votes.length} граждан`;

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

  const btnA = document.getElementById('cv-btn-opt-a');
  const btnB = document.getElementById('cv-btn-opt-b');

  if (btnA) {
    btnA.textContent = `👍 ГОЛОСУЮ ЗА (${optA.split(' (')[0]})`;
    btnA.onclick = () => { modal.style.display = 'none'; cast('A'); };
  }
  if (btnB) {
    btnB.textContent = `👎 ГОЛОСУЮ ПРОТИВ (${optB.split(' (')[0]})`;
    btnB.onclick = () => { modal.style.display = 'none'; cast('B'); };
  }
}

eventBus.on('council_vote', showCouncilVote);
