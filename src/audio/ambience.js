/**
 * Adaptive Web Audio Ambient Soundscape (0 external audio files).
 * Generates low-frequency bunker diesel hum, cavern water droplets,
 * and emergency Red Alert alarms.
 */

export const AmbienceEngine = {
  ctx: null,
  enabled: true,
  volume: 0.35,

  // Nodes for generator drone
  droneGain: null,
  droneOsc1: null,
  droneOsc2: null,
  droneFilter: null,

  // Water drip timer
  dripTimer: null,

  // Red Alert Siren
  sirenOsc: null,
  sirenGain: null,
  sirenLfo: null,
  isSirenActive: false,

  init(audioCtx) {
    if (!audioCtx) return;
    this.ctx = audioCtx;
    this.startDrone();
    this.startWaterDrips();
  },

  startDrone() {
    // The constant generator hum was removed: a single monotone sound is tiring.
    return;
    if (!this.ctx || this.droneGain) return;
    try {
      const now = this.ctx.currentTime;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(this.enabled ? this.volume * 0.4 : 0, now);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140, now);
      this.droneFilter.Q.setValueAtTime(3.5, now);

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(55, now); // A1 note

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(110.5, now); // slight detune

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch (e) {
      console.warn('Ambience drone init postponed until user gesture:', e);
    }
  },

  updateState(G) {
    if (!this.ctx || !this.droneGain) return;
    const isBlackout = (G && G.res && G.res.energy <= 0);
    const now = this.ctx.currentTime;

    // Diesel drone volume fades to zero during electrical blackout
    const targetDroneVol = (this.enabled && !isBlackout) ? this.volume * 0.4 : 0;
    this.droneGain.gain.setTargetAtTime(targetDroneVol, now, 0.5);

    // Red alert siren management
    if (G && G.redAlert && !this.isSirenActive) {
      this.startRedAlertSiren();
    } else if (G && !G.redAlert && this.isSirenActive) {
      this.stopRedAlertSiren();
    }
  },

  startWaterDrips() {
    if (this.dripTimer) return;
    const scheduleNext = () => {
      const delay = 3500 + Math.random() * 5500;
      this.dripTimer = setTimeout(() => {
        if (this.enabled && this.ctx && this.ctx.state === 'running') {
          this.playCavernDrip();
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  },

  playCavernDrip() {
    if (!this.ctx || !this.enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 1100 + Math.random() * 700;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.12);

      gain.gain.setValueAtTime(this.volume * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  },

  startRedAlertSiren() {
    if (!this.ctx || this.isSirenActive) return;
    try {
      this.isSirenActive = true;
      const now = this.ctx.currentTime;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(this.enabled ? this.volume * 0.3 : 0, now);

      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sawtooth';

      // LFO for pitch sweep
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.frequency.setValueAtTime(1.2, now); // 1.2 Hz cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(220, now); // swing +/- 220 Hz

      this.sirenOsc.frequency.setValueAtTime(650, now);
      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc.start();
      this.sirenLfo.start();
    } catch (e) {}
  },

  stopRedAlertSiren() {
    if (!this.isSirenActive) return;
    this.isSirenActive = false;
    try {
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      setTimeout(() => {
        if (this.sirenOsc) {
          try { this.sirenOsc.stop(); } catch (e) {}
          this.sirenOsc = null;
        }
        if (this.sirenLfo) {
          try { this.sirenLfo.stop(); } catch (e) {}
          this.sirenLfo = null;
        }
        this.sirenGain = null;
      }, 300);
    } catch (e) {}
  },

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(this.enabled ? this.volume * 0.4 : 0, this.ctx.currentTime, 0.1);
    }
    if (this.sirenGain && this.ctx && this.isSirenActive) {
      this.sirenGain.gain.setTargetAtTime(this.enabled ? this.volume * 0.3 : 0, this.ctx.currentTime, 0.1);
    }
  },

  setEnabled(val) {
    this.enabled = !!val;
    this.setVolume(this.volume);
  }
};
