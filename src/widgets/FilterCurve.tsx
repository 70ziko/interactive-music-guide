import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { audio } from '../audio/tone';
import { Controls, fmtHz, PlayButton, Seg, Slider, useFrame, useSustained, Widget } from './ui';

const W = 640;
const H = 220;
const FMIN = 20;
const FMAX = 20000;
const DB_TOP = 24;
const DB_BOT = -48;
const BASE_F = 55; // A1, a bass note
const LFO_RATE = 0.25; // Hz → one sweep every 4 s
const LFO_OCT = 2; // ± octaves

type FType = 'lowpass' | 'highpass' | 'bandpass';
const STRUDEL_FN: Record<FType, [string, string]> = { lowpass: ['lpf', 'lpq'], highpass: ['hpf', 'hpq'], bandpass: ['bpf', 'bpq'] };

const offline = new OfflineAudioContext(1, 1, 44100);
const xOf = (f: number) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * W;
const yOf = (db: number) => ((DB_TOP - db) / (DB_TOP - DB_BOT)) * H;

function response(type: FType, cutoff: number, q: number, freqs: Float32Array<ArrayBuffer>) {
  const bq = offline.createBiquadFilter();
  bq.type = type;
  bq.frequency.value = cutoff;
  bq.Q.value = q;
  const mag = new Float32Array(freqs.length);
  bq.getFrequencyResponse(freqs, mag, new Float32Array(freqs.length));
  return mag;
}

