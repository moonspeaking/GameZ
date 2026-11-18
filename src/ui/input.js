import { G } from '../core/state.js';
import { CELL_SIZE, SURFACE_Y, MAP_ROWS, MAP_COLS, C_EXCAVATED, C_BEDROCK } from '../core/constants.js';
import { eventBus } from '../core/event_bus.js';
import { placeBlueprint, demolishAt } from '../world/rooms.js';
import { showColonistModal, cancelPlacement } from './modals.js';
import { finishPrologue } from '../systems/story.js';

export function setSpeed(sp) {
  G.speed = sp;
  ['flt-p', 'flt-1x', 'flt-2x', 'flt-5x', 'flt-30x'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (sp === 0) document.getElementById('flt-p')?.classList.add('active');
  if (sp === 1) document.getElementById('flt-1x')?.classList.add('active');
  if (sp === 2) document.getElementById('flt-2x')?.classList.add('active');
  if (sp === 5) document.getElementById('flt-5x')?.classList.add('active');
  if (sp === 30) document.getElementById('flt-30x')?.classList.add('active');
}

export function setToolMode(mode) {
  if (G.toolMode === 'place_room' && mode !== 'place_room') {
    cancelPlacement();
  }
  G.toolMode = mode;
  ['btn-tool-build', 'btn-tool-dig', 'btn-tool-demo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (mode === 'dig') {
    document.getElementById('btn-tool-dig')?.classList.add('active');
    eventBus.emit('toast', { text: '⛏️ Режим раскопок: кликайте по грунту для сбора материалов', style: 'toast-gold' });
  } else if (mode === 'demolish') {
    document.getElementById('btn-tool-demo')?.classList.add('active');
    eventBus.emit('toast', { text: '💥 Режим сноса: кликните по чертежу или комнате для демонтажа', style: 'toast-bad' });
  }
}

export function handleCanvasAction(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const worldX = clientX - rect.left + G.cam.x;
  const worldY = clientY - rect.top + G.cam.y;
  const cellC = Math.floor(worldX / CELL_SIZE);
  const cellR = Math.floor(worldY / CELL_SIZE);

  if (G.toolMode === 'dig') {
    if (cellR >= SURFACE_Y && cellR < MAP_ROWS && cellC >= 0 && cellC < MAP_COLS) {
      if (G.grid[cellR] && G.grid[cellR][cellC] !== C_EXCAVATED && G.grid[cellR][cellC] !== C_BEDROCK) {
        G.grid[cellR][cellC] = C_EXCAVATED;
        eventBus.emit('sound', { type: 'pickaxe' });
        const bonus = G.mechanics.miningYieldBonus || 0;
        G.res.materials = (G.res.materials || 0) + 1 + bonus;
        eventBus.emit('hud_update');
      }
    }
  } else if (G.toolMode === 'place_room' && G.placingRoom) {
    placeBlueprint(G.placingRoom, cellC, cellR);
  } else if (G.toolMode === 'demolish') {
    demolishAt(cellC, cellR);
  } else {
    // Check if clicked colonist
    const clicked = G.colonists.find(c => c.status !== 'dead' && Math.hypot(c.x - worldX, c.y - worldY) < 26);
    if (clicked) {
      showColonistModal(clicked);
    }
  }
}

export function initInput(canvas) {
  if (!canvas) return;

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (G.state === 'prologue') finishPrologue();
      else setSpeed(G.speed === 0 ? 1 : 0);
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') G.cam.y -= 30;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') G.cam.y += 30;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') G.cam.x -= 30;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') G.cam.x += 30;
    if (e.code === 'Escape') {
      if (G.toolMode === 'place_room') cancelPlacement();
      else if (G.toolMode !== 'select') setToolMode('select');
    }
  });

  let isMouseDown = false;
  let lastMouseX = 0, lastMouseY = 0;

  canvas.addEventListener('mousedown', e => {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    handleCanvasAction(canvas, e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const worldX = e.clientX - rect.left + G.cam.x;
    const worldY = e.clientY - rect.top + G.cam.y;
    G.hoverCell.c = Math.floor(worldX / CELL_SIZE);
    G.hoverCell.r = Math.floor(worldY / CELL_SIZE);

    if (isMouseDown && G.toolMode !== 'dig' && G.toolMode !== 'place_room') {
      G.cam.x -= (e.clientX - lastMouseX);
      G.cam.y -= (e.clientY - lastMouseY);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  window.addEventListener('mouseup', () => { isMouseDown = false; });
  canvas.addEventListener('wheel', e => {
    G.cam.y += e.deltaY * 0.4;
    e.preventDefault();
  }, { passive: false });

  // Touch Handling
  let touchStartX = 0, touchStartY = 0;
  let touchStartTime = 0;
  let initialPinchDist = null;
  let isTouching = false;

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastMouseX = touchStartX;
      lastMouseY = touchStartY;
      touchStartTime = performance.now();
      initialPinchDist = null;
    } else if (e.touches.length === 2) {
      isTouching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isTouching) return;

    if (e.touches.length === 1) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - lastMouseX;
      const dy = curY - lastMouseY;

      const rect = canvas.getBoundingClientRect();
      const worldX = curX - rect.left + G.cam.x;
      const worldY = curY - rect.top + G.cam.y;
      G.hoverCell.c = Math.floor(worldX / CELL_SIZE);
      G.hoverCell.r = Math.floor(worldY / CELL_SIZE);

      if (G.toolMode !== 'dig' && G.toolMode !== 'place_room') {
        G.cam.x -= dx;
        G.cam.y -= dy;
      }
      lastMouseX = curX;
      lastMouseY = curY;
    } else if (e.touches.length === 2 && initialPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const curDist = Math.hypot(dx, dy);
      const delta = curDist - initialPinchDist;
      G.cam.y -= delta * 0.8;
      initialPinchDist = curDist;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      const elapsed = performance.now() - touchStartTime;
      const totalDist = Math.hypot(lastMouseX - touchStartX, lastMouseY - touchStartY);

      if (elapsed < 320 && totalDist < 16) {
        handleCanvasAction(canvas, touchStartX, touchStartY);
      }
      isTouching = false;
      initialPinchDist = null;
    }
  }, { passive: false });
}
