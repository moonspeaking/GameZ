/**
 * Grid initialization and terrain tile management.
 * Pure state modifier, depends only on core constants and state.
 */
import { MAP_COLS, MAP_ROWS, SURFACE_Y, CELL_SIZE, C_EXCAVATED, C_DIRT, C_STONE, C_BEDROCK } from '../core/constants.js';
import { G } from '../core/state.js';

export function initGrid() {
  G.grid = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row = [];
    for (let c = 0; c < MAP_COLS; c++) {
      if (r < SURFACE_Y) {
        row.push(C_EXCAVATED);
      } else if (r >= MAP_ROWS - 6) {
        row.push(C_BEDROCK);
      } else if (r > 38) {
        row.push(C_STONE);
      } else {
        row.push(C_DIRT);
      }
    }
    G.grid.push(row);
  }

  // Central Vertical Concrete Shaft
  const hatchCol = Math.floor(MAP_COLS / 2);
  for (let r = SURFACE_Y; r <= SURFACE_Y + 14; r++) {
    G.grid[r][hatchCol] = C_EXCAVATED;
    G.grid[r][hatchCol + 1] = C_EXCAVATED;
  }

  // Initial Shelter Bunker Room (Shelter 4)
  const shelterY = SURFACE_Y + 4;
  G.rooms = [{
    id: 'shelter_main',
    type: 'bunker',
    name: 'SHELTER 4',
    x: hatchCol - 5,
    y: shelterY,
    w: 12,
    h: 4,
    color: '#343831'
  }];

  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 12; dx++) {
      G.grid[shelterY + dy][hatchCol - 5 + dx] = C_EXCAVATED;
    }
  }

  // Position 4 Survivors inside shelter
  if (G.colonists.length >= 4) {
    G.colonists[0].x = (hatchCol - 3.5) * CELL_SIZE; G.colonists[0].y = (shelterY + 2.5) * CELL_SIZE;
    G.colonists[1].x = (hatchCol - 1.5) * CELL_SIZE; G.colonists[1].y = (shelterY + 2.5) * CELL_SIZE;
    G.colonists[2].x = (hatchCol + 1.5) * CELL_SIZE; G.colonists[2].y = (shelterY + 2.5) * CELL_SIZE;
    G.colonists[3].x = (hatchCol + 3.5) * CELL_SIZE; G.colonists[3].y = (shelterY + 2.5) * CELL_SIZE;
  }
}
