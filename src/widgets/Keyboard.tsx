import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { midiName, midiToFreq, NOTE_NAMES, pluck } from '../audio/tone';
import { Controls, Seg, Widget } from './ui';

export const SCALES: Record<string, { steps: number[]; en: string; pl: string; strudel: string }> = {
  major: { steps: [0, 2, 4, 5, 7, 9, 11], en: 'Major', pl: 'Dur (jońska)', strudel: 'major' },
  minor: { steps: [0, 2, 3, 5, 7, 8, 10], en: 'Natural minor', pl: 'Moll naturalny', strudel: 'minor' },
  dorian: { steps: [0, 2, 3, 5, 7, 9, 10], en: 'Dorian', pl: 'Dorycka', strudel: 'dorian' },
  phrygian: { steps: [0, 1, 3, 5, 7, 8, 10], en: 'Phrygian', pl: 'Frygijska', strudel: 'phrygian' },
  mixolydian: { steps: [0, 2, 4, 5, 7, 9, 10], en: 'Mixolydian', pl: 'Miksolidyjska', strudel: 'mixolydian' },
  harmonic: { steps: [0, 2, 3, 5, 7, 8, 11], en: 'Harmonic minor', pl: 'Moll harmoniczny', strudel: 'harmonic minor' },
  pentaMin: { steps: [0, 3, 5, 7, 10], en: 'Minor pentatonic', pl: 'Pentatonika moll', strudel: 'minor pentatonic' },
};

export const CHORDS: Record<string, { steps: number[]; label: string }> = {
  maj: { steps: [0, 4, 7], label: '' },
  min: { steps: [0, 3, 7], label: 'm' },
  dom7: { steps: [0, 4, 7, 10], label: '7' },
  maj7: { steps: [0, 4, 7, 11], label: 'maj7' },
  min7: { steps: [0, 3, 7, 10], label: 'm7' },
  min9: { steps: [0, 3, 7, 10, 14], label: 'm9' },
  sus2: { steps: [0, 2, 7], label: 'sus2' },
  sus4: { steps: [0, 5, 7], label: 'sus4' },
};

const LOW = 48; // C3
const HIGH = 72; // C5
const BLACK = new Set([1, 3, 6, 8, 10]);
const STEP_NAMES: Record<number, string> = { 1: 'H', 2: 'W', 3: 'W+H' };

interface Props {
  mode?: 'scale' | 'chord' | 'free';
  root?: number; // 0..11
  scale?: keyof typeof SCALES;
  chord?: keyof typeof CHORDS;
  /** restrict choices shown in the scale/chord selector */
  scales?: string[];
  chords?: string[];
}

