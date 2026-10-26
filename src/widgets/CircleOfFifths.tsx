import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { midiToFreq, pluck } from '../audio/tone';
import { Widget } from './ui';

const MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const MIN = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

const S = 360;
const C = S / 2;
const R_OUT = 170;
const R_MID = 118;
const R_IN = 72;

const wrap = (i: number) => (i + 12) % 12;

function sector(r1: number, r2: number, i: number) {
  const a0 = ((i - 0.5) * 30 - 90) * (Math.PI / 180);
  const a1 = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
  const p = (r: number, a: number) => `${C + r * Math.cos(a)},${C + r * Math.sin(a)}`;
  return `M${p(r2, a0)} A${r2},${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 0 0 ${p(r1, a0)} Z`;
}
const labelPos = (r: number, i: number) => {
  const a = (i * 30 - 90) * (Math.PI / 180);
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

function chordNotes(name: string) {
  const minor = name.endsWith('m');
  const root = PC[minor ? name.slice(0, -1) : name];
  const base = 48 + root + (root > 7 ? -12 : 0) + 12; // keep around C4
  return [base, base + (minor ? 3 : 4), base + 7];
}

export default function CircleOfFifths({ initial = 'Am' }) {
  const { lang } = useLang();
  const [key, setKey] = useState(initial);
  const minor = key.endsWith('m');
  const idx = minor ? MIN.indexOf(key) : MAJ.indexOf(key);

  // diatonic chords sit in a 3-wide wedge around the key
  const chords: { name: string; roman: string; ring: 'out' | 'in'; i: number }[] = minor
    ? [
        { name: MIN[idx], roman: 'i', ring: 'in', i: idx },
        { name: MIN[wrap(idx - 1)], roman: 'iv', ring: 'in', i: wrap(idx - 1) },
        { name: MIN[wrap(idx + 1)], roman: 'v', ring: 'in', i: wrap(idx + 1) },
        { name: MAJ[idx], roman: 'III', ring: 'out', i: idx },
        { name: MAJ[wrap(idx - 1)], roman: 'VI', ring: 'out', i: wrap(idx - 1) },
        { name: MAJ[wrap(idx + 1)], roman: 'VII', ring: 'out', i: wrap(idx + 1) },
      ]
    : [
        { name: MAJ[idx], roman: 'I', ring: 'out', i: idx },
        { name: MAJ[wrap(idx - 1)], roman: 'IV', ring: 'out', i: wrap(idx - 1) },
        { name: MAJ[wrap(idx + 1)], roman: 'V', ring: 'out', i: wrap(idx + 1) },
        { name: MIN[idx], roman: 'vi', ring: 'in', i: idx },
        { name: MIN[wrap(idx - 1)], roman: 'ii', ring: 'in', i: wrap(idx - 1) },
        { name: MIN[wrap(idx + 1)], roman: 'iii', ring: 'in', i: wrap(idx + 1) },
      ];
  const romanAt = (ring: 'out' | 'in', i: number) => chords.find((c) => c.ring === ring && c.i === i)?.roman;

  const play = (name: string) => pluck(chordNotes(name).map(midiToFreq), { wave: 'triangle', hold: 0.7, release: 0.7 });
  const order = minor ? ['i', 'III', 'iv', 'v', 'VI', 'VII'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi'];

  return (
    <Widget
      title={lang === 'pl' ? 'Koło kwintowe' : 'Circle of fifths'}
      caption={
        lang === 'pl'
          ? 'Każdy krok w prawo = kwinta w górę (×3/2). Akordy tonacji leżą w klinie 3 sąsiednich pól. Kliknij pole, by wybrać tonację; kliknij akord na liście, by go usłyszeć.'
          : 'Each step clockwise = a fifth up (×3/2). The chords of a key sit in a wedge of 3 neighbouring slots. Click a slot to pick a key; click a chord in the list to hear it.'
      }
    >
      <div className="cof">
        <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label="circle of fifths">
          {MAJ.map((n, i) => {
            const r = romanAt('out', i);
            const p = labelPos((R_OUT + R_MID) / 2, i);
            return (
              <g key={n} className={`cof-seg ${r ? 'in-key' : ''} ${key === n ? 'tonic' : ''}`} onClick={() => setKey(n)}>
                <path d={sector(R_MID, R_OUT, i)} />
                <text x={p.x} y={p.y - (r ? 6 : 0)} className="cof-name">
                  {n}
                </text>
                {r && (
                  <text x={p.x} y={p.y + 13} className="cof-roman">
                    {r}
                  </text>
                )}
              </g>
            );
          })}
          {MIN.map((n, i) => {
            const r = romanAt('in', i);
            const p = labelPos((R_MID + R_IN) / 2, i);
            return (
              <g key={n} className={`cof-seg minor ${r ? 'in-key' : ''} ${key === n ? 'tonic' : ''}`} onClick={() => setKey(n)}>
                <path d={sector(R_IN, R_MID, i)} />
                <text x={p.x} y={p.y - (r ? 5 : 0)} className="cof-name sm">
                  {n}
                </text>
                {r && (
                  <text x={p.x} y={p.y + 11} className="cof-roman">
                    {r}
                  </text>
                )}
              </g>
            );
          })}
          <text x={C} y={C - 4} className="cof-center">
            {key}
          </text>
          <text x={C} y={C + 16} className="cof-center-sub">
            {minor ? (lang === 'pl' ? 'moll' : 'minor') : lang === 'pl' ? 'dur' : 'major'}
          </text>
        </svg>
        <div className="cof-list">
          {order.map((ro) => {
            const c = chords.find((x) => x.roman === ro)!;
            return (
              <button key={ro} className="btn chord-btn" onClick={() => play(c.name)}>
                <span className="roman">{ro}</span> {c.name}
              </button>
            );
          })}
          <p className="muted small">
            {lang === 'pl'
              ? `Siódmy akord (${minor ? 'ii°' : 'vii°'}, zmniejszony) nie mieści się na kole — w house rzadko używany.`
              : `The 7th chord (${minor ? 'ii°' : 'vii°'}, diminished) is not on the circle — rarely used in house.`}
          </p>
        </div>
      </div>
    </Widget>
  );
}
