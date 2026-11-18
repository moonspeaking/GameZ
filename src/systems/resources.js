import { G } from '../core/state.js';
import { getTotalAlivePop } from '../entities/colonists.js';

export function countRoomsByType(type) {
  return G.rooms.filter(r => r.type === type).length;
}

export function calcResourceRates() {
  const pop = getTotalAlivePop();
  const farms = countRoomsByType('farm');
  const pumps = countRoomsByType('waterPump');
  const gens = countRoomsByType('generator');

  const hydroFarms = countRoomsByType('hydro_uv');
  const workshops = countRoomsByType('workshop');
  const schools = countRoomsByType('school');

  // Food: mushroom farms give 3.0, UV hydroponics give 6.0/day
  const foodBonus = G.mechanics.foodBonusMultiplier || 1.0;
  G.mechanics.foodProduction = (farms * 3.0 + hydroFarms * 6.0) * foodBonus;

  // Rationing Law multiplier
  let foodMultiplier = 1.0;
  if (G.laws && G.laws.rationing === 'strict') foodMultiplier = 0.7;
  else if (G.laws && G.laws.rationing === 'abundant') foodMultiplier = 1.4;
  const foodConsumption = pop * 0.15 * foodMultiplier;

  // Water: each pump produces 4/day, pop consumes 0.12/person/day, hydro turbines give unlimited
  const hasHydro = G.rooms.some(r => r.id === 'hydro_pump' || (r.name && r.name.includes('HYDRO')));
  G.mechanics.waterProduction = hasHydro ? Math.max(pop * 0.2, pumps * 4) : pumps * 4;
  const waterDrain = G.mechanics.waterDrainMultiplier || 1.0;
  const waterConsumption = pop * 0.12 * waterDrain;

  // Power: generators produce 15/day each, hydro gives 100
  G.mechanics.powerProduction = hasHydro ? 100 : gens * 15;

  // Pop cap: base 8 + 6 per quarters/bunker room
  const quarters = G.rooms.filter(r => r.type === 'bunker' || r.type === 'quarters').length;
  G.mechanics.popCap = 8 + quarters * 6;

  // Defense: base 10 + 15 per armory/guard room + 2 per guard colonist + curfew bonus + tech bonus
  const armories = G.rooms.filter(r => (r.name && (r.name.includes('ARMORY') || r.name.includes('GUARD'))) || r.type === 'armory').length;
  const guards = G.colonists.filter(c => c.role === 'GUARD' && c.status === 'alive').length;
  const curfewBonus = (G.laws && G.laws.curfew) ? 10 : 0;
  const baseDefBonus = G.mechanics.baseDefenseBonus || 0;
  G.mechanics.defenseRating = 10 + armories * 15 + guards * 2 + Math.floor(G.res.ammo / 10) + curfewBonus + baseDefBonus;

  // Workshop materials production and school morale
  if (workshops > 0) G.res.materials = (G.res.materials || 0) + workshops * 0.5;
  if (schools > 0) G.mechanics.morale = Math.min(100, G.mechanics.morale + 0.5);

  return { foodConsumption, waterConsumption };
}
