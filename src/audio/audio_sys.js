/**
 * Web Audio API Sound Synthesizer.
 * Synthesizes procedural effects without loading external audio assets.
 * Listens to eventBus 'sound' events for decoupled calls.
 */
import { eventBus } from '../core/event_bus.js';
import { AmbienceEngine } from './ambience.js';

export const AudioSys = {
  ctx: null,
  enabled: true,
  sfxVolume: 0.25,

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        AmbienceEngine.init(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playTone(freq, dur, type = 'sine', vol = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol * (this.sfxVolume / 0.25), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  },

  playPickaxeClink() {
    this.playTone(1800 + Math.random() * 400, 0.08, 'triangle', 0.2);
  },

  playMetalClang() {
    this.playTone(280, 0.6, 'sawtooth', 0.35);
    this.playTone(140, 0.8, 'square', 0.25);
  },

  playDig() {
    this.playTone(120 + Math.random() * 50, 0.12, 'square', 0.15);
  },

  playFootstep() {
    this.playTone(70 + Math.random() * 30, 0.05, 'triangle', 0.08);
  },

  playAlert() {
    this.playTone(600, 0.18, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(850, 0.25, 'sawtooth', 0.3), 150);
  },

  playGood() {
    this.playTone(523.25, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 120);
    setTimeout(() => this.playTone(783.99, 0.3, 'sine', 0.25), 240);
  },

  playBad() {
    this.playTone(180, 0.18, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(130, 0.22, 'sawtooth', 0.3), 120);
  },

  playBuild() {
    this.playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(554.37, 0.1, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.25), 160);
  },

  playDemolish() {
    this.playTone(130, 0.2, 'triangle', 0.3);
    setTimeout(() => this.playTone(70, 0.3, 'sawtooth', 0.3), 80);
  },

  playHordeRoar() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.3 * (this.sfxVolume / 0.25), this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {}
  },

  playSiren() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.5);
      osc.frequency.linearRampToValueAtTime(440, now + 1.0);
      gain.gain.setValueAtTime(0.25 * (this.sfxVolume / 0.25), now);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 1.0);
    } catch (e) {}
  },

  playElevatorHum() {
    this.playTone(85, 1.5, 'sine', 0.15);
  },

  playWaterDrop() {
    this.playTone(1000 + Math.random() * 500, 0.04, 'sine', 0.08);
  },

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  },

  setAmbienceVolume(vol) {
    AmbienceEngine.setVolume(vol);
  },

  toggleMute() {
    this.enabled = !this.enabled;
    AmbienceEngine.setEnabled(this.enabled);
    eventBus.emit('sound:mute-toggled', this.enabled);
    eventBus.emit('toast', { text: this.enabled ? '🔊 Звук включен' : '🔇 Звук выключен', style: 'toast-gold' });
    return this.enabled;
  }
};

// Connect to decoupled event bus supporting both string and object signatures
eventBus.on('sound', (arg, ...rest) => {
  if (typeof arg === 'string') {
    if (typeof AudioSys[arg] === 'function') {
      AudioSys[arg](...rest);
    }
  } else if (arg && typeof arg === 'object' && arg.type) {
    const fnName = 'play' + arg.type.charAt(0).toUpperCase() + arg.type.slice(1);
    if (typeof AudioSys[fnName] === 'function') {
      AudioSys[fnName](...(arg.args || []));
    }
  }
});

export function toggleSound() {
  return AudioSys.toggleMute();
}
