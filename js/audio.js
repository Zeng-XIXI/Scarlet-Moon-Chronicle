'use strict';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.music = null;
    this.sfx = null;
    this.noiseBuffer = null;
    this.enabled = true;
    this.started = false;
    this.musicTimer = 1.2;
    this.noteTimer = 0;
    this.chordIndex = 0;
    this.zone = 0;
    this._lastZone = -1;
    this._volume = 0.55;
  }

  init() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      this.enabled = false;
      return;
    }
    try {
      this.ctx = new AC();
      this.started = true;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this._volume : 0;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.22;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);

      this.music = this.ctx.createGain();
      this.music.gain.value = 0.34;
      this.music.connect(this.master);

      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.82;
      this.sfx.connect(this.master);

      this.noiseBuffer = this._makeNoise(1.2);
      this.musicTimer = 0.4;
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      console.warn('Audio disabled:', e);
      this.enabled = false;
    }
  }

  _makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? this._volume : 0, t, 0.035);
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.init();
      this.click(740);
    }
    return this.enabled;
  }

  _now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  _ok() {
    return this.started && this.enabled && this.ctx && this.ctx.state !== 'closed';
  }

  tone(freq, dur, opts = {}) {
    if (!this._ok()) return;
    const {
      type = 'sine', vol = 0.12, attack = 0.005, release = dur,
      slide = 0, delay = 0, dest = this.sfx, detune = 0
    } = opts;
    const t = this._now() + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + attack + release + 0.05);
  }

  noise(dur, opts = {}) {
    if (!this._ok() || !this.noiseBuffer) return;
    const {
      vol = 0.15, freq = 900, q = 1, type = 'bandpass',
      freqEnd = null, attack = 0.003, delay = 0, dest = this.sfx
    } = opts;
    const t = this._now() + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.value = q;
    if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  click(freq = 480) {
    this.tone(freq, 0.07, { type: 'triangle', vol: 0.04, slide: -100 });
  }

  jump() {
    this.tone(310, 0.16, { type: 'sine', vol: 0.055, slide: 300 });
    this.noise(0.12, { vol: 0.025, freq: 900, freqEnd: 2200, type: 'highpass' });
  }

  doubleJump() {
    this.tone(460, 0.18, { type: 'triangle', vol: 0.055, slide: 380 });
    this.tone(690, 0.22, { type: 'sine', vol: 0.025, slide: 220, delay: 0.025 });
  }

  dash() {
    this.noise(0.24, { vol: 0.1, freq: 480, freqEnd: 2600, q: 0.8, type: 'bandpass' });
    this.tone(180, 0.18, { type: 'sine', vol: 0.035, slide: -80 });
  }

  sword(step = 0) {
    const base = [780, 940, 620][step % 3];
    this.noise(0.16, { vol: 0.11, freq: base, freqEnd: base * 2.2, q: 1.4, type: 'bandpass' });
    this.tone(base * 1.2, 0.13, { type: 'triangle', vol: 0.025, slide: -base * 0.4 });
  }

  shot() {
    this.noise(0.085, { vol: 0.18, freq: 1800, freqEnd: 260, q: 0.7, type: 'bandpass' });
    this.tone(105, 0.12, { type: 'square', vol: 0.075, slide: -55 });
    this.tone(780, 0.045, { type: 'sawtooth', vol: 0.025, slide: -500 });
    this.noise(0.3, { vol: 0.022, freq: 1300, freqEnd: 300, type: 'bandpass', delay: 0.04 });
  }

  empty() {
    this.tone(240, 0.035, { type: 'square', vol: 0.025, slide: -60 });
    this.noise(0.04, { vol: 0.03, freq: 2800, type: 'highpass' });
  }

  reload() {
    this.noise(0.045, { vol: 0.045, freq: 2100, type: 'highpass' });
    this.tone(520, 0.05, { type: 'square', vol: 0.02, delay: 0.1, slide: -100 });
    this.noise(0.05, { vol: 0.05, freq: 1600, type: 'highpass', delay: 0.27 });
    this.tone(690, 0.06, { type: 'triangle', vol: 0.03, delay: 0.29 });
  }

  hit() {
    this.noise(0.12, { vol: 0.13, freq: 320, freqEnd: 90, q: 0.8, type: 'lowpass' });
    this.tone(140, 0.12, { type: 'sawtooth', vol: 0.05, slide: -90 });
  }

  enemyHit() {
    this.noise(0.09, { vol: 0.09, freq: 900, freqEnd: 200, q: 1.2, type: 'bandpass' });
    this.tone(220, 0.08, { type: 'square', vol: 0.035, slide: -100 });
  }

  enemyDeath() {
    this.noise(0.4, { vol: 0.11, freq: 1100, freqEnd: 120, q: 0.7, type: 'bandpass' });
    this.tone(160, 0.38, { type: 'sawtooth', vol: 0.045, slide: -110 });
    this.tone(420, 0.34, { type: 'sine', vol: 0.025, slide: -340, delay: 0.04 });
  }

  hurt() {
    this.noise(0.22, { vol: 0.16, freq: 800, freqEnd: 140, q: 0.6, type: 'lowpass' });
    this.tone(96, 0.3, { type: 'sawtooth', vol: 0.075, slide: -25 });
    this.tone(330, 0.2, { type: 'triangle', vol: 0.04, slide: -240 });
  }

  pickup() {
    this.tone(740, 0.2, { type: 'sine', vol: 0.05, slide: 280 });
    this.tone(1108, 0.26, { type: 'sine', vol: 0.04, slide: 260, delay: 0.08 });
    this.tone(1480, 0.34, { type: 'sine', vol: 0.022, slide: 180, delay: 0.15 });
  }

  checkpoint() {
    this.tone(392, 0.8, { type: 'sine', vol: 0.045 });
    this.tone(587, 0.9, { type: 'sine', vol: 0.035, delay: 0.1 });
    this.tone(784, 1.2, { type: 'sine', vol: 0.028, delay: 0.24 });
    this.tone(1174, 1.5, { type: 'sine', vol: 0.014, delay: 0.38 });
    this.noise(0.5, { vol: 0.018, freq: 2200, type: 'highpass', delay: 0.1 });
  }

  special() {
    this.tone(70, 0.9, { type: 'sine', vol: 0.12, slide: 70 });
    this.noise(0.65, { vol: 0.13, freq: 300, freqEnd: 3800, q: 0.9, type: 'bandpass' });
    this.tone(520, 0.7, { type: 'triangle', vol: 0.05, slide: 520 });
    this.tone(1040, 0.75, { type: 'sine', vol: 0.035, slide: -300, delay: 0.08 });
    this.noise(0.9, { vol: 0.055, freq: 2400, freqEnd: 200, type: 'bandpass', delay: 0.12 });
  }

  bossRoar() {
    this.tone(48, 1.1, { type: 'sawtooth', vol: 0.1, slide: -10 });
    this.tone(72, 0.95, { type: 'square', vol: 0.035, slide: 18, detune: 12 });
    this.noise(1.05, { vol: 0.1, freq: 180, freqEnd: 520, q: 0.7, type: 'lowpass' });
    this.noise(0.7, { vol: 0.06, freq: 800, freqEnd: 180, type: 'bandpass', delay: 0.1 });
  }

  bossSlash() {
    this.noise(0.32, { vol: 0.14, freq: 1600, freqEnd: 180, q: 0.8 });
    this.tone(80, 0.36, { type: 'sawtooth', vol: 0.07, slide: -40 });
  }

  death() {
    this.tone(440, 1.8, { type: 'sine', vol: 0.07, slide: -410 });
    this.tone(220, 2.1, { type: 'triangle', vol: 0.045, slide: -190 });
    this.noise(1.6, { vol: 0.07, freq: 800, freqEnd: 80, q: 0.5, type: 'lowpass' });
  }

  victory() {
    [392, 523, 659, 784, 1046].forEach((f, i) => {
      this.tone(f, 1.8 - i * 0.12, { type: 'sine', vol: 0.045, delay: i * 0.16 });
      this.tone(f / 2, 2.2, { type: 'triangle', vol: 0.018, delay: i * 0.16 });
    });
    this.noise(1.4, { vol: 0.02, freq: 3200, freqEnd: 1000, type: 'highpass' });
  }

  weaponSwitch(weapon) {
    if (weapon === 'gun') {
      this.tone(520, 0.08, { type: 'triangle', vol: 0.035, slide: 180 });
      this.noise(0.09, { vol: 0.035, freq: 1800, type: 'highpass' });
      this.tone(880, 0.1, { type: 'sine', vol: 0.02, delay: 0.035 });
    } else {
      this.tone(320, 0.12, { type: 'triangle', vol: 0.04, slide: 240 });
      this.noise(0.14, { vol: 0.045, freq: 1000, freqEnd: 2400, type: 'bandpass' });
    }
  }

  guardRaise() {
    this.tone(430, 0.18, { type: 'sine', vol: 0.035, slide: 180 });
    this.noise(0.14, { vol: 0.045, freq: 700, freqEnd: 2200, type: 'bandpass' });
    this.tone(880, 0.16, { type: 'triangle', vol: 0.018, delay: 0.02 });
  }

  guardBlock() {
    this.tone(250, 0.14, { type: 'square', vol: 0.035, slide: -80 });
    this.noise(0.18, { vol: 0.1, freq: 1500, freqEnd: 500, q: 0.8, type: 'bandpass' });
    this.tone(620, 0.18, { type: 'sine', vol: 0.025, slide: -240 });
  }

  parry() {
    this.tone(1040, 0.55, { type: 'sine', vol: 0.07, slide: 380 });
    this.tone(1560, 0.7, { type: 'sine', vol: 0.045, slide: 260, delay: 0.025 });
    this.tone(520, 0.55, { type: 'triangle', vol: 0.05, slide: 260, delay: 0.02 });
    this.noise(0.5, { vol: 0.12, freq: 3200, freqEnd: 700, q: 0.9, type: 'bandpass' });
    this.noise(0.6, { vol: 0.05, freq: 900, freqEnd: 2400, type: 'bandpass', delay: 0.03 });
    this.tone(180, 0.35, { type: 'sine', vol: 0.05, slide: 60, delay: 0.06 });
  }

  _chord(freqs, dur, vol = 0.02) {
    if (!this._ok()) return;
    const t = this._now();
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      osc.detune.value = (i - 1) * 4 + rand(-3, 3);
      filter.type = 'lowpass';
      filter.frequency.value = 720 + i * 160;
      filter.Q.value = 0.4;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 1.3);
      gain.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.62);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
  }

  update(dt, zone = 0) {
    if (!this.started || !this.enabled) return;
    if (this.zone !== zone) {
      this.zone = zone;
      this.chordIndex = zone * 2;
      this.musicTimer = Math.min(this.musicTimer, 0.8);
    }
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      const progressions = [
        [[110, 164.8, 220], [98, 146.8, 196], [87.3, 130.8, 174.6], [92.5, 138.6, 185]],
        [[116.5, 174.6, 233], [98, 146.8, 196], [103.8, 155.6, 207.6], [87.3, 130.8, 174.6]],
        [[82.4, 123.5, 164.8], [73.4, 110, 146.8], [65.4, 98, 130.8], [87.3, 130.8, 174.6]]
      ];
      const prog = progressions[clamp(zone, 0, 2)];
      this._chord(prog[this.chordIndex % prog.length], 5.2, 0.018);
      this.chordIndex++;
      this.musicTimer = 4.65;
      this.noteTimer = rand(1.4, 2.6);
    }
    this.noteTimer -= dt;
    if (this.noteTimer <= 0) {
      const scales = [
        [440, 523.25, 587.33, 659.25, 783.99],
        [466.16, 523.25, 622.25, 698.46, 830.61],
        [392, 466.16, 523.25, 587.33, 698.46]
      ];
      const scale = scales[clamp(zone, 0, 2)];
      const notes = [];
      const count = chance(0.2) ? 2 : 1;
      for (let i = 0; i < count; i++) notes.push(choose(scale));
      notes.forEach((f, i) => {
        this.tone(f, rand(2.2, 3.6), {
          type: 'sine', vol: 0.012, attack: 0.5, release: rand(1.4, 2.8),
          delay: i * 0.41, dest: this.music
        });
      });
      this.noteTimer = rand(3.4, 6.2);
    }
  }
}
