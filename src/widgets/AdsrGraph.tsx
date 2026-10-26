import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { pluck } from '../audio/tone';
import { Controls, Seg, Slider, useFrame, Widget } from './ui';

const W = 640;
const H = 180;
const HOLD = 0.6; // seconds the key is held in the demo

const PRESETS: Record<string, { en: string; pl: string; a: number; d: number; s: number; r: number }> = {
  pluck: { en: 'Pluck', pl: 'Pluck', a: 0.003, d: 0.18, s: 0, r: 0.1 },
  stab: { en: 'Chord stab', pl: 'Stab', a: 0.005, d: 0.25, s: 0.2, r: 0.15 },
  bass: { en: 'Bass', pl: 'Bas', a: 0.005, d: 0.1, s: 0.8, r: 0.05 },
  pad: { en: 'Pad', pl: 'Pad', a: 0.8, d: 0.5, s: 0.7, r: 1.2 },
};

const fmt = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);
const num = (v: number) => String(Number(v.toFixed(3)));

export default function AdsrGraph() {
  const { lang } = useLang();
  const [p, setP] = useState({ a: 0.01, d: 0.2, s: 0.5, r: 0.3 });
  const [preset, setPreset] = useState('');
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const hold = Math.max(HOLD, p.a + p.d);
  const total = hold + p.r;
  const span = Math.max(total, 1.2);
  const x = (sec: number) => 20 + (sec / span) * (W - 40);
  const y = (v: number) => H - 20 - v * (H - 40);
  const path = [
    `M${x(0)},${y(0)}`,
    `L${x(p.a)},${y(1)}`,
    `L${x(p.a + p.d)},${y(p.s)}`,
    `L${x(hold)},${y(p.s)}`,
    `L${x(total)},${y(0)}`,
  ].join(' ');

  const envAt = (tt: number) => {
    if (tt < p.a) return tt / p.a;
    if (tt < p.a + p.d) return 1 - ((tt - p.a) / p.d) * (1 - p.s);
    if (tt < hold) return p.s;
    if (tt < total) return p.s * (1 - (tt - hold) / p.r);
    return 0;
  };

  useFrame(t0 !== null, (ms) => {
    const e = (ms - (t0 ?? ms)) / 1000;
    setNow(e);
    if (e > total + 0.1) setT0(null);
  });

  const play = () => {
    pluck([110, 110.6], { wave: 'sawtooth', attack: p.a, decay: p.d, sustain: p.s, release: p.r, hold, gain: 0.3 });
    setT0(performance.now());
  };
  const set = (k: 'a' | 'd' | 's' | 'r') => (v: number) => {
    setPreset('');
    setP((o) => ({ ...o, [k]: v }));
  };
  const L = lang === 'pl';

  return (
    <Widget
      title={L ? 'Obwiednia ADSR — jak głośność zmienia się w czasie' : 'ADSR envelope — how loudness changes over time'}
      caption={
        L
          ? `Szary pas = klawisz wciśnięty (${fmt(hold)}). Release zaczyna się, gdy klawisz zostaje puszczony.`
          : `Grey band = key held (${fmt(hold)}). Release starts when the key is let go.`
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="scope" role="img" aria-label="ADSR">
        <rect x={x(0)} y={10} width={x(hold) - x(0)} height={H - 30} className="held" />
        <line x1={20} x2={W - 20} y1={y(0)} y2={y(0)} className="axis" />
        <path d={path} className="trace env" />
        {[
          ['A', p.a / 2],
          ['D', p.a + p.d / 2],
          ['S', (p.a + p.d + hold) / 2],
          ['R', hold + p.r / 2],
        ].map(([l, sec]) => (
          <text key={l as string} x={x(sec as number)} y={H - 4} className="svg-label" textAnchor="middle">
            {l}
          </text>
        ))}
        {t0 !== null && now <= total && <circle cx={x(now)} cy={y(envAt(now))} r={7} className="env-dot" />}
      </svg>
      <code className="strudel-line">
        {`note("a2").s("sawtooth").attack(${num(p.a)}).decay(${num(p.d)}).sustain(${num(p.s)}).release(${num(p.r)})`}
      </code>
      <Controls>
        <button className="btn primary" onClick={play}>
          ▶ {L ? 'Zagraj nutę' : 'Play a note'}
        </button>
        <Seg
          label={L ? 'Gotowiec' : 'Preset'}
          options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: L ? v.pl : v.en }))}
          value={preset}
          onChange={(k) => {
            setPreset(k);
            const v = PRESETS[k];
            setP({ a: v.a, d: v.d, s: v.s, r: v.r });
          }}
        />
        <Slider label="Attack" value={Math.max(p.a, 0.001)} min={0.001} max={2} log onChange={set('a')} format={fmt} />
        <Slider label="Decay" value={Math.max(p.d, 0.01)} min={0.01} max={2} log onChange={set('d')} format={fmt} />
        <Slider label="Sustain" value={p.s} min={0} max={1} step={0.01} onChange={set('s')} format={(v) => `${Math.round(v * 100)}%`} />
        <Slider label="Release" value={Math.max(p.r, 0.01)} min={0.01} max={3} log onChange={set('r')} format={fmt} />
      </Controls>
    </Widget>
  );
}
