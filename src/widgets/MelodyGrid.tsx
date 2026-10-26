import { useCallback, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import Strudel from '../components/StrudelBlock';
import { NOTE_NAMES } from '../audio/tone';
import { SCALES } from './Keyboard';
import { Controls, Seg, Slider, useFrame, useNarrow, Widget } from './ui';

type Notes = (number | null)[];
const ROWS = [7, 6, 5, 4, 3, 2, 1, 0]; // scale degrees, top = octave

const _ = null;
const PRESETS: Record<string, { en: string; pl: string; notes: Notes }> = {
  empty: { en: 'Empty', pl: 'Pusty', notes: Array(16).fill(null) },
  hook: { en: 'Simple hook', pl: 'Prosty hook', notes: [0, _, _, 0, _, _, 2, _, 4, _, _, 3, _, 2, _, _] },
  arp: { en: 'Arpeggio', pl: 'Arpeggio', notes: [0, 2, 4, 7, 4, 2, 0, 2, 4, 7, 4, 2, 0, 2, 4, 2] },
  offbeat: { en: 'Offbeat riff', pl: 'Riff na offbicie', notes: [_, 0, _, 0, _, 0, _, 2, _, 0, _, 0, _, 4, _, 3] },
  bounce: { en: 'Bounce hook', pl: 'Hook bounce', notes: [4, _, 4, _, 5, _, 4, _, 2, _, 2, _, 1, _, 0, _] },
};

const SCALE_KEYS = ['minor', 'dorian', 'major', 'pentaMin'] as const;
const SOUNDS = {
  pluck: '.s("square").lpf(2400).decay(0.15).sustain(0.15)',
  lead: '.s("supersaw").lpf(3000).decay(0.25).sustain(0.4)',
  piano: '.s("piano")',
} as const;

function noteName(root: number, scale: string, degree: number) {
  const steps = SCALES[scale].steps;
  const oct = Math.floor(degree / steps.length);
  const semis = root + steps[((degree % steps.length) + steps.length) % steps.length] + 12 * oct;
  return NOTE_NAMES[((semis % 12) + 12) % 12] + (4 + Math.floor(semis / 12));
}

function toCode(notes: Notes, root: number, scale: string, sound: keyof typeof SOUNDS, bpm: number, lang: 'en' | 'pl') {
  const beats = [0, 1, 2, 3].map((b) => `[${notes.slice(b * 4, b * 4 + 4).map((n) => (n === null ? '~' : n)).join(' ')}]`);
  const scaleName = SCALES[scale].strudel.replaceAll(' ', ':');
  const key = `${NOTE_NAMES[root]}4:${scaleName}`;
  const chordKey = `${NOTE_NAMES[root]}3:${scaleName}`;
  const c = lang === 'pl' ? { mel: 'melodia (stopnie skali)', bg: 'tło: tonika jako pad + bęben' } : { mel: 'melody (scale degrees)', bg: 'backing: tonic chord pad + drums' };
  return `setcpm(${Math.round(bpm)}/4)
// ${c.mel}
melody: n("${beats.join(' ')}")
  .scale("${key}")
  ${SOUNDS[sound]}.gain(0.5)
// ${c.bg}
pad: n("[0,2,4]").scale("${chordKey}").s("sawtooth")
  .lpf(900).sustain(1).gain(0.18)
drums: s("bd*4, [~ oh]*4").bank("RolandTR909").gain(0.7)`;
}

/** 16 steps × 8 scale degrees → a Strudel melody you can hear in context. */
export default function MelodyGrid({ preset = 'hook' }: { preset?: keyof typeof PRESETS }) {
  const { lang, t } = useLang();
  const [notes, setNotes] = useState<Notes>(() => [...PRESETS[preset].notes]);
  const [presetKey, setPresetKey] = useState<string>(preset);
  const [root, setRoot] = useState(9);
  const [scale, setScale] = useState<string>('minor');
  const [sound, setSound] = useState<keyof typeof SOUNDS>('pluck');
  const [bpm, setBpm] = useState(128);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const clock = useRef<(() => number) | null>(null);
  const narrow = useNarrow();
  const all = Array.from({ length: 16 }, (_, i) => i);
  const halves = narrow ? [all.slice(0, 8), all.slice(8)] : [all];

  const code = useMemo(() => toCode(notes, root, scale, sound, bpm, lang), [notes, root, scale, sound, bpm, lang]);

  const place = (row: number, i: number) => {
    setPresetKey('');
    setNotes((n) => n.map((v, j) => (j === i ? (v === row ? null : row) : v)));
  };

  const onClock = useCallback((now: (() => number) | null, isPlaying: boolean) => {
    clock.current = now;
    setPlaying(isPlaying);
    if (!isPlaying) setStep(-1);
  }, []);
  useFrame(playing, () => {
    const now = clock.current?.();
    if (now === undefined) return;
    const s = Math.floor((((now % 1) + 1) % 1) * 16);
    setStep((p) => (p === s ? p : s));
  });

  return (
    <Widget
      title={lang === 'pl' ? 'Siatka melodii → kod Strudla' : 'Melody grid → Strudel code'}
      caption={
        lang === 'pl'
          ? 'Jedna nuta na krok. Wiersze to stopnie skali (0 = tonika; podświetlone wiersze to tonika), więc nie da się trafić „złej” nuty. Pad gra akord toniki, żebyś słyszał, które nuty są „w domu”.'
          : 'One note per step. Rows are scale degrees (0 = tonic; highlighted rows are the tonic), so you cannot hit a "wrong" note. The pad plays the tonic chord so you can hear which notes feel at home.'
      }
    >
      {halves.map((steps) => (
        <div className="grid16 mgrid" key={steps[0]} style={{ gridTemplateColumns: `var(--g-label) repeat(${steps.length}, minmax(0, 1fr))` }}>
          <div className="g-head" />
          {steps.map((i) => (
            <div key={i} className={`g-num ${i % 4 === 0 ? 'beat' : ''} ${step === i ? 'now' : ''}`}>
              {i % 4 === 0 ? i / 4 + 1 : i % 4 === 2 ? '&' : '·'}
            </div>
          ))}
          {ROWS.map((row) => {
            const tonic = row % SCALES[scale].steps.length === 0;
            return (
              <div key={row} style={{ display: 'contents' }}>
                <div className={`g-head ${tonic ? 'tonic' : ''}`}>
                  <code>{row}</code> <span>{noteName(root, scale, row)}</span>
                </div>
                {steps.map((i) => (
                  <button
                    key={i}
                    className={`cell ${notes[i] === row ? 'on' : ''} ${tonic ? 'tonic-row' : ''} ${i % 4 === 0 ? 'beat' : ''} ${step === i ? 'now' : ''}`}
                    onClick={() => place(row, i)}
                    aria-label={`${noteName(root, scale, row)} ${t.w_step} ${i + 1}`}
                    aria-pressed={notes[i] === row}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
      <Controls>
        <Seg
          label={t.w_preset}
          options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: lang === 'pl' ? v.pl : v.en }))}
          value={presetKey}
          onChange={(k) => {
            setPresetKey(k);
            setNotes([...PRESETS[k].notes]);
          }}
        />
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
        <Seg options={SCALE_KEYS.map((k) => ({ value: k, label: lang === 'pl' ? SCALES[k].pl : SCALES[k].en }))} value={scale} onChange={setScale} />
        <Seg
          label={lang === 'pl' ? 'Brzmienie' : 'Sound'}
          options={(Object.keys(SOUNDS) as (keyof typeof SOUNDS)[]).map((k) => ({ value: k, label: k }))}
          value={sound}
          onChange={setSound}
        />
        <Slider label="BPM" value={bpm} min={110} max={160} step={1} onChange={setBpm} format={(v) => String(Math.round(v))} />
      </Controls>
      <Strudel code={code} live onClock={onClock} />
    </Widget>
  );
}
