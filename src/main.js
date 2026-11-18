import { G } from './core/state.js';
import { eventBus } from './core/event_bus.js';
import { AudioSys, toggleSound } from './audio/audio_sys.js';
import { initGrid } from './world/grid.js';
import { initRenderer, resizeCanvas } from './render/renderer.js';
import { initInput, setSpeed, setToolMode } from './ui/input.js';
import { updateHUD, toggleMobileHUD, showToast, addLog } from './ui/hud.js';
import {
  openChaptersModal, closeChaptersModal,
  openGameModeModal, closeGameModeModal,
  openWhiteboardModal, closeWhiteboardModal,
  toggleBuildMenu, cancelPlacement
} from './ui/modals.js';
import { cycleCamera } from './render/surveillance.js';
import { startPrologue, finishPrologue, sealBulkheads, colonistsFightBreach, CHAPTERS } from './systems/story.js';
import { handleLawClick } from './systems/laws.js';
import { setGameMode } from './systems/democracy.js';
import { launchSurfaceScavenge } from './systems/events.js';
import { SaveSystem } from './systems/save.js';
import { startLoop } from './core/loop.js';

// Expose globals for HTML inline event handlers & dev console
window.G = G;
window.eventBus = eventBus;
window.AudioSys = AudioSys;
window.toggleSound = toggleSound;
window.setSpeed = setSpeed;
window.setToolMode = setToolMode;
window.cancelPlacement = cancelPlacement;
window.toggleBuildMenu = toggleBuildMenu;
window.toggleMobileHUD = toggleMobileHUD;
window.cycleCamera = cycleCamera;
window.finishPrologue = finishPrologue;
window.openChaptersModal = openChaptersModal;
window.closeChaptersModal = closeChaptersModal;
window.openGameModeModal = openGameModeModal;
window.closeGameModeModal = closeGameModeModal;
window.openWhiteboardModal = openWhiteboardModal;
window.closeWhiteboardModal = closeWhiteboardModal;
window.handleLawClick = handleLawClick;
window.setGameMode = setGameMode;
window.launchSurfaceScavenge = launchSurfaceScavenge;
window.sealBulkheads = sealBulkheads;
window.colonistsFightBreach = colonistsFightBreach;
window.SaveSystem = SaveSystem;

export function initGame() {
  const canvas = document.getElementById('game-canvas') || document.getElementById('c');
  if (!canvas) return;

  initGrid();
  initRenderer(canvas);
  initInput(canvas);
  startPrologue();

  // Check if localStorage save exists
  if (SaveSystem.hasSave()) {
    const saveTime = document.getElementById('sb-save-time');
    if (saveTime) {
      saveTime.innerHTML = `<a href="#" onclick="SaveSystem.loadGame(); return false;" style="color:#38bdf8; text-decoration:underline;">Загрузить</a>`;
    }
    showToast('💾 Найдено сохранение в браузере! Нажмите «Загрузить» в меню', 'toast-gold');
  }

  // Check URL params for test runner
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'true') {
    import('./tests/test_runner.js')
      .then(m => m.runTests())
      .catch(err => console.error('Failed to load test runner:', err));
  }

  startLoop();
}

window.addEventListener('DOMContentLoaded', initGame);
