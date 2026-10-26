import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { audio, harmonicAmp, type Wave } from '../audio/tone';
import { Controls, PlayButton, plot, useSustained, Widget } from './ui';

const N = 10;
const W = 640;
const H = 170;
const F0 = 110;

const preset = (w: Wave) => Array.from({ length: N }, (_, i) => harmonicAmp(w, i + 1));

/** Additive synthesis: add sine waves at f, 2f, 3f… and watch the shape change. */
export default function HarmonicBuilder() {
  const { t, lang } = useLang();
  const [amps, setAmps] = useState<number[]>(() => [1, ...Array(N - 1).fill(0)]);
  const nodes = useRef<{ osc: OscillatorNode } | null>(null);

  const makeWave = (ctx: AudioContext, a: number[]) => {
    const real = new Float32Array(N + 1);
    const imag = new Float32Array(N + 1);
    a.forEach((v, i) => (imag[i + 1] = v));
    return ctx.createPeriodicWave(real, imag);
  };

  const start = useCallback(() => {
    const { ctx, out } = audio();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = F0;
    osc.setPeriodicWave(makeWave(ctx, amps));
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.3, ctx.currentTime, 0.02);
    osc.connect(g).connect(out);
    osc.start();
    nodes.current = { osc };
    return () => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      osc.stop(ctx.currentTime + 0.1);
      nodes.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { on, toggle } = useSustained(start);

  useEffect(() => {
    if (nodes.current) nodes.current.osc.setPeriodicWave(makeWave(audio().ctx, amps));
  }, [amps, on]);

  const total = amps.reduce((s, a) => s + a, 0) || 1;
  const sum = (x: number) => amps.reduce((s, a, i) => s + a * Math.sin(2 * Math.PI * (i + 1) * 2 * x), 0) / total;
  const set = (i: number, v: number) => setAmps((p) => p.map((a, j) => (j === i ? v : a)));

  return (
    <Widget
      title={lang === 'pl' ? 'Budowanie dźwięku z sinusów' : 'Build a sound from sine waves'}
      caption={
        lang === 'pl'
          ? `Każdy suwak to sinus o częstotliwości n × ${F0} Hz. Wysokość dźwięku się nie zmienia — zmienia się barwa.`
          : `Each slider is a sine at n × ${F0} Hz. The pitch never changes — only the tone colour (timbre) does.`
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="scope" role="img" aria-label="sum of harmonics">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="axis" />
        {amps.map((a, i) =>
          a > 0.01 ? (
            <polyline key={i} points={plot((x) => (a / total) * Math.sin(2 * Math.PI * (i + 1) * 2 * x), W, H, 300)} className="partial" />
          ) : null,
        )}
        <polyline points={plot(sum, W, H, 600)} className="trace" />
      </svg>
      <div className="harm-sliders">
        {amps.map((a, i) => (
          <label key={i} className="harm">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={a}
              onChange={(e) => set(i, Number(e.target.value))}
              aria-label={`harmonic ${i + 1}`}
            />
            <span>{i + 1}f</span>
            <small>{(F0 * (i + 1)).toFixed(0)}</small>
          </label>
        ))}
      </div>
      <Controls>
        <PlayButton on={on} onClick={toggle} labels={[t.w_play, t.w_stop]} />
        <div className="seg">
          <span className="seg-label">{t.w_preset}</span>
          {(['sine', 'triangle', 'square', 'sawtooth'] as Wave[]).map((w) => (
            <button key={w} onClick={() => setAmps(preset(w))}>
              {w}
            </button>
          ))}
        </div>
      </Controls>
    </Widget>
  );
}
