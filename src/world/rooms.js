/**
 * Room Catalog, Placement Validation, Construction, Demolition, and Auto-placement.
 * Emits events via eventBus; zero dependencies on render or UI.
 */
import { MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED, C_BEDROCK } from '../core/constants.js';
import { G } from '../core/state.js';
import { eventBus } from '../core/event_bus.js';

export const ROOM_CATALOG = [
  { type: 'quarters', name: 'BUNKS (СПАЛЬНЯ)', icon: '🛏️', w: 6, h: 4, matCost: 15, desc: 'Жилые места (+6 мест к лимиту).' },
  { type: 'latrine', name: 'LATRINE (САНУЗЕЛ)', icon: '💧', w: 4, h: 3, matCost: 10, desc: 'Санитария, предотвращает болезни.' },
  { type: 'farm', name: 'MUSHROOM FARM', icon: '🌱', w: 6, h: 4, matCost: 20, desc: 'Выращивание грибов (+3 еды/день).' },
  { type: 'generator', name: 'BIKE DYNAMO', icon: '🚴', w: 5, h: 4, matCost: 25, desc: 'Велогенератор Рэя (+15 энергии).' },
  { type: 'waterPump', name: 'WATER PUMP', icon: '🌊', w: 5, h: 4, matCost: 30, desc: 'Откачка воды (+4 воды/день).' },
  { type: 'infirmary', name: 'CLINIC', icon: '🏥', w: 5, h: 4, matCost: 25, desc: 'Лазарет и карантинный блок.' },
  { type: 'kitchen', name: 'MESS HALL', icon: '🍽️', w: 6, h: 3, matCost: 20, desc: 'Столовая и доска законов (+мораль).' },
  { type: 'armory', name: 'ARMORY (ОРУЖЕЙНАЯ)', icon: '🛡️', w: 5, h: 4, matCost: 35, desc: 'Оружейная: +15 к защите и патроны.' },
  { type: 'school', name: 'BELOW SCHOOL', icon: '📚', w: 6, h: 4, matCost: 30, desc: 'Подземная школа (+10% морали).' },
  { type: 'hydro_uv', name: 'UV HYDROPONICS', icon: '🥬', w: 7, h: 4, matCost: 45, desc: 'УФ-гидропоника (+6 еды/день).' },
  { type: 'workshop', name: 'RAY WORKSHOP', icon: '⚙️', w: 5, h: 3, matCost: 25, desc: 'Мастерская (+1 материал/день).' }
];

export function countRoomsByType(type) {
  return G.rooms.filter(r => r.type === type).length;
}

export function isValidPlacement(r, col, row) {
  if (!r) return false;
  if (col < 1 || col + r.w > MAP_COLS - 1) return false;
  if (row < SURFACE_Y || row + r.h > MAP_ROWS - 3) return false;

  // Bedrock collision
  for (let dy = 0; dy < r.h; dy++) {
    for (let dx = 0; dx < r.w; dx++) {
      const gy = row + dy;
      const gx = col + dx;
      if (gy < MAP_ROWS && gx < MAP_COLS) {
        if (G.grid[gy] && G.grid[gy][gx] === C_BEDROCK) return false;
      }
    }
  }

  // Room collision
  for (const er of G.rooms) {
    if (col < er.x + er.w && col + r.w > er.x && row < er.y + er.h && row + r.h > er.y) {
      return false;
    }
  }

  // Blueprint collision
  for (const bp of G.blueprints) {
    if (col < bp.x + bp.w && col + r.w > bp.x && row < bp.y + bp.h && row + r.h > bp.y) {
      return false;
    }
  }

  return true;
}

