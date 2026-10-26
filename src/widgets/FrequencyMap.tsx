import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { Widget } from './ui';

const FMIN = 20;
const FMAX = 20000;
const pos = (f: number) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * 100;

interface Part {
  id: string;
  en: string;
  pl: string;
  core: [number, number]; // where its main energy is
  extra?: [number, number]; // harmonics / click / air
  color: string;
}

// Rough ranges for typical house / hard house sounds. Real sounds vary; use as a starting map.
const PARTS: Part[] = [
  { id: 'kick', en: 'Kick', pl: 'Stopa', core: [40, 120], extra: [2000, 5000], color: 'var(--p-harmony)' },
  { id: 'sub', en: 'Sub bass', pl: 'Sub-bas', core: [30, 80], color: '#ff8f5c' },
  { id: 'bass', en: 'Bass / donk', pl: 'Bas / donk', core: [50, 300], extra: [300, 2000], color: '#ffb35c' },
  { id: 'clap', en: 'Clap / snare', pl: 'Klap / werbel', core: [800, 4000], extra: [180, 300], color: 'var(--p-rhythm)' },
  { id: 'hats', en: 'Hi-hats', pl: 'Hi-haty', core: [6000, 16000], color: 'var(--p-sound)' },
  { id: 'chords', en: 'Chords / stabs', pl: 'Akordy / stabsy', core: [200, 3000], extra: [3000, 8000], color: 'var(--p-synth)' },
  { id: 'lead', en: 'Lead / hoover', pl: 'Lead / hoover', core: [300, 5000], extra: [5000, 12000], color: '#ff5ce1' },
  { id: 'pad', en: 'Pad', pl: 'Pad', core: [200, 2000], extra: [2000, 8000], color: 'var(--p-structure)' },
  { id: 'vox', en: 'Vocal', pl: 'Wokal', core: [250, 4000], extra: [4000, 10000], color: '#e6e6e6' },
];

/** Which instrument lives where. Overlapping cores = parts that will fight in the mix. */
export default function FrequencyMap() {
  const { lang } = useLang();
  const L = lang === 'pl';
  const [on, setOn] = useState<Set<string>>(() => new Set(['kick', 'bass', 'clap', 'hats', 'chords']));
  const active = PARTS.filter((p) => on.has(p.id));

  // count overlapping cores per small band to show crowding
  const bands = Array.from({ length: 60 }, (_, i) => {
    const f0 = FMIN * Math.pow(FMAX / FMIN, i / 60);
    const f1 = FMIN * Math.pow(FMAX / FMIN, (i + 1) / 60);
    const n = active.filter((p) => p.core[0] < f1 && p.core[1] > f0).length;
    return { left: (i / 60) * 100, n };
  });

  return (
    <Widget
      title={L ? 'Mapa pasma: kto gdzie mieszka' : 'Frequency map: who lives where'}
      caption={
        L
          ? 'Pełny kolor = główna energia, blady = harmoniczne / klik / powietrze. Czerwony pasek na dole = w tym paśmie walczą 3+ partie. Zakresy są przybliżone.'
          : 'Solid = main energy, faded = harmonics / click / air. Red strip at the bottom = 3+ parts fight in that band. Ranges are approximate.'
      }
    >
      <div className="fmap">
        <div className="fmap-gridwrap" aria-hidden>
          {[100, 1000, 10000].map((f) => (
            <div key={f} className="fmap-grid" style={{ left: `${pos(f)}%` }}>
              <span>{f >= 1000 ? `${f / 1000}k` : f} Hz</span>
            </div>
          ))}
        </div>
        {active.map((p) => (
          <div key={p.id} className="fmap-row">
            <span className="fmap-name">{L ? p.pl : p.en}</span>
            <div className="fmap-track">
              {p.extra && (
                <span className="fmap-bar faded" style={{ left: `${pos(p.extra[0])}%`, width: `${pos(p.extra[1]) - pos(p.extra[0])}%`, background: p.color }} />
              )}
              <span className="fmap-bar" style={{ left: `${pos(p.core[0])}%`, width: `${pos(p.core[1]) - pos(p.core[0])}%`, background: p.color }} />
            </div>
          </div>
        ))}
        <div className="fmap-row">
          <span className="fmap-name">{L ? 'Tłok' : 'Crowding'}</span>
          <div className="fmap-track">
            {bands.map((b, i) => (
              <span key={i} className={`fmap-band n${Math.min(b.n, 3)}`} style={{ left: `${b.left}%`, width: `${100 / 60}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="seg" role="group">
        {PARTS.map((p) => (
          <button
            key={p.id}
            className={on.has(p.id) ? 'on' : ''}
            aria-pressed={on.has(p.id)}
            onClick={() =>
              setOn((s) => {
                const n = new Set(s);
                n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                return n;
              })
            }
          >
            {L ? p.pl : p.en}
          </button>
        ))}
      </div>
    </Widget>
  );
}
