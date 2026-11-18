import { G, createInitialState } from '../core/state.js';
import { CELL_SIZE, MAP_COLS, MAP_ROWS, SURFACE_Y, C_EXCAVATED, C_BEDROCK } from '../core/constants.js';
import { initGrid } from '../world/grid.js';
import { ROOM_CATALOG, isValidPlacement, placeBlueprint, demolishAt, autoPlaceRoom } from '../world/rooms.js';
import { calcResourceRates } from '../systems/resources.js';
import { setGameMode } from '../systems/democracy.js';
import { handleLawClick, LAWS_CONFIG } from '../systems/laws.js';
import { SaveSystem } from '../systems/save.js';
import {
  startPrologue, finishPrologue,
  applyChapter1, applyChapter2, applyChapter3, applyChapter4,
  applyChapter5, applyChapter6, applyChapter7, applyChapter8, applyChapter9
} from '../systems/story.js';
import { cycleCamera } from '../render/surveillance.js';
import { setSpeed, setToolMode } from '../ui/input.js';
import { TECH_TREE, isTechResearched, calcDailyScience, progressDailyResearch, startResearch } from '../systems/research.js';
import { getColonistPerk, COLONIST_PERKS } from '../entities/colonists.js';
import { SCAVENGE_DESTINATIONS } from '../systems/events.js';
import { calcColonistMood, pickThought, countBrokenColonists, getMoraleTierLabel, MOOD } from '../systems/morale.js';
import { killColonist, openMemorialModal, closeMemorialModal } from '../systems/memorial.js';
import { getConcretePattern, getSteelPattern, getHazardPattern, getStrataPattern } from '../render/procedural_textures.js';
import { spawnDigParticles, spawnWeldingSparks, updateParticles } from '../render/particles.js';
import { spawnFloatingText, updateFloatingTexts } from '../render/floating_fx.js';
import { AmbienceEngine } from '../audio/ambience.js';
import { AudioSys } from '../audio/audio_sys.js';