export function placeBlueprint(r, col, row) {
  if (!isValidPlacement(r, col, row)) {
    eventBus.emit('toast', '⚠ Невозможно построить здесь! Препятствие или пересечение с комнатой.', 'toast-bad');
    eventBus.emit('sound', 'playBad');
    return false;
  }

  G.res.materials = (G.res.materials || 0) - r.matCost;
  const buildDays = Math.max(3, Math.floor(r.matCost * 0.4));
  const bp = {
    id: r.type + '_' + Date.now(),
    type: r.type,
    name: r.name.split(' (')[0],
    icon: r.icon || '🏗️',
    x: col,
    y: row,
    w: r.w,
    h: r.h,
    daysLeft: buildDays,
    totalDays: buildDays,
    matCost: r.matCost,
    workers: 1
  };

  G.blueprints.push(bp);
  G.mechanics.buildQueue.push({ blueprint: bp, daysLeft: buildDays });

  eventBus.emit('log', `🏗 НАЧАТО: ${bp.name} (${buildDays} дн.) на глубине -${(row - SURFACE_Y) * 2}м`);
  eventBus.emit('sound', 'playBuild');
  eventBus.emit('toast', `🏗️ Чертёж «${bp.name}» размещён! Строители приступили к работе.`, 'toast-good');
  eventBus.emit('state:changed');
  return true;
}

export function completeConstruction(bq) {
  const hatchCol = Math.floor(MAP_COLS / 2);
  const bp = bq.blueprint;

  const newRoom = {
    id: bp.id || (bp.type + '_' + Date.now()),
    type: bp.type,
    name: bp.name,
    x: bp.x,
    y: bp.y,
    w: bp.w,
    h: bp.h
  };

  G.rooms.push(newRoom);

  // Excavate grid cells
  for (let dy = 0; dy < newRoom.h; dy++) {
    for (let dx = 0; dx < newRoom.w; dx++) {
      const gy = newRoom.y + dy;
      const gx = newRoom.x + dx;
      if (gy >= 0 && gy < MAP_ROWS && gx >= 0 && gx < MAP_COLS) {
        G.grid[gy][gx] = C_EXCAVATED;
      }
    }
  }

  // Connect to vertical shaft
  for (let r = SURFACE_Y; r <= newRoom.y + newRoom.h; r++) {
    if (r < MAP_ROWS) {
      G.grid[r][hatchCol] = C_EXCAVATED;
      G.grid[r][hatchCol + 1] = C_EXCAVATED;
    }
  }

  // Remove matching blueprint from blueprints list
  const bpIdx = G.blueprints.findIndex(b => b.id === bp.id);
  if (bpIdx !== -1) G.blueprints.splice(bpIdx, 1);

  eventBus.emit('log', `🏗 ПОСТРОЙКА ЗАВЕРШЕНА: ${newRoom.name}!`);
  eventBus.emit('sound', 'playBuild');
  eventBus.emit('toast', `🎉 Сектор «${newRoom.name}» готов к эксплуатации!`, 'toast-good');
  eventBus.emit('room:completed', newRoom);
  eventBus.emit('state:changed');
}

export function demolishAt(col, row) {
  // Check blueprints
  const bpIdx = G.blueprints.findIndex(bp => col >= bp.x && col < bp.x + bp.w && row >= bp.y && row < bp.y + bp.h);
  if (bpIdx !== -1) {
    const bp = G.blueprints[bpIdx];
    G.blueprints.splice(bpIdx, 1);
    const bqIdx = G.mechanics.buildQueue.findIndex(q => q.blueprint && q.blueprint.id === bp.id);
    if (bqIdx !== -1) G.mechanics.buildQueue.splice(bqIdx, 1);
    const refund = bp.matCost || 15;
    G.res.materials = (G.res.materials || 0) + refund;
    eventBus.emit('toast', `💥 Чертёж «${bp.name}» отменён (возврат +${refund} 🪨)`, 'toast-gold');
    eventBus.emit('sound', 'playDemolish');
    eventBus.emit('state:changed');
    return true;
  }

  // Check rooms
  const rIdx = G.rooms.findIndex(r => col >= r.x && col < r.x + r.w && row >= r.y && row < r.y + r.h);
  if (rIdx !== -1) {
    const r = G.rooms[rIdx];
    if (r.id === 'shelter_main') {
      eventBus.emit('toast', '⚠ Главный бункер основателей нельзя сносить!', 'toast-bad');
      eventBus.emit('sound', 'playBad');
      return false;
    }
    const catItem = ROOM_CATALOG.find(c => c.type === r.type);
    const refund = Math.floor((catItem ? catItem.matCost : 20) * 0.5);
    G.rooms.splice(rIdx, 1);
    G.res.materials = (G.res.materials || 0) + refund;
    eventBus.emit('log', `💥 СНОС: ${r.name} (возврат ${refund} 🪨)`);
    eventBus.emit('toast', `💥 Комната «${r.name}» снесена! Получено +${refund} 🪨 материалов.`, 'toast-gold');
    eventBus.emit('sound', 'playDemolish');
    eventBus.emit('state:changed');
    return true;
  }
  return false;
}

