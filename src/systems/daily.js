/**
 * Daily tick: production, consumption, laws, research, morale, construction,
 * newcomers, births and random events. Registered on the 'new_day' event in bootstrap.js.
 */
import { G } from '../core/state.js';
import { CELL_SIZE, SURFACE_Y } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { calcResourceRates } from './resources.js';
import { evaluateAutonomousBuilding } from './democracy.js';
import { SaveSystem } from './save.js';
import { triggerNewcomerEvent, triggerRandomEvent, resolveScavenge } from './events.js';
import { completeConstruction } from '../world/rooms.js';
import { getTotalAlivePop } from '../entities/colonists.js';
import { progressDailyResearch } from './research.js';
import { updateColonistMoods, checkMoraleIncidents } from './morale.js';

export function onNewDay() {
  if (!G.mechanics.enabled) return;

  const pop = getTotalAlivePop();
  const { foodConsumption, waterConsumption } = calcResourceRates();

  // Production
  G.res.food += G.mechanics.foodProduction;
  G.res.water += G.mechanics.waterProduction;
  G.res.power = Math.min(100, G.res.power + G.mechanics.powerProduction * 0.1);

  // Floating production indicators
  if (G.mechanics.foodProduction > 0) {
    eventBus.emit('floating_text', { x: 140, y: (SURFACE_Y + 5) * CELL_SIZE, text: `+${G.mechanics.foodProduction} 🍞`, color: '#2ecc71' });
  }
  if (G.mechanics.waterProduction > 0) {
    eventBus.emit('floating_text', { x: 220, y: (SURFACE_Y + 5) * CELL_SIZE, text: `+${G.mechanics.waterProduction} 💧`, color: '#3498db' });
  }

  // Electrical blackout check & fear of darkness
  if (G.res.power <= 0) {
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 2);
    eventBus.emit('log', '⚠️ Блэкаут: темнота и холод в бункере снижают мораль (-2)');
  }

  // Consumption
  G.res.food = Math.max(0, G.res.food - foodConsumption);
  G.res.water = Math.max(0, G.res.water - waterConsumption);
  G.res.fuel = Math.max(0, G.res.fuel - 0.3);

  // Medicine consumption for sick colonists
  if (G.mechanics.sickColonists.length > 0 && G.res.med > 0) {
    G.res.med = Math.max(0, G.res.med - G.mechanics.sickColonists.length * 0.5);
    G.mechanics.sickColonists = G.mechanics.sickColonists.filter(id => {
      if (Math.random() < 0.3) {
        const c = G.colonists.find(cc => cc.id === id);
        if (c) { c.hp = Math.min(100, c.hp + 20); }
        eventBus.emit('log', `${c?.name || id} выздоравливает`);
        return false;
      }
      return true;
    });
  }

  // Starvation / dehydration damage
  if (G.res.food <= 0) {
    G.colonists.filter(c => c.status === 'alive').forEach(c => {
      c.hp -= 5;
      if (c.hp <= 0) {
        eventBus.emit('colonist:death', { id: c.id, cause: 'Умер от голода', day: G.day });
      }
    });
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 5);
  }

  if (G.res.water <= 0) {
    G.colonists.filter(c => c.status === 'alive').forEach(c => {
      c.hp -= 8;
      if (c.hp <= 0) {
        eventBus.emit('colonist:death', { id: c.id, cause: 'Умер от обезвоживания', day: G.day });
      }
    });
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 8);
  }

  // Morale
  if (G.res.food > pop * 2 && G.res.water > pop * 2) {
    G.mechanics.morale = Math.min(100, G.mechanics.morale + 1);
  }
  if (G.mechanics.sickColonists.length > pop * 0.3) {
    G.mechanics.morale = Math.max(0, G.mechanics.morale - 2);
  }

  // Scavenge return
  if (G.mechanics.scavengeDayLeft > 0) {
    G.mechanics.scavengeDayLeft--;
    if (G.mechanics.scavengeDayLeft <= 0) {
      resolveScavenge();
    }
  }

  // Build queue
  for (let idx = G.mechanics.buildQueue.length - 1; idx >= 0; idx--) {
    const bq = G.mechanics.buildQueue[idx];
    bq.daysLeft--;
    if (bq.blueprint) bq.blueprint.daysLeft = bq.daysLeft;
    if (bq.daysLeft <= 0) {
      completeConstruction(bq);
      G.mechanics.buildQueue.splice(idx, 1);
    }
  }

  // Laws daily effects
  if (G.laws) {
    if (G.laws.laborDuty === 'mandatory') {
      G.res.materials = (G.res.materials || 0) + 1.5;
      G.mechanics.morale = Math.max(0, G.mechanics.morale - 1.5);
    }
    if (G.laws.rationing === 'abundant') {
      G.mechanics.morale = Math.min(100, G.mechanics.morale + 1.5);
    } else if (G.laws.rationing === 'strict') {
      G.mechanics.morale = Math.max(0, G.mechanics.morale - 1.0);
    }
  }

  // Daily Science & Tech Research Progress
  progressDailyResearch();

  // Morale: update individual moods and check for incidents
  updateColonistMoods();
  checkMoraleIncidents();

  // Autonomous building
  if (G.day > 2 && G.day % 4 === 0) {
    evaluateAutonomousBuilding();
  }

  // Autosave
  SaveSystem.saveGame(true);

  // Newcomer arrivals
  G.mechanics.daysSinceLastEvent++;
  if (G.day >= G.mechanics.nextNewcomerDay && pop < G.mechanics.popCap) {
    triggerNewcomerEvent();
    const freqMod = G.mechanics.newcomerFreqBonus || 1.0;
    G.mechanics.nextNewcomerDay = G.day + Math.floor((30 + Math.random() * 120) * freqMod);
  }

  // Natural births
  if (pop >= 10 && Math.random() < 0.005 * (pop / 50)) {
    const babyNames = ['ANNA', 'JAKE', 'MILA', 'OSCAR', 'ZARA', 'LEO', 'IRIS', 'MAX', 'EVA', 'NOAH'];
    const name = babyNames[Math.floor(Math.random() * babyNames.length)];
    if (!G.colonists.some(c => c.name === name)) {
      G.colonists.push({
        id: name.toLowerCase() + '_' + G.day,
        name: name,
        age: 0,
        role: 'INFANT',
        color: '#f1c40f',
        icon: '👶',
        hp: 100,
        x: 0, y: 0,
        status: 'alive',
        task: 'Спит',
        thought: ''
      });
      G.mechanics.totalBorn++;
      eventBus.emit('log', `👶 Родился ребенок: ${name}!`);
      eventBus.emit('sound', { type: 'good' });
    }
  }

  // Random events
  if (G.mechanics.daysSinceLastEvent > 20 + Math.random() * 60) {
    triggerRandomEvent();
    G.mechanics.daysSinceLastEvent = 0;
  }

  eventBus.emit('hud_update');
}