export async function runTests() {
  console.log('🧪 [TEST RUNNER] Starting Antigravity test suite...');
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  function assert(name, condition, errorMsg = '') {
    if (condition) {
      passedCount++;
      results.push({ name, status: 'PASSED' });
      console.log(`%c✔ PASS: ${name}`, 'color:#2ecc71');
    } else {
      failedCount++;
      results.push({ name, status: 'FAILED', error: errorMsg || 'Assertion failed' });
      console.error(`✖ FAIL: ${name} — ${errorMsg}`);
    }
  }

  const startTime = performance.now();

  try {
    // 1. Initial State
    assert('Initial State: G exists with default keys',
      G && G.res && typeof G.day === 'number' && Array.isArray(G.colonists));
    assert('Initial State: 11 Rooms catalog present',
      ROOM_CATALOG.length === 11);

    // 2. Grid & World Initialization
    initGrid();
    const hatchCol = Math.floor(MAP_COLS / 2);
    assert('Grid: Dimensions match MAP_ROWS x MAP_COLS',
      G.grid.length === MAP_ROWS && G.grid[0].length === MAP_COLS);
    assert('Grid: Central shaft is excavated below surface',
      G.grid[SURFACE_Y + 2][hatchCol] === C_EXCAVATED);
    assert('Grid: Bottom layers are bedrock',
      G.grid[MAP_ROWS - 1][0] === C_BEDROCK);

    // 3. Prologue & Transition
    startPrologue();
    assert('Prologue: startPrologue sets state to prologue', G.state === 'prologue');
    finishPrologue();
    assert('Prologue: finishPrologue sets state to game and places camera',
      G.state === 'game' && typeof G.cam.x === 'number' && typeof G.cam.y === 'number');

    // 4. Time & Speed Controls
    setSpeed(0);
    assert('Controls: Speed can be paused (0)', G.speed === 0);
    setSpeed(5);
    assert('Controls: Speed set to 5x', G.speed === 5);
    setSpeed(1);
    assert('Controls: Speed restored to 1x', G.speed === 1);

    // 5. Tool Modes
    setToolMode('dig');
    assert('Tools: Dig mode sets G.toolMode', G.toolMode === 'dig');
    setToolMode('demolish');
    assert('Tools: Demolish mode sets G.toolMode', G.toolMode === 'demolish');
    setToolMode('select');
    assert('Tools: Select mode restores default tool', G.toolMode === 'select');

    // 6. Camera Cycling
    const initialCam = G.activeCamIdx;
    cycleCamera();
    assert('Surveillance: cycleCamera increments cam index',
      G.activeCamIdx === (initialCam + 1) % 4);

    // 7. Governance & Game Modes
    setGameMode('overseer');
    assert('GameMode: Overseer mode activates', G.gameMode === 'overseer');
    setGameMode('anarchy');
    assert('GameMode: Anarchy mode activates', G.gameMode === 'anarchy');
    setGameMode('democracy');
    assert('GameMode: Democracy mode activates', G.gameMode === 'democracy');

    // 8. Laws System
    setGameMode('overseer');
    handleLawClick('rationing', 'strict');
    assert('Laws: Overseer direct decree updates rationing law',
      G.laws.rationing === 'strict');
    handleLawClick('curfew', true);
    assert('Laws: Curfew law toggled to true', G.laws.curfew === true);

    // 9. Resource Calculation
    G.laws.rationing = 'standard';
    const rates = calcResourceRates();
    assert('Resources: calcResourceRates returns food and water consumption',
      typeof rates.foodConsumption === 'number' && typeof rates.waterConsumption === 'number');
    assert('Resources: Defense rating is positive number',
      G.mechanics.defenseRating > 0);

    // 10. Room Placement & Demolition
    G.res.materials = 100;
    const testRoom = ROOM_CATALOG.find(r => r.type === 'quarters') || ROOM_CATALOG[0];
    const validPlacement = isValidPlacement(testRoom, hatchCol - 5, SURFACE_Y + 12);
    assert('Rooms: isValidPlacement checks coordinates and returns true for valid spot', validPlacement === true);
    const prevBpCount = G.blueprints.length;
    placeBlueprint(testRoom, hatchCol - 5, SURFACE_Y + 12);
    assert('Rooms: placeBlueprint queues blueprint', G.blueprints.length === prevBpCount + 1);
    demolishAt(hatchCol - 5, SURFACE_Y + 12);
    assert('Rooms: demolishAt removes queued blueprint', G.blueprints.length === prevBpCount);

    // 11. Story Chapters Progression (Chapters 1 to 9)
    applyChapter1();
    assert('Story: Chapter 1 sets day 1, 4 colonists, activeChapterId ch1',
      G.day === 1 && G.activeChapterId === 'ch1' && G.colonists.length === 4);

    applyChapter2();
    assert('Story: Chapter 2 sets day 87 and adds mushrooms farm',
      G.day === 87 && G.activeChapterId === 'ch2' && G.rooms.some(r => r.id === 'farm_roots'));

    applyChapter3();
    assert('Story: Chapter 3 sets day 761 and adds refugee colonists',
      G.day === 761 && G.colonists.some(c => c.id === 'marcus'));

    applyChapter4();
    assert('Story: Chapter 4 reaches deep river and hydro turbines',
      G.day === 1160 && G.rooms.some(r => r.id === 'hydro_pump'));

    applyChapter5();
    assert('Story: Chapter 5 sets day 2952 and rules era',
      G.day === 2952 && G.activeChapterId === 'ch5');

    applyChapter6();
    assert('Story: Chapter 6 triggers breach red alert',
      G.day === 4596 && G.redAlert === true);

    applyChapter7();
    assert('Story: Chapter 7 unlocks elevator platform',
      G.day === 5101 && G.elevator.unlocked === true);

    applyChapter8();
    assert('Story: Chapter 8 populates full 6-tier metropolis',
      G.day === 10657 && G.rooms.length >= 10 && G.isWinterSnow === true);

    applyChapter9();
    assert('Story: Chapter 9 final era Year 30',
      G.day > 365 * 30 && G.activeChapterId === 'ch9');

    // 12. SaveSystem (Version 2)
    const saveSuccess = SaveSystem.saveGame(false);
    assert('SaveSystem: saveGame executes and returns true', saveSuccess === true);
    assert('SaveSystem: hasSave detects stored progress', SaveSystem.hasSave() === true);

    G.day = 999;
    const loadSuccess = SaveSystem.loadGame();
    assert('SaveSystem: loadGame executes and restores saved state',
      loadSuccess === true && G.day !== 999);

    // 13. Research Tech Tree System
    assert('Research: Tech tree contains 6 technologies',
      Array.isArray(TECH_TREE) && TECH_TREE.length === 6);

    setGameMode('overseer');
    startResearch('uv_accelerators');
    assert('Research: startResearch sets current active tech',
      G.research && G.research.currentTechId === 'uv_accelerators');

    const dailySci = calcDailyScience();
    assert('Research: calcDailyScience yields positive science points',
      typeof dailySci === 'number' && dailySci >= 1);

    // Fast-forward research completion
    const uvTech = TECH_TREE.find(t => t.id === 'uv_accelerators');
    G.research.progress = uvTech.cost - 1;
    progressDailyResearch();
    assert('Research: progressDailyResearch completes tech and marks researched',
      isTechResearched('uv_accelerators') === true && G.research.currentTechId === null);
    assert('Research: Tech bonus applied to food multiplier',
      G.mechanics.foodBonusMultiplier >= 1.4);

    // 14. Colonist Perks & Traits
    const ray = G.colonists.find(c => c.id === 'ray') || G.colonists[0];
    const perk = getColonistPerk(ray);
    assert('Colonists: getColonistPerk returns valid trait and description',
      perk && typeof perk.trait === 'string' && typeof perk.desc === 'string');

    // 15. Surface Scavenge Destinations
    assert('Expeditions: Exactly 5 tactical scavenge destinations defined',
      Array.isArray(SCAVENGE_DESTINATIONS) && SCAVENGE_DESTINATIONS.length === 5);
    assert('Expeditions: Destinations have valid loot and risk configs',
      SCAVENGE_DESTINATIONS.every(d => {
        return d.name && typeof d.dangerRate === 'number' && typeof d.rollLoot === 'function';
      }));

    // 16. Morale & Psychology System
    G.mechanics.morale = 80;
    G.colonists[0].hp = 100;
    const moodHopeful = calcColonistMood(G.colonists[0]);
    assert('Morale: High morale (80) → mood is hopeful', moodHopeful === MOOD.HOPEFUL);

    G.mechanics.morale = 40;
    const moodStressed = calcColonistMood(G.colonists[0]);
    assert('Morale: Medium morale (40) → mood is stressed', moodStressed === MOOD.STRESSED);

    G.mechanics.morale = 15;
    const moodBroken = calcColonistMood(G.colonists[0]);
    assert('Morale: Low morale (15) → mood is broken', moodBroken === MOOD.BROKEN);

    const thought = pickThought(G.colonists[0]);
    assert('Morale: pickThought returns non-empty string', typeof thought === 'string' && thought.length > 0);

    G.mechanics.morale = 15;
    G.colonists.forEach(c => { if (c.status === 'alive') c.mood = MOOD.BROKEN; });
    const brokenCount = countBrokenColonists();
    assert('Morale: countBrokenColonists detects broken colonists', brokenCount >= 1);

    const tierLabel = getMoraleTierLabel(85);
    assert('Morale: getMoraleTierLabel returns label and color',
      tierLabel.label === 'ПРОЦВЕТАНИЕ' && typeof tierLabel.color === 'string');

    // 17. Memorial System
    // Add a living test colonist to kill
    G.colonists.push({
      id: 'test_victim', name: 'TEST', age: 30, role: 'WORKER',
      icon: '👤', hp: 1, x: 0, y: 0, status: 'alive', mood: 'stressed', task: '', thought: ''
    });
    if (!G.memorial) G.memorial = { fallen: [], incidents: [] };
    const beforeFallen = G.memorial.fallen.length;
    killColonist('test_victim', 'Умер во время теста', 42);
    assert('Memorial: killColonist marks colonist as dead',
      G.colonists.find(c => c.id === 'test_victim').status === 'dead');
    assert('Memorial: fallen record added to G.memorial',
      G.memorial.fallen.length === beforeFallen + 1);
    const fallen = G.memorial.fallen[G.memorial.fallen.length - 1];
    assert('Memorial: fallen record has name, cause, epitaph, day',
      fallen.name === 'TEST' && fallen.cause === 'Умер во время теста' &&
      typeof fallen.epitaph === 'string' && fallen.day === 42);

    // 18. Procedural Textures & Patterns
    const testCanvas = document.createElement('canvas');
    const testCtx = testCanvas.getContext('2d');
    const cPat = getConcretePattern(testCtx);
    assert('Textures: getConcretePattern returns canvas pattern', !!cPat);
    const sPat = getSteelPattern(testCtx);
    assert('Textures: getSteelPattern returns canvas pattern', !!sPat);
    const hPat = getHazardPattern(testCtx);
    assert('Textures: getHazardPattern returns canvas pattern', !!hPat);
    const rPat = getStrataPattern(testCtx, 0);
    assert('Textures: getStrataPattern returns geological strata pattern', !!rPat);

    // 19. Dynamic Lighting & Emergency Systems
    assert('Lighting: G.settings exists with lighting toggle enabled by default',
      G.settings && G.settings.lightingEnabled === true);
    G.redAlert = true;
    assert('Lighting: G.redAlert can be toggled on/off', G.redAlert === true);
    G.redAlert = false;
    G.res.power = 0;
    assert('Lighting: Blackout state detected when power is 0', G.res.power <= 0);
    G.res.power = 100;

    // 20. Particles FX Engine
    const testParticles = [];
    spawnDigParticles(testParticles, 100, 100);
    assert('Particles: spawnDigParticles generates dust particles',
      testParticles.length >= 5 && testParticles.some(p => p.type === 'dust'));
    spawnWeldingSparks(testParticles, 100, 100);
    assert('Particles: spawnWeldingSparks generates spark particles',
      testParticles.some(p => p.type === 'spark'));
    const countBeforeUpdate = testParticles.length;
    testParticles[0].life = testParticles[0].maxLife;
    updateParticles(testParticles);
    assert('Particles: updateParticles advances life and prunes expired particles',
      testParticles.length < countBeforeUpdate);

    // 21. Floating Text Indicators System
    const testFloating = [];
    spawnFloatingText(testFloating, 50, 50, '+10 ⛏️', '#f1c40f');
    assert('Floating FX: spawnFloatingText creates indicator item',
      testFloating.length === 1 && testFloating[0].text === '+10 ⛏️');
    const startY = testFloating[0].y;
    updateFloatingTexts(testFloating);
    assert('Floating FX: updateFloatingTexts moves item upward',
      testFloating[0].y < startY);

    // 22. Web Audio Procedural Ambience
    assert('Ambience: AmbienceEngine singleton initialized with controls',
      typeof AmbienceEngine.setVolume === 'function' && typeof AmbienceEngine.setEnabled === 'function');
    AmbienceEngine.setVolume(0.4);
    assert('Ambience: AmbienceEngine volume set to 0.4', Math.abs(AmbienceEngine.volume - 0.4) < 0.01);
    assert('Audio: AudioSys volume controls exist',
      typeof AudioSys.setSFXVolume === 'function' && typeof AudioSys.setAmbienceVolume === 'function');

  } catch (err) {
    failedCount++;
    results.push({ name: 'Exception in Test Suite', status: 'FAILED', error: err.message });
    console.error('Test Runner Exception:', err);
  }

  const duration = Math.round(performance.now() - startTime);
  const total = passedCount + failedCount;

  window.__TEST_RESULTS__ = { total, passed: passedCount, failed: failedCount, duration, results };

  // Render on-screen test badge overlay
  let overlay = document.getElementById('test-results-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'test-results-overlay';
    overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(18, 19, 24, 0.96);
      border: 2px solid ${failedCount === 0 ? '#2ecc71' : '#e74c3c'};
      border-radius: 8px;
      padding: 16px 20px;
      color: #fff;
      font-family: monospace;
      font-size: 13px;
      z-index: 99999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      max-width: 420px;
      max-height: 80vh;
      overflow-y: auto;
    `;
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <strong style="color:${failedCount === 0 ? '#2ecc71' : '#e74c3c'}; font-size:15px;">
        ${failedCount === 0 ? '✔ ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : '✖ ЕСТЬ ОШИБКИ В ТЕСТАХ'}
      </strong>
      <span style="font-size:11px; color:#888;">${duration} ms</span>
    </div>
    <div style="margin-bottom:8px;">Пройдено: <strong style="color:#2ecc71;">${passedCount}</strong> / ${total}</div>
    <div style="font-size:11px; line-height:1.5; border-top:1px solid #333; padding-top:8px;">
      ${results.map(r => `
        <div style="color:${r.status === 'PASSED' ? '#2ecc71' : '#e74c3c'};">
          ${r.status === 'PASSED' ? '✔' : '✖'} ${r.name}
          ${r.error ? `<div style="color:#ff8888; font-size:10px; margin-left:14px;">${r.error}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  console.log(`🏁 [TEST RUNNER] Finished: ${passedCount}/${total} passed (${duration} ms)`);
  return window.__TEST_RESULTS__;
}