export function autoPlaceRoom(roomDef) {
  const hatchCol = Math.floor(MAP_COLS / 2);
  let bestCol = -1, bestRow = -1;

  for (let r = SURFACE_Y + 4; r < MAP_ROWS - 6; r += 2) {
    // Try the nearest free slot first, then further out: each gap becomes a gallery (getCorridors)
    const sides = [];
    for (const gap of [4, 8, 13, 19]) {
      sides.push(hatchCol + 2 + gap, hatchCol - gap - roomDef.w);
    }
    for (const c of sides) {
      if (isValidPlacement(roomDef, c, r)) {
        bestCol = c;
        bestRow = r;
        break;
      }
    }
    if (bestCol !== -1) break;
  }

  if (bestCol !== -1 && bestRow !== -1) {
    placeBlueprint(roomDef, bestCol, bestRow);
    const walt = G.colonists.find(c => c.id === 'walt' || c.role === 'ENG');
    if (walt) {
      walt.thought = `Совет проголосовал за ${roomDef.name}. Начинаю проходку штольни!`;
    }
    return true;
  } else {
    eventBus.emit('log', `⚠ Нет свободного места для автоматического размещения «${roomDef.name}»!`);
    return false;
  }
}

/**
 * Corridors: walkways linking every room to the central shaft (or to the next room on the way).
 * Pure layout data in pixels: [{ x1, x2, y, h }] with y = top edge. Rendering lives in render/corridors.js.
 */
export const CORRIDOR_CELLS_HIGH = 2;

export function getCorridors(state, cell) {
  const rooms = (state.rooms || []).filter(r => r.state !== 'blueprint');
  const hatchCol = Math.floor(MAP_COLS / 2);
  const shaftL = hatchCol * cell;             // left edge of the 2-cell shaft
  const shaftR = (hatchCol + 2) * cell;       // right edge
  const out = [];

  rooms.forEach(r => {
    const left = r.x * cell, right = (r.x + r.w) * cell;
    const top = r.y, bottom = r.y + r.h;
    const spansShaft = left < shaftR && right > shaftL;
    if (spansShaft) return;

    const toRight = right <= shaftL; // room is left of the shaft, so walk right
    let target = toRight ? shaftL : shaftR;

    // Stop at the nearest room in the way (same rows), so chains of rooms connect in turn.
    rooms.forEach(o => {
      if (o === r) return;
      const rowOverlap = o.y < bottom && o.y + o.h > top;
      if (!rowOverlap) return;
      if (toRight) {
        const ol = o.x * cell;
        if (ol >= right && ol < target) target = ol;
      } else {
        const or = (o.x + o.w) * cell;
        if (or <= left && or > target) target = or;
      }
    });

    const x1 = toRight ? right : target;
    const x2 = toRight ? target : left;
    if (x2 - x1 <= 2) return;
    out.push({ x1, x2, y: (bottom - CORRIDOR_CELLS_HIGH) * cell, h: CORRIDOR_CELLS_HIGH * cell });
  });
  return out;
}
