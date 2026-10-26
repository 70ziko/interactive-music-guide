/*
 * Tiny Web Audio helpers for the concept widgets only.
 * Lesson code blocks use Strudel's own audio engine, not this.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 12;
    master.connect(limiter).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return { ctx, out: master! };
}

/** Only one widget sound at a time: starting a new one stops the previous. */
let stopCurrent: (() => void) | null = null;
export function claim(stop: () => void) {
  if (stopCurrent && stopCurrent !== stop) stopCurrent();
  stopCurrent = stop;
}
export function release(stop: () => void) {
  if (stopCurrent === stop) stopCurrent = null;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
export const midiName = (m: number) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

/** Nearest note name + how many cents off it is. */
export function nearestNote(f: number) {
  const m = freqToMidi(f);
  const r = Math.round(m);
  return { name: midiName(r), cents: Math.round((m - r) * 100) };
}

export type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** Amplitude of harmonic n (1-based) for the classic waveforms (Fourier series). */
export function harmonicAmp(wave: Wave, n: number) {
  switch (wave) {
    case 'sine':
      return n === 1 ? 1 : 0;
    case 'sawtooth':
      return 1 / n;
    case 'square':
      return n % 2 ? 1 / n : 0;
    case 'triangle':
      return n % 2 ? 1 / (n * n) : 0;
  }
}

/** Sample one period of a waveform at phase p in [0,1). */
export function waveAt(wave: Wave, p: number) {
  p = p - Math.floor(p);
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'sawtooth':
      return 2 * p - 1;
    case 'triangle':
      return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
  }
}

/** Play a short note with an ADSR envelope. Returns when it will end. */
export function pluck(
  freqs: number[],
  {
    wave = 'triangle' as OscillatorType,
    attack = 0.005,
    decay = 0.15,
    sustain = 0.4,
    release = 0.4,
    hold = 0.35,
    gain = 0.25,
  } = {},
) {
  const { ctx, out } = audio();
  const t = ctx.currentTime + 0.01;
  const g = ctx.createGain();
  const peak = gain / Math.max(1, Math.sqrt(freqs.length));
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
  g.gain.setValueAtTime(peak * sustain, t + Math.max(hold, attack + decay));
  g.gain.linearRampToValueAtTime(0, t + Math.max(hold, attack + decay) + release);
  g.connect(out);
  const end = t + Math.max(hold, attack + decay) + release + 0.05;
  freqs.forEach((f) => {
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.value = f;
    o.connect(g);
    o.start(t);
    o.stop(end);
  });
  return end - ctx.currentTime;
}
