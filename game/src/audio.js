// All sound is synthesized with WebAudio: no audio files, no network.
// Every effect is a short oscillator/noise envelope; the game stays silent
// until the player's first key press creates the AudioContext.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  tone(freqA, freqB, seconds, type = 'sine', volume = 0.5, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqB), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume = 0.5, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  pickup(combo) {
    const base = 520 + combo * 90;
    this.tone(base, base * 1.6, 0.12, 'sine', 0.4);
    this.tone(base * 2, base * 2.4, 0.08, 'triangle', 0.15, 0.03);
  }

  hit() {
    this.noise(0.28, 0.6, 900);
    this.tone(160, 40, 0.3, 'sawtooth', 0.35);
  }

  dash() {
    this.noise(0.16, 0.3, 3200);
    this.tone(300, 900, 0.14, 'sine', 0.18);
  }

  power() {
    this.tone(440, 660, 0.1, 'triangle', 0.35);
    this.tone(660, 990, 0.14, 'triangle', 0.35, 0.09);
  }

  waveClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.16, 'triangle', 0.35, i * 0.09));
  }

  nearMiss() {
    this.tone(1200, 1600, 0.06, 'sine', 0.12);
  }

  gameOver() {
    [392, 311, 233, 175].forEach((f, i) => this.tone(f, f * 0.94, 0.28, 'sawtooth', 0.25, i * 0.16));
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.22, 'triangle', 0.35, i * 0.11));
  }

  click() {
    this.tone(700, 900, 0.06, 'square', 0.15);
  }
}
