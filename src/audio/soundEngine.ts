class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  // Engine audio nodes
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private turboGain: GainNode | null = null;
  private turboOsc: OscillatorNode | null = null;

  // Tire screech nodes
  private tireGain: GainNode | null = null;
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  // Air brake buffer
  private airBrakeBuffer: AudioBuffer | null = null;
  private clunkBuffer: AudioBuffer | null = null;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineSound();
      this.setupTireSound();
      this.setupBuffers();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupBuffers() {
    if (!this.ctx) return;
    // Generate air brake hiss buffer
    const bufferSize = this.ctx.sampleRate * 0.8;
    this.airBrakeBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.airBrakeBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (this.ctx.sampleRate * 0.25));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    // Shift clunk buffer
    const clunkSize = this.ctx.sampleRate * 0.15;
    this.clunkBuffer = this.ctx.createBuffer(1, clunkSize, this.ctx.sampleRate);
    const clunkData = this.clunkBuffer.getChannelData(0);
    for (let i = 0; i < clunkSize; i++) {
      const t = i / this.ctx.sampleRate;
      clunkData[i] = Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 25) * 0.8 + (Math.random() * 0.3);
    }
  }

  private setupEngineSound() {
    if (!this.ctx) return;

    // Master engine gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // Filter for deep diesel bus rumble
    this.engineFilter = this.ctx.createFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // Osc 1: Deep rumble (sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(35, this.ctx.currentTime);

    // Osc 2: Diesel harmonic knock (triangle)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(70, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();

    // Turbo spool sound
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.ctx.destination);
    this.turboOsc.start();
  }

  private setupTireSound() {
    if (!this.ctx) return;

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.tireFilter = this.ctx.createFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // Looping noise buffer for tire squeal
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.ctx.destination);

    this.tireNoiseNode.start();
  }

  public updateEngine(rpm: number, throttle: number, speed: number) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const baseFreq = 25 + (rpm / 3000) * 85; // 25Hz - 110Hz
    const now = this.ctx.currentTime;

    if (this.engineOsc1 && this.engineOsc2 && this.engineFilter && this.engineGain) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.05, now, 0.05);
      
      const filterFreq = 180 + (rpm / 3000) * 450 + throttle * 250;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

      const targetGain = 0.15 + (rpm / 3000) * 0.2 + throttle * 0.15;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // Turbo whistle kicks in over 1500 RPM with throttle
    if (this.turboGain && this.turboOsc) {
      const turboIntensity = Math.max(0, (rpm - 1400) / 1600) * throttle;
      const turboFreq = 900 + (rpm / 3000) * 1800;
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.05);
      this.turboGain.gain.setTargetAtTime(turboIntensity * 0.12, now, 0.08);
    }
  }

  public updateTireScreech(slipAmount: number, speed: number) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (this.tireGain && this.tireFilter) {
      // Slip threshold
      if (Math.abs(speed) > 10 && slipAmount > 0.2) {
        const intensity = Math.min(1, (slipAmount - 0.2) / 0.7);
        this.tireGain.gain.setTargetAtTime(intensity * 0.35, now, 0.05);
        this.tireFilter.frequency.setTargetAtTime(1100 + intensity * 600, now, 0.05);
      } else {
        this.tireGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }
  }

  public playAirBrake() {
    if (!this.initialized || !this.ctx || this.isMuted || !this.airBrakeBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.airBrakeBuffer;
      const filter = this.ctx.createFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2200;
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.25;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
    } catch (e) {
      // Ignore
    }
  }

  public playGearShift() {
    if (!this.initialized || !this.ctx || this.isMuted || !this.clunkBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.clunkBuffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.4;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();

      // Quick mini air purge for bus pneumatic transmission
      this.playAirBrakeMini();
    } catch (e) {
      // Ignore
    }
  }

  private playAirBrakeMini() {
    if (!this.ctx || !this.airBrakeBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.airBrakeBuffer;
    const filter = this.ctx.createFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
    source.stop(this.ctx.currentTime + 0.2);
  }

  public setHorn(active: boolean) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    if (active && !this.hornOsc1) {
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc2.type = 'sawtooth';
      this.hornOsc1.frequency.setValueAtTime(370, this.ctx.currentTime); // Low horn
      this.hornOsc2.frequency.setValueAtTime(440, this.ctx.currentTime); // High horn

      const filter = this.ctx.createFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, this.ctx.currentTime);

      this.hornOsc1.connect(filter);
      this.hornOsc2.connect(filter);
      filter.connect(this.hornGain);
      this.hornGain.connect(this.ctx.destination);

      this.hornOsc1.start();
      this.hornOsc2.start();
    } else if (!active && this.hornOsc1 && this.hornGain) {
      try {
        this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
        const osc1 = this.hornOsc1;
        const osc2 = this.hornOsc2;
        setTimeout(() => {
          try {
            osc1.stop();
            osc2?.stop();
          } catch (e) {}
        }, 80);
        this.hornOsc1 = null;
        this.hornOsc2 = null;
      } catch (e) {
        this.hornOsc1 = null;
        this.hornOsc2 = null;
      }
    }
  }

  public playTurnSignal() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
