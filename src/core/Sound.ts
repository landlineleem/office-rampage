// Procedural sound effects via Web Audio API.
// No audio files needed — every sound is synthesized from oscillators,
// noise buffers, and filters at play time. Style: punchy, slightly retro,
// matches the "indie polish" aesthetic of the rest of the game.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private slowMoFilter: BiquadFilterNode | null = null;
  private slowMoBus: GainNode | null = null;
  private lastFootstepAt = 0;
  private lastGunshotAt = 0;
  private muted = false;

  init(): void {
    if (this.ctx) return;
    try {
      const Ctor =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      // Slow-mo bus: a separate path that gets lowpass-filtered when
      // slow-mo is active. Most sounds route through here.
      this.slowMoBus = this.ctx.createGain();
      this.slowMoFilter = this.ctx.createBiquadFilter();
      this.slowMoFilter.type = "lowpass";
      this.slowMoFilter.frequency.value = 22000;
      this.slowMoBus.connect(this.slowMoFilter);
      this.slowMoFilter.connect(this.master);
      this.master.connect(this.ctx.destination);
    } catch (e) {
      console.warn("[sound] init failed", e);
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
  }

  setSlowMo(active: boolean): void {
    if (!this.slowMoFilter || !this.ctx) return;
    const target = active ? 700 : 22000;
    const ct = this.ctx.currentTime;
    this.slowMoFilter.frequency.cancelScheduledValues(ct);
    this.slowMoFilter.frequency.linearRampToValueAtTime(target, ct + 0.18);
  }

  // ---------- Sound primitives ----------

  private noiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private envelope(
    gain: GainNode,
    peak: number,
    decay: number,
    sustain = 0
  ): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    if (sustain > 0) gain.gain.linearRampToValueAtTime(peak * 0.6, t + sustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay + sustain);
  }

  // ---------- Game sounds ----------

  gunshot(strength = 1): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastGunshotAt < 0.04) return;
    this.lastGunshotAt = now;

    // Crack: filtered noise burst
    const buffer = this.noiseBuffer(0.18);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1400 + Math.random() * 600;
      filter.Q.value = 0.8;
      const noiseGain = this.ctx.createGain();
      this.envelope(noiseGain, 0.45 * strength, 0.12);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.slowMoBus);
      noise.start(now);
      noise.stop(now + 0.2);
    }

    // Sub thump: square osc descending
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(180 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
    const oscGain = this.ctx.createGain();
    this.envelope(oscGain, 0.32 * strength, 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  hit(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.4, 0.09);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.11);

    // Quick noise crack on top
    const buffer = this.noiseBuffer(0.05);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 3000;
      const ng = this.ctx.createGain();
      this.envelope(ng, 0.2, 0.04);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(this.slowMoBus);
      noise.start(now);
      noise.stop(now + 0.06);
    }
  }

  death(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.25);
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.55, 0.32);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.35);

    // Body-fall noise tail
    const buffer = this.noiseBuffer(0.25);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 600;
      const ng = this.ctx.createGain();
      this.envelope(ng, 0.18, 0.25);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(this.slowMoBus);
      noise.start(now);
      noise.stop(now + 0.3);
    }
  }

  playerHurt(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.45, 0.15);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  jump(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.13);
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.18, 0.13);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  slide(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const buffer = this.noiseBuffer(0.4);
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2500, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    filter.Q.value = 4;
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.22, 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.slowMoBus);
    noise.start(now);
    noise.stop(now + 0.45);
  }

  footstep(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFootstepAt < 0.22) return;
    this.lastFootstepAt = now;
    const buffer = this.noiseBuffer(0.05);
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.08, 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.slowMoBus);
    noise.start(now);
    noise.stop(now + 0.07);
  }

  land(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.18, 0.12);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  uiClick(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 880;
    const gain = this.ctx.createGain();
    this.envelope(gain, 0.12, 0.05);
    osc.connect(gain);
    gain.connect(this.slowMoBus);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  elevatorDing(): void {
    if (!this.ctx || !this.slowMoBus || this.muted) return;
    const now = this.ctx.currentTime;
    // Two-tone ding
    [880, 660].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5);
      osc.connect(gain);
      gain.connect(this.slowMoBus!);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.55);
    });
  }

  // ---------- Ambient music ----------
  // Layered low drone + harmony pad with slow detune drift. Loops
  // indefinitely; routed through the slow-mo bus so it also gets the
  // underwater filter when slow-mo activates.

  private musicNodes: AudioNode[] = [];

  startMusic(): void {
    if (!this.ctx || !this.slowMoBus || this.musicNodes.length > 0) return;
    const ctx = this.ctx;
    // A1 / E2 / A2 — open fifth pad, low and broody.
    const layers = [
      { freq: 55, gain: 0.04, lfoFreq: 0.08, lfoDepth: 6 },
      { freq: 82.5, gain: 0.025, lfoFreq: 0.11, lfoDepth: 4 },
      { freq: 110, gain: 0.018, lfoFreq: 0.07, lfoDepth: 5 },
      { freq: 220, gain: 0.006, lfoFreq: 0.13, lfoDepth: 3 }, // sparkle
    ];
    for (const layer of layers) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = layer.freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(layer.gain, ctx.currentTime + 1.5);
      // LFO modulates detune slowly so the pad drifts
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = layer.lfoFreq;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = layer.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      osc.connect(gain);
      gain.connect(this.slowMoBus);
      osc.start();
      lfo.start();
      this.musicNodes.push(osc, lfo, gain, lfoGain);
    }
  }

  stopMusic(): void {
    if (!this.ctx) return;
    const ct = this.ctx.currentTime;
    for (const node of this.musicNodes) {
      if ("gain" in node) {
        const g = node as GainNode;
        g.gain.cancelScheduledValues(ct);
        g.gain.linearRampToValueAtTime(0, ct + 0.5);
      }
      if (node instanceof OscillatorNode) node.stop(ct + 0.6);
    }
    this.musicNodes = [];
  }
}

export const sound = new SoundEngine();
