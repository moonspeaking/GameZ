/**
 * Central State G and state initialization.
 * Only imports constants. Zero dependencies on systems, render, or UI.
 */
import { CELL_SIZE, MAP_COLS, SURFACE_Y } from './constants.js';

export function createInitialState() {
  const hatchCol = Math.floor(MAP_COLS / 2);
  return {
    state: 'prologue', // 'prologue' | 'game'
    day: 1,
    timeHour: 17,
    timeMin: 10,
    speed: 1,
    paused: false,
    gameOver: false,
    won: false,
    activeChapterId: 'ch1',
    populationOverride: null,

    // Governance & Laws
    gameMode: 'democracy', // 'democracy' | 'overseer' | 'anarchy'
    laws: {
      rationing: 'standard', // 'strict' (0.7x food) | 'standard' (1.0x) | 'abundant' (1.4x, +morale)
      curfew: true,          // true: night silence, +10 defense | false: free movement
      laborDuty: 'voluntary', // 'voluntary' (normal) | 'mandatory' (+35% work speed, -morale)
      quarantine: 'strict',  // 'strict' (0% infection risk) | 'open'
      childSchool: true      // true (+morale, education) | false (+stone, child labor)
    },
    lastCouncilDay: 0,

    // Camera & Viewport
    cam: { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1 },
    shake: 0,
    redAlert: false,

    // Tools
    toolMode: 'select', // 'select' | 'dig' | 'place_room' | 'demolish'
    placingRoom: null,
    hoverCell: { c: 0, r: 0 },
    activeCamIdx: 0,

    // Environment
    hasDirtMound: false,
    isWinterSnow: false,

    // Supplies
    res: {
      food: 90,
      water: 150,
      power: 100,
      fuel: 244,
      med: 10,
      ammo: 74,
      materials: 35
    },
    popHistory: [4, 4, 4, 4, 4, 4, 4],

    // Colonists
    colonists: [
      { id: 'ray', name: 'РЭЙ', age: 41, role: 'ELEC', color: '#3498db', icon: '⚡', hp: 100, x: 0, y: 0, status: 'alive', mood: 'hopeful', task: 'Обслуживание генератора', thought: '«Генератор в порядке. Надо экономить топливо.»' },
      { id: 'nora', name: 'НОРА', age: 34, role: 'MED', color: '#e74c3c', icon: '💉', hp: 100, x: 0, y: 0, status: 'alive', mood: 'hopeful', task: 'Осмотр запасов медикаментов', thought: '«Главное — не допустить заражения.»' },
      { id: 'walt', name: 'УОЛТ', age: 47, role: 'ENG', color: '#f1c40f', icon: '⛏️', hp: 100, x: 0, y: 0, status: 'alive', mood: 'hopeful', task: 'Планирование шахты', thought: '«Порода здесь крепкая. Будем копать.»' },
      { id: 'eli', name: 'ЭЛАЙ', age: 19, role: 'SCOUT', color: '#2ecc71', icon: '🎒', hp: 100, x: 0, y: 0, status: 'alive', mood: 'hopeful', task: 'Разборка коробок с едой', thought: '«Наверху остался целый город... но там орда.»' }
    ],

    // Memorial — history of fallen & incidents
    memorial: {
      fallen: [],
      incidents: []
    },

    // Audiovisual Settings & Floating Indicators
    settings: {
      lightingEnabled: true,
      particlesEnabled: true,
      soundEnabled: true,
      sfxVol: 0.8,
      ambVol: 0.5
    },
    floatingTexts: [],

    // World & Architecture
    rooms: [],
    blueprints: [
      { type: 'quarters', name: 'СПАЛЬНЯ', x: 15, y: SURFACE_Y + 5, w: 5, h: 4, icon: '🛏️' },
      { type: 'latrine', name: 'САНУЗЕЛ', x: 11, y: SURFACE_Y + 6, w: 4, h: 3, icon: '💧' }
    ],
    grid: [],
    zombies: [],
    particles: [],
    snowflakes: [],

    prologue: {
      t: 0,
      soundHorde: false,
      soundSlam: false,
      soundOpen: false,
      hatchX: hatchCol * CELL_SIZE
    },

    elevator: {
      unlocked: false,
      y: (SURFACE_Y + 4) * CELL_SIZE,
      targetY: (SURFACE_Y + 4) * CELL_SIZE,
      speed: 60,
      dir: 1
    },

    dialogueTimer: 0,
    dialogueIndex: 0,

    mechanics: {
      enabled: true,
      lastDayTick: 0,
      lastEventDay: 0,
      nextNewcomerDay: 60,
      scavengeTeam: [],
      scavengeDayLeft: 0,
      scavengeReturning: false,
      buildQueue: [],
      sickColonists: [],
      morale: 75,
      totalDeaths: 0,
      totalBorn: 0,
      daysSinceLastEvent: 0,
      foodProduction: 0,
      waterProduction: 0,
      powerProduction: 0,
      defenseRating: 10,
      popCap: 8,
      eventLog: [],
      foodBonusMultiplier: 1.0,
      waterDrainMultiplier: 1.0,
      baseDefenseBonus: 0,
      miningYieldBonus: 0,
      newcomerFreqBonus: 1.0
    },

    research: {
      currentTechId: null,
      progress: 0,
      completed: []
    },

    dialogues: [
      { name: 'РЭЙ', icon: '⚡', text: '«Рэй. Электрик. Генератор работает.»' },
      { name: 'НОРА', icon: '💉', text: '«Нора. Военный медик. Нам нужны вода и строгий карантин.»' },
      { name: 'УОЛТ', icon: '⛏️', text: '«Уолт. Шахтёр. Дайте кирку — и я начну рубить породу.»' },
      { name: 'ЭЛАЙ', icon: '🎒', text: '«Элай. Курьер. Я знаю улицы города, если понадобятся припасы.»' },
      { name: 'УОЛТ', icon: '⛏️', text: '«Они чуют нас. Всю ночь скребутся в люк.»' }
    ]
  };
}

export const G = createInitialState();
