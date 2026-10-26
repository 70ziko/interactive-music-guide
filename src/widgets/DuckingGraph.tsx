import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { Slider, Widget } from './ui';

const W = 640;
const H = 170;
const BPM = 128;

/**
 * Bass volume over one bar while the kick ducks it.
 * Same curve as Strudel's superdough: drop to 1 − √depth on the kick, then ramp back to 1 over `duckattack` seconds.
 */
export default function DuckingGraph() {
  const { lang } = useLang();
  const L = lang === 'pl';
  const [depth, setDepth] = useState(0.8);
  const [attack, setAttack] = useState(0.2);

  const bar = (4 * 60) / BPM; // seconds
  const floor = Math.max(0.01, 1 - Math.sqrt(depth));
  const x = (sec: number) => 20 + (sec / bar) * (W - 40);
  const y = (g: number) => H - 24 - g * (H - 44);

  // gain at time t (exponential ramp back like Web Audio exponentialRampToValueAtTime)
  const gainAt = (t: number) => {
    const since = t % (bar / 4);
    if (since >= attack) return 1;
    return floor * Math.pow(1 / floor, since / attack);
  };
  const pts: string[] = [];
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * bar;
    pts.push(`${x(t).toFixed(1)},${y(gainAt(t)).toFixed(1)}`);
  }
  const beatMs = (60000 / BPM).toFixed(0);

  return (
    <Widget
      title={L ? 'Ducking: głośność basu w jednym takcie' : 'Ducking: bass volume over one bar'}
      caption={
        L
          ? `Każda stopa (kreska) ścisza bas do 1 − √depth = ${floor.toFixed(2)}, a bas wraca przez ${Math.round(attack * 1000)} ms. Jedno uderzenie przy ${BPM} BPM trwa ${beatMs} ms — jeśli powrót trwa dłużej, bas nigdy nie wraca do pełnej głośności.`
          : `Each kick (line) drops the bass to 1 − √depth = ${floor.toFixed(2)}, then it returns over ${Math.round(attack * 1000)} ms. One beat at ${BPM} BPM is ${beatMs} ms — if the return is longer, the bass never gets back to full volume.`
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="scope" role="img" aria-label="ducking curve">
        {[0, 1, 2, 3].map((b) => (
          <g key={b}>
            <line x1={x((b * bar) / 4)} x2={x((b * bar) / 4)} y1={10} y2={H - 24} className="playhead" />
            <text x={x((b * bar) / 4) + 4} y={H - 8} className="svg-label">
              {L ? 'stopa' : 'kick'} {b + 1}
            </text>
          </g>
        ))}
        <line x1={20} x2={W - 20} y1={y(1)} y2={y(1)} className="grid" />
        <text x={W - 24} y={y(1) - 4} className="svg-label" textAnchor="end">
          100%
        </text>
        <polyline points={pts.join(' ')} className="trace" />
      </svg>
      <code className="strudel-line">{`s("bd*4").duckorbit(2).duckdepth(${depth.toFixed(2)}).duckattack(${attack.toFixed(2)})`}</code>
      <div className="controls">
        <Slider label="duckdepth" value={depth} min={0} max={1} step={0.01} onChange={setDepth} format={(v) => v.toFixed(2)} />
        <Slider label="duckattack" value={attack} min={0.02} max={0.6} step={0.01} onChange={setAttack} format={(v) => `${Math.round(v * 1000)} ms`} />
      </div>
    </Widget>
  );
}
