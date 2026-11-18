import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';
import { calcResourceRates } from './resources.js';
import { updateGameModeUI } from './democracy.js';

export const SaveSystem = {
  KEY: 'gamez_underground_save_v2',
  LEGACY_KEY: 'gamez_underground_save_v1',
  CURRENT_VERSION: 2,

  saveGame(isAuto = false) {
    try {
      const saveData = {
        version: this.CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        day: G.day,
        timeHour: G.timeHour,
        timeMin: Math.floor(G.timeMin),
        speed: G.speed,
        activeChapterId: G.activeChapterId,
        cam: { x: Math.round(G.cam.x), y: Math.round(G.cam.y) },
        res: { ...G.res },
        popHistory: [...G.popHistory],
        populationOverride: G.populationOverride,
        colonists: G.colonists.map(c => ({
          id: c.id, name: c.name, age: c.age, role: c.role, color: c.color, icon: c.icon,
          hp: c.hp, x: Math.round(c.x), y: Math.round(c.y), status: c.status, task: c.task, thought: c.thought
        })),
        rooms: G.rooms.map(r => ({ id: r.id, type: r.type, name: r.name, x: r.x, y: r.y, w: r.w, h: r.h })),
        blueprints: G.blueprints.map(bp => ({ id: bp.id, type: bp.type, name: bp.name, icon: bp.icon, x: bp.x, y: bp.y, w: bp.w, h: bp.h, daysLeft: bp.daysLeft, totalDays: bp.totalDays, matCost: bp.matCost })),
        grid: G.grid,
        gameMode: G.gameMode || 'democracy',
        laws: G.laws ? { ...G.laws } : null,
        research: G.research ? {
          currentTechId: G.research.currentTechId,
          progress: G.research.progress || 0,
          completed: [...(G.research.completed || [])]
        } : null,
        mechanics: {
          morale: G.mechanics.morale,
          defenseRating: G.mechanics.defenseRating,
          popCap: G.mechanics.popCap,
          totalDeaths: G.mechanics.totalDeaths,
          totalBorn: G.mechanics.totalBorn,
          scavengeTeam: [...G.mechanics.scavengeTeam],
          scavengeDayLeft: G.mechanics.scavengeDayLeft,
          sickColonists: [...G.mechanics.sickColonists],
          buildQueue: G.mechanics.buildQueue.map(q => ({ blueprint: q.blueprint, daysLeft: q.daysLeft })),
          eventLog: G.mechanics.eventLog.slice(-20)
        }
      };

      localStorage.setItem(this.KEY, JSON.stringify(saveData));
      const saveTime = document.getElementById('sb-save-time');
      if (saveTime) {
        const timeStr = `${G.timeHour.toString().padStart(2, '0')}:${Math.floor(G.timeMin).toString().padStart(2, '0')}`;
        saveTime.textContent = `Д${G.day} ${timeStr}`;
      }

      if (isAuto) {
        eventBus.emit('toast', { text: `💾 Автосохранение: День ${G.day}`, style: 'toast-gold' });
      } else {
        eventBus.emit('toast', { text: `💾 Прогресс успешно сохранён! (День ${G.day})`, style: 'toast-good' });
        eventBus.emit('sound', { type: 'good' });
      }
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      eventBus.emit('toast', { text: '⚠ Ошибка сохранения в localStorage!', style: 'toast-bad' });
      return false;
    }
  },

  loadGame() {
    try {
      let raw = localStorage.getItem(this.KEY);
      if (!raw) {
        raw = localStorage.getItem(this.LEGACY_KEY);
      }
      if (!raw) {
        eventBus.emit('toast', { text: '⚠ Нет сохранённой игры в localStorage!', style: 'toast-bad' });
        eventBus.emit('sound', { type: 'bad' });
        return false;
      }

      const d = JSON.parse(raw);
      G.day = d.day || 1;
      G.timeHour = d.timeHour ?? 12;
      G.timeMin = d.timeMin ?? 0;
      G.speed = d.speed ?? 1;
      G.activeChapterId = d.activeChapterId || 'ch1';
      if (d.cam) { G.cam.x = d.cam.x; G.cam.y = d.cam.y; }
      if (d.res) G.res = { ...d.res };
      if (d.popHistory) G.popHistory = [...d.popHistory];
      G.populationOverride = d.populationOverride;
      if (d.colonists) G.colonists = d.colonists;
      if (d.rooms) G.rooms = d.rooms;
      if (d.blueprints) G.blueprints = d.blueprints;
      if (d.grid) G.grid = d.grid;
      if (d.mechanics) {
        Object.assign(G.mechanics, d.mechanics);
      }
      if (d.gameMode) G.gameMode = d.gameMode;
      if (d.laws) G.laws = d.laws;
      if (d.research) G.research = d.research;
      updateGameModeUI();

      if (G.state === 'prologue') {
        eventBus.emit('prologue:finish');
      }

      calcResourceRates();
      eventBus.emit('hud_update');
      eventBus.emit('render_request');

      const saveTime = document.getElementById('sb-save-time');
      if (saveTime) {
        saveTime.textContent = `Д${G.day} (Загружено)`;
      }

      eventBus.emit('toast', { text: `📂 Игра успешно загружена! (День ${G.day})`, style: 'toast-good' });
      eventBus.emit('sound', { type: 'good' });
      return true;
    } catch (err) {
      console.error('Load failed:', err);
      eventBus.emit('toast', { text: '⚠ Ошибка чтения файла сохранения!', style: 'toast-bad' });
      eventBus.emit('sound', { type: 'bad' });
      return false;
    }
  },

  hasSave() {
    return !!(localStorage.getItem(this.KEY) || localStorage.getItem(this.LEGACY_KEY));
  },

  resetGame() {
    if (confirm('Начать новую игру? Текущее сохранение в браузере будет очищено.')) {
      localStorage.removeItem(this.KEY);
      localStorage.removeItem(this.LEGACY_KEY);
      location.reload();
    }
  }
};
