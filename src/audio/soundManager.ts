/**
 * Pure WebAudio procedural synthesizer for Lantern Quay.
 * Generates custom sound effects (whoosh, coin clink with rising pitch,
 * jar plink, victory arpeggio, UI tap, gentle ambient warmth).
 * Zero external audio files, 100% browser-native & instant response.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private coinPitchIndex: number = 0;
  private lastCoinTime: number = 0;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : 0.03, this.ctx?.currentTime || 0);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playWhoosh(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playCoinClink(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = performance.now();
    if (now - this.lastCoinTime > 1200) {
      this.coinPitchIndex = 0;
    }
    this.lastCoinTime = now;
    this.coinPitchIndex = (this.coinPitchIndex + 1) % 18;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic ascending pitches
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const base = baseFreqs[this.coinPitchIndex % baseFreqs.length] * (1 + Math.floor(this.coinPitchIndex / baseFreqs.length) * 0.3);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(base, t);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(base * 2.02, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.19);
    osc2.stop(t + 0.19);
  }

  public playJarPlink(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playWinArpeggio(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    const t0 = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = t0 + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playRenovateChime(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t0 = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];

    chord.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.14, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t0);
      osc.stop(t0 + 0.62);
    });
  }

  public playTap(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public startQuietAmbience(): void {
    if (this.ambientOsc) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // gentle warm low A note

      this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.02, this.ctx.currentTime);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.ambientOsc.start();
    } catch {
      // Audio autoplay policy
    }
  }

  public playDecisionStinger(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [220, 277.18, 329.63, 440]; // A minor / warm mysterious chord
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.12, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.04);
      osc.stop(t + 0.95);
    });
  }

  public playHearthFire(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Crackling warm sparks
    for (let i = 0; i < 5; i++) {
      const delay = Math.random() * 0.25;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, t + delay);
      osc.frequency.exponentialRampToValueAtTime(80, t + delay + 0.08);

      gain.gain.setValueAtTime(0.1, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.1);
    }
  }

  public playSteamHiss(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Resonant steam whistle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.linearRampToValueAtTime(659.25, t + 0.4); // E5

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  public playShipBell(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Bell harmonic strikes (fundamental + high ringing overtone)
    const freqs = [880, 1760, 2640];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(idx === 0 ? 0.2 : 0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.25);
    });
  }
}

export const sound = new SoundManager();