export default function FilterCurve({ initialType = 'lowpass' as FType, lfo: lfoDefault = false }) {
  const { lang } = useLang();
  const L = lang === 'pl';
  const [type, setType] = useState<FType>(initialType);
  const [cutoff, setCutoff] = useState(800);
  const [q, setQ] = useState(1);
  const [lfo, setLfo] = useState(lfoDefault);
  const [time, setTime] = useState(0);
  const nodes = useRef<{ bq: BiquadFilterNode; lfoGain: GainNode } | null>(null);

  const start = useCallback(() => {
    const { ctx, out } = audio();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = BASE_F * 2;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = BASE_F * 2 * 1.004;
    const bq = ctx.createBiquadFilter();
    bq.type = type;
    bq.frequency.value = cutoff;
    bq.Q.value = q;
    const lfoOsc = ctx.createOscillator();
    lfoOsc.frequency.value = LFO_RATE;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = lfo ? LFO_OCT * 1200 : 0;
    lfoOsc.connect(lfoGain).connect(bq.detune);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.25, ctx.currentTime, 0.02);
    osc.connect(bq);
    osc2.connect(bq);
    bq.connect(g).connect(out);
    [osc, osc2, lfoOsc].forEach((o) => o.start());
    nodes.current = { bq, lfoGain };
    return () => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      [osc, osc2, lfoOsc].forEach((o) => o.stop(ctx.currentTime + 0.1));
      nodes.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { on, toggle } = useSustained(start);

  useEffect(() => {
    const n = nodes.current;
    if (!n) return;
    const { ctx } = audio();
    n.bq.type = type;
    n.bq.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.01);
    n.bq.Q.setTargetAtTime(q, ctx.currentTime, 0.01);
    n.lfoGain.gain.setTargetAtTime(lfo ? LFO_OCT * 1200 : 0, ctx.currentTime, 0.05);
  }, [type, cutoff, q, lfo, on]);

  // the drawn curve follows the LFO; when playing, use the audio clock so picture and sound match
  useFrame(lfo, (ms) => setTime(on ? audio().ctx.currentTime : ms / 1000));
  const liveCutoff = lfo ? Math.min(FMAX, cutoff * Math.pow(2, LFO_OCT * Math.sin(2 * Math.PI * LFO_RATE * time))) : cutoff;

  const freqs = useMemo(() => {
    const f = new Float32Array(300);
    for (let i = 0; i < f.length; i++) f[i] = FMIN * Math.pow(FMAX / FMIN, i / (f.length - 1));
    return f;
  }, []);
  const mag = response(type, liveCutoff, q, freqs);
  const curve = Array.from(freqs, (f, i) => `${xOf(f).toFixed(1)},${yOf(Math.max(DB_BOT, 20 * Math.log10(mag[i] + 1e-9))).toFixed(1)}`).join(' ');

  // harmonics of a sawtooth at 110 Hz, before and after the filter
  const harmF = new Float32Array(Array.from({ length: 60 }, (_, i) => BASE_F * 2 * (i + 1)).filter((f) => f < FMAX));
  const harmMag = response(type, liveCutoff, q, harmF);

  const [fn, qfn] = STRUDEL_FN[type];
  const strudel = lfo
    ? `note("a2").s("sawtooth").${fn}(sine.range(${Math.round(cutoff / 4)}, ${Math.round(Math.min(cutoff * 4, 20000))}).slow(4)).${qfn}(${q.toFixed(1)})`
    : `note("a2").s("sawtooth").${fn}(${Math.round(cutoff)}).${qfn}(${q.toFixed(1)})`;

  return (
    <Widget
      title={L ? 'Filtr: które harmoniczne przechodzą' : 'Filter: which harmonics get through'}
      caption={
        L
          ? 'Kreski = harmoniczne piły 110 Hz (szare: przed filtrem, kolorowe: po). Linia = charakterystyka filtra w dB. Rezonans podbija pasmo tuż przy odcięciu.'
          : 'Bars = harmonics of a 110 Hz saw (grey: before the filter, coloured: after). Line = filter response in dB. Resonance boosts a band right at the cutoff.'
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="scope" role="img" aria-label="filter response">
        {[100, 1000, 10000].map((f) => (
          <g key={f}>
            <line x1={xOf(f)} x2={xOf(f)} y1={0} y2={H} className="grid" />
            <text x={xOf(f) + 4} y={H - 6} className="svg-label">
              {fmtHz(f)}
            </text>
          </g>
        ))}
        <line x1={0} x2={W} y1={yOf(0)} y2={yOf(0)} className="axis" />
        <text x={4} y={yOf(0) - 4} className="svg-label">
          0 dB
        </text>
        {Array.from(harmF, (f, i) => {
          const before = 20 * Math.log10(1 / (i + 1));
          const after = Math.max(DB_BOT, before + 20 * Math.log10(harmMag[i] + 1e-9));
          return (
            <g key={i}>
              <line x1={xOf(f)} x2={xOf(f)} y1={H} y2={yOf(before) } className="harm-before" />
              <line x1={xOf(f)} x2={xOf(f)} y1={H} y2={yOf(after)} className="harm-after" />
            </g>
          );
        })}
        <polyline points={curve} className="trace" />
        <line x1={xOf(liveCutoff)} x2={xOf(liveCutoff)} y1={0} y2={H} className="playhead" />
      </svg>
      <code className="strudel-line">{strudel}</code>
      <Controls>
        <PlayButton on={on} onClick={toggle} labels={[L ? 'Zagraj piłę' : 'Play saw', 'Stop']} />
        <Seg
          options={[
            { value: 'lowpass', label: L ? 'dolnoprzepustowy (lpf)' : 'low-pass (lpf)' },
            { value: 'highpass', label: L ? 'górnoprzepustowy (hpf)' : 'high-pass (hpf)' },
            { value: 'bandpass', label: L ? 'pasmowy (bpf)' : 'band-pass (bpf)' },
          ]}
          value={type}
          onChange={setType}
        />
        <Slider label={L ? 'Odcięcie (cutoff)' : 'Cutoff'} value={cutoff} min={40} max={16000} log onChange={setCutoff} format={fmtHz} />
        <Slider label={L ? 'Rezonans (Q)' : 'Resonance (Q)'} value={q} min={0.1} max={20} log onChange={setQ} format={(v) => v.toFixed(1)} />
        <Seg
          label="LFO"
          options={[
            { value: 'off', label: L ? 'wył.' : 'off' },
            { value: 'on', label: L ? 'wł. (sinus, 4 s)' : 'on (sine, 4 s)' },
          ]}
          value={lfo ? 'on' : 'off'}
          onChange={(v) => setLfo(v === 'on')}
        />
      </Controls>
    </Widget>
  );
}
