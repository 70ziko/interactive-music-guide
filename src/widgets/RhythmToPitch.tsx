import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { audio, nearestNote } from '../audio/tone';
import { Controls, fmtHz, PlayButton, Seg, Slider, useFrame, useSustained, Widget } from './ui';

const RATIOS: [number, number][] = [
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 4],
];

/** One cycle of two click trains: `a` clicks and `b` clicks spread evenly. */
function buildBuffer(ctx: AudioContext, a: number, b: number, rate: number) {
  const sr = ctx.sampleRate;
  const len = Math.max(8, Math.round(sr / rate));
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  const voice = (count: number, fc: number, level: number) => {
    const spacing = len / count;
    const d = Math.max(4, Math.min(Math.round(0.02 * sr), Math.floor(spacing * 0.9)));
    for (let k = 0; k < count; k++) {
      const pos = Math.round(k * spacing);
      for (let i = 0; i < d; i++) {
        const env = Math.exp(-i / (d / 5));
        data[(pos + i) % len] += level * env * Math.cos((2 * Math.PI * fc * i) / sr);
      }
    }
  };
  voice(a, 1800, 0.45);
  voice(b, 700, 0.45);
  return buf;
}

/**
 * Two rhythms in a ratio a:b. Speed them up and past ~20 repeats per second
 * your ear stops hearing clicks and starts hearing pitch — and the ratio becomes an interval.
 */
export default function RhythmToPitch() {
  const { t, lang } = useLang();
  const [ratio, setRatio] = useState<[number, number]>([3, 2]);
  const [rate, setRate] = useState(1);
  const [phase, setPhase] = useState(0);
  const st = useRef<{ src: AudioBufferSourceNode; g: GainNode; t0: number; rate: number } | null>(null);

  const startSource = (r: number, [a, b]: [number, number], offsetPhase = 0) => {
    const { ctx, out } = audio();
    const src = ctx.createBufferSource();
    src.buffer = buildBuffer(ctx, a, b, r);
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.5, ctx.currentTime, 0.01);
    src.connect(g).connect(out);
    src.start(ctx.currentTime, offsetPhase * src.buffer.duration);
    st.current = { src, g, t0: ctx.currentTime - offsetPhase / r, rate: r };
  };
  const stopSource = () => {
    const s = st.current;
    if (!s) return;
    const { ctx } = audio();
    s.g.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    s.src.stop(ctx.currentTime + 0.06);
    st.current = null;
  };

  const start = useCallback(() => {
    startSource(rate, ratio);
    return stopSource;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, ratio]);
  const { on, toggle } = useSustained(start);

  // rebuild the loop when speed or ratio changes, keeping the phase
  useEffect(() => {
    const s = st.current;
    if (!s) return;
    const { ctx } = audio();
    const ph = ((ctx.currentTime - s.t0) * s.rate) % 1;
    stopSource();
    startSource(rate, ratio, ph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, ratio]);

  useFrame(on, () => {
    const s = st.current;
    if (!s) return;
    setPhase(((audio().ctx.currentTime - s.t0) * s.rate) % 1);
  });

  const [a, b] = ratio;
  const fa = a * rate;
  const fb = b * rate;
  const low = Math.min(fa, fb);
  const zone = low < 12 ? t.w_rhythmZone : low < 35 ? t.w_blurZone : t.w_pitchZone;
  const zoneClass = low < 12 ? 'z-rhythm' : low < 35 ? 'z-blur' : 'z-pitch';
  const showHead = on && rate <= 4;

  const W = 640;
  const row = (count: number, y: number, cls: string) =>
    Array.from({ length: count }, (_, k) => {
      const x = 30 + (k / count) * (W - 60);
      const lit = showHead && phase >= k / count && phase < k / count + Math.min(0.12, 0.5 / count);
      return <circle key={k} cx={x} cy={y} r={lit ? 13 : 9} className={`${cls} ${lit ? 'lit' : ''}`} />;
    });

  return (
    <Widget
      title={lang === 'pl' ? 'Od rytmu do wysokości dźwięku' : 'From rhythm to pitch'}
      caption={
        lang === 'pl'
          ? 'Ten sam wzór, tylko szybciej. Powyżej ~20 powtórzeń na sekundę ucho słyszy ton, a stosunek a:b staje się interwałem.'
          : 'Same pattern, just faster. Above ~20 repeats per second your ear hears a tone, and the ratio a:b becomes an interval.'
      }
    >
      <svg viewBox={`0 0 ${W} 150`} className="scope" role="img" aria-label="two rhythms">
        <text x={8} y={44} className="svg-label">
          {a}×
        </text>
        <text x={8} y={114} className="svg-label">
          {b}×
        </text>
        <line x1={30} x2={W - 30} y1={40} y2={40} className="grid" />
        <line x1={30} x2={W - 30} y1={110} y2={110} className="grid" />
        {row(a, 40, 'dot-a')}
        {row(b, 110, 'dot-b')}
        {showHead && <line x1={30 + phase * (W - 60)} x2={30 + phase * (W - 60)} y1={14} y2={136} className="playhead" />}
      </svg>
      <div className={`zone ${zoneClass}`}>{zone}</div>
      <table className="mini-table">
        <tbody>
          <tr>
            <th>{lang === 'pl' ? 'Cykl' : 'Cycle'}</th>
            <td>
              {rate.toFixed(rate < 10 ? 2 : 0)} / s
            </td>
            <th>{lang === 'pl' ? 'Głos' : 'Voice'} {a}×</th>
            <td>
              {fmtHz(fa)} {low >= 35 && `≈ ${nearestNote(fa).name}`}
            </td>
            <th>{lang === 'pl' ? 'Głos' : 'Voice'} {b}×</th>
            <td>
              {fmtHz(fb)} {low >= 35 && `≈ ${nearestNote(fb).name}`}
            </td>
          </tr>
        </tbody>
      </table>
      <Controls>
        <PlayButton on={on} onClick={toggle} labels={[t.w_play, t.w_stop]} />
        <Seg label={t.w_ratio} options={RATIOS.map((r) => ({ value: r.join(':'), label: r.join(':') }))} value={ratio.join(':')} onChange={(v) => setRatio(v.split(':').map(Number) as [number, number])} />
        <Slider label={t.w_speed} value={rate} min={0.5} max={220} log onChange={setRate} format={(r) => `${r.toFixed(r < 10 ? 2 : 0)} ${lang === 'pl' ? 'cykli/s' : 'cycles/s'}`} />
      </Controls>
    </Widget>
  );
}
