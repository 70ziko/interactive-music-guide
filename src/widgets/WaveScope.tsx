import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { audio, harmonicAmp, nearestNote, waveAt, type Wave } from '../audio/tone';
import { Controls, fmtHz, PlayButton, plot, Seg, Slider, useSustained, Widget } from './ui';

const WAVES: Wave[] = ['sine', 'triangle', 'square', 'sawtooth'];
const WINDOW_MS = 20; // the scope always shows 20 ms of time
const W = 640;
const H = 180;

/** Waveform + spectrum. Frequency changes how many cycles fit in the fixed 20 ms window. */
export default function WaveScope({ initialWave = 'sine' as Wave, initialFreq = 110 }) {
  const { t, lang } = useLang();
  const [wave, setWave] = useState<Wave>(initialWave);
  const [freq, setFreq] = useState(initialFreq);
  const [amp, setAmp] = useState(0.8);
  const nodes = useRef<{ osc: OscillatorNode; g: GainNode } | null>(null);

  const start = useCallback(() => {
    const { ctx, out } = audio();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setTargetAtTime(amp * 0.35, ctx.currentTime, 0.02);
    osc.connect(g).connect(out);
    osc.start();
    nodes.current = { osc, g };
    return () => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      osc.stop(ctx.currentTime + 0.1);
      nodes.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { on, toggle } = useSustained(start);

  // live-update the running oscillator
  useEffect(() => {
    const n = nodes.current;
    if (!n) return;
    const { ctx } = audio();
    n.osc.type = wave;
    n.osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.01);
    n.g.gain.setTargetAtTime(amp * 0.35, ctx.currentTime, 0.02);
  }, [wave, freq, amp, on]);

  const cycles = (freq * WINDOW_MS) / 1000;
  const path = plot((x) => amp * waveAt(wave, x * cycles), W, H, Math.min(2000, Math.max(400, Math.round(cycles * 40))));
  const period = 1000 / freq;
  const near = nearestNote(freq);
  const harmonics = Array.from({ length: 12 }, (_, i) => harmonicAmp(wave, i + 1));

  return (
    <Widget
      title={`${t.w_waveform} · y = A · wave(2π · f · t)`}
      caption={
        lang === 'pl'
          ? `Okno pokazuje zawsze ${WINDOW_MS} ms. Wyższa częstotliwość = więcej cykli w oknie. Okres T = 1/f = ${period.toFixed(2)} ms.`
          : `The window always shows ${WINDOW_MS} ms. Higher frequency = more cycles in the window. Period T = 1/f = ${period.toFixed(2)} ms.`
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="scope" role="img" aria-label="waveform">
        {[0.25, 0.5, 0.75].map((x) => (
          <line key={x} x1={x * W} x2={x * W} y1={0} y2={H} className="grid" />
        ))}
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="axis" />
        <polyline points={path} className="trace" />
        <text x={8} y={16} className="svg-label">
          A = {amp.toFixed(2)}
        </text>
        <text x={W - 8} y={H - 8} className="svg-label" textAnchor="end">
          {WINDOW_MS} ms
        </text>
      </svg>

      <div className="spectrum" aria-label={t.w_harmonics}>
        {harmonics.map((a, i) => (
          <div key={i} className="bar" title={`${i + 1} × ${fmtHz(freq)} = ${fmtHz(freq * (i + 1))}`}>
            <div className="fill" style={{ height: `${a * 100}%` }} />
            <span>{i + 1}</span>
          </div>
        ))}
        <div className="spectrum-label">
          {t.w_harmonics}: f, 2f, 3f… ({fmtHz(freq)}, {fmtHz(freq * 2)}, {fmtHz(freq * 3)}…)
        </div>
      </div>

      <Controls>
        <PlayButton on={on} onClick={toggle} labels={[t.w_play, t.w_stop]} />
        <Seg label={t.w_waveform} options={WAVES.map((w) => ({ value: w, label: w }))} value={wave} onChange={setWave} />
        <Slider label={t.w_frequency} value={freq} min={20} max={2000} log onChange={setFreq} format={(f) => `${fmtHz(f)} ≈ ${near.name}`} />
        <Slider label={t.w_amplitude} value={amp} min={0} max={1} step={0.01} onChange={setAmp} format={(a) => a.toFixed(2)} />
      </Controls>
    </Widget>
  );
}