export default function Keyboard({ mode = 'free', root: r0 = 9, scale: s0 = 'minor', chord: c0 = 'min', scales, chords }: Props) {
  const { t, lang } = useLang();
  const [root, setRoot] = useState(r0);
  const [scale, setScale] = useState<string>(s0);
  const [chord, setChord] = useState<string>(c0);
  const [last, setLast] = useState<number | null>(null);

  const rootMidi = LOW + root; // in the first octave
  const steps = mode === 'scale' ? SCALES[scale].steps : mode === 'chord' ? CHORDS[chord].steps : [];
  const lit = new Map<number, number>(); // midi -> degree index
  if (mode === 'scale') {
    for (let o = 0; o < 2; o++) steps.forEach((s, i) => lit.set(rootMidi + s + 12 * o, i));
    lit.set(rootMidi + 24, 0);
  } else if (mode === 'chord') {
    steps.forEach((s, i) => lit.set(rootMidi + s, i));
  }

  const keys = [];
  let top = Math.max(HIGH, ...lit.keys());
  while (BLACK.has(top % 12)) top++;
  for (let m = LOW; m <= top; m++) keys.push(m);
  const whites = keys.filter((m) => !BLACK.has(m % 12));
  const ww = 100 / whites.length;

  const press = (m: number) => {
    setLast(m);
    pluck([midiToFreq(m)], { wave: 'triangle' });
  };
  const playAll = () => {
    const ms = [...lit.keys()].sort((a, b) => a - b);
    if (mode === 'chord') {
      pluck(ms.map(midiToFreq), { wave: 'triangle', hold: 0.9, release: 0.8 });
    } else {
      const notes = ms.slice(0, steps.length + 1);
      notes.forEach((m, i) => setTimeout(() => press(m), i * 220));
    }
  };

  const rootName = NOTE_NAMES[root];
  const strudelLine =
    mode === 'scale'
      ? `n("0 1 2 3 4 5 6 7").scale("${rootName}3:${SCALES[scale].strudel.replaceAll(' ', ':')}")`
      : mode === 'chord'
        ? `note("${steps.map((s) => midiName(rootMidi + s).toLowerCase()).join(',')}")`
        : last !== null
          ? `note("${midiName(last).toLowerCase()}")  // = note(${last})`
          : '';

  const gaps = mode === 'scale' ? [...steps, 12].slice(1).map((s, i) => s - steps[i]) : [];

  return (
    <Widget
      title={
        mode === 'scale'
          ? `${t.w_scale}: ${rootName} ${lang === 'pl' ? SCALES[scale].pl : SCALES[scale].en}`
          : mode === 'chord'
            ? `${t.w_chord}: ${rootName}${CHORDS[chord].label}`
            : lang === 'pl'
              ? 'Klawiatura: nuta → liczba → częstotliwość'
              : 'Keyboard: note → number → frequency'
      }
      caption={t.w_clickKey}
    >
      <div className="piano-scroll">
        <div className="piano" role="group" aria-label="piano">
          {keys.map((m) => {
            const black = BLACK.has(m % 12);
            const wi = whites.filter((w) => w < m).length;
            const left = black ? wi * ww - ww * 0.3 : wi * ww;
            const deg = lit.get(m);
            return (
              <button
                key={m}
                className={`key ${black ? 'black' : 'white'} ${deg !== undefined ? 'lit' : ''} ${deg === 0 ? 'root' : ''} ${last === m ? 'pressed' : ''}`}
                style={{ left: `${left}%`, width: `${black ? ww * 0.6 : ww}%` }}
                onClick={() => press(m)}
                aria-label={midiName(m)}
              >
                {deg !== undefined && <span className="deg">{mode === 'chord' ? ['R', '3', '5', '7', '9'][deg] ?? '' : deg + 1}</span>}
                {!black && m % 12 === 0 && <span className="cname">{midiName(m)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'scale' && (
        <div className="gaps">
          {gaps.map((g, i) => (
            <span key={i} className={`gap g${g}`}>
              {STEP_NAMES[g] ?? g}
            </span>
          ))}
          <small>{lang === 'pl' ? 'W = cały ton (2 półtony), H = półton' : 'W = whole step (2 semitones), H = half step'}</small>
        </div>
      )}

      {last !== null && (
        <div className="formula small">
          {midiName(last)} = MIDI {last} → f = 440 · 2^(({last} − 69)/12) = {midiToFreq(last).toFixed(2)} Hz
        </div>
      )}
      {strudelLine && <code className="strudel-line">{strudelLine}</code>}

      <Controls>
        {mode !== 'free' && (
          <button className="btn primary" onClick={playAll}>
            ▶ {mode === 'scale' ? t.w_scale : t.w_chord}
          </button>
        )}
        {mode !== 'free' && (
          <label className="select">
            <span>{t.w_root}</span>
            <select value={root} onChange={(e) => setRoot(Number(e.target.value))}>
              {NOTE_NAMES.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {mode === 'scale' && (
          <Seg
            options={(scales ?? Object.keys(SCALES)).map((k) => ({ value: k, label: lang === 'pl' ? SCALES[k].pl : SCALES[k].en }))}
            value={scale}
            onChange={setScale}
          />
        )}
        {mode === 'chord' && (
          <Seg
            options={(chords ?? Object.keys(CHORDS)).map((k) => ({ value: k, label: rootName + CHORDS[k].label }))}
            value={chord}
            onChange={setChord}
          />
        )}
      </Controls>
    </Widget>
  );
}
