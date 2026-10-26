import { useCallback, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import Strudel from '../components/StrudelBlock';
import { Controls, Seg, Slider, useFrame, useNarrow, Widget } from './ui';

type Track = 'bd' | 'cp' | 'sd' | 'hh' | 'oh' | 'rim';

const TRACK_INFO: Record<Track, { en: string; pl: string; gain: number }> = {
  bd: { en: 'Kick', pl: 'Stopa', gain: 1 },
  cp: { en: 'Clap', pl: 'Klaśnięcie', gain: 0.8 },
  sd: { en: 'Snare', pl: 'Werbel', gain: 0.7 },
  hh: { en: 'Closed hat', pl: 'Hi-hat zamknięty', gain: 0.45 },
  oh: { en: 'Open hat', pl: 'Hi-hat otwarty', gain: 0.5 },
  rim: { en: 'Rim', pl: 'Rimshot', gain: 0.5 },
};

type Pattern = Partial<Record<Track, number[]>>;

export const PRESETS: Record<string, { en: string; pl: string; bpm: number; swing?: boolean; p: Pattern }> = {
  empty: { en: 'Empty', pl: 'Pusty', bpm: 124, p: {} },
  four: { en: 'Four on the floor', pl: 'Four on the floor', bpm: 124, p: { bd: [0, 4, 8, 12] } },
  offbeat: { en: '+ offbeat hat', pl: '+ hat na offbicie', bpm: 124, p: { bd: [0, 4, 8, 12], oh: [2, 6, 10, 14] } },
  house: {
    en: 'House',
    pl: 'House',
    bpm: 124,
    p: { bd: [0, 4, 8, 12], cp: [4, 12], hh: [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15], oh: [2, 6, 10, 14] },
  },
  shuffle: {
    en: 'Shuffled house',
    pl: 'House z shufflem',
    bpm: 122,
    swing: true,
    p: { bd: [0, 4, 8, 12], cp: [4, 12], hh: [1, 3, 5, 7, 9, 11, 13, 15], oh: [2, 6, 10, 14], rim: [3, 10] },
  },
  hard: {
    en: 'Hard house / bounce',
    pl: 'Hard house / bounce',
    bpm: 145,
    p: { bd: [0, 4, 8, 12], cp: [4, 12], hh: [1, 3, 5, 7, 9, 11, 13, 15], oh: [2, 6, 10, 14], sd: [14, 15] },
  },
};

function toMini(track: Track, steps: Set<number>) {
  const beats: string[] = [];
  for (let b = 0; b < 4; b++) {
    const cells = [0, 1, 2, 3].map((i) => (steps.has(b * 4 + i) ? track : '~'));
    beats.push(`[${cells.join(' ')}]`);
  }
  return beats.join(' ');
}

export function gridToCode(pattern: Record<Track, Set<number>>, tracks: Track[], bpm: number, swing: boolean, lang: 'en' | 'pl' = 'en') {
  const lines = tracks
    .filter((tr) => pattern[tr].size)
    .map((tr) => {
      const g = TRACK_INFO[tr].gain;
      return `  s("${toMini(tr, pattern[tr])}")${g !== 1 ? `.gain(${g})` : ''},`;
    });
  if (!lines.length) lines.push('  silence,');
  const c = lang === 'pl'
    ? { bar: '1 cykl = 1 takt', swing: 'opóźnij co drugą szesnastkę = shuffle' }
    : { bar: '1 cycle = 1 bar', swing: 'delay every 2nd 16th = shuffle' };
  return `setcpm(${Math.round(bpm)}/4) // ${Math.round(bpm)} BPM, ${c.bar}
stack(
${lines.join('\n')}
).bank("RolandTR909")${swing ? `\n.swingBy(1/3, 8) // ${c.swing}` : ''}`;
}

interface Props {
  preset?: keyof typeof PRESETS;
  tracks?: Track[];
  presets?: (keyof typeof PRESETS)[];
}

export default function StepGrid({ preset = 'four', tracks = ['bd', 'cp', 'hh', 'oh'], presets }: Props) {
  const { t, lang } = useLang();
  const load = (key: string) => {
    const pr = PRESETS[key];
    const p = {} as Record<Track, Set<number>>;
    (Object.keys(TRACK_INFO) as Track[]).forEach((tr) => (p[tr] = new Set(pr.p[tr] ?? [])));
    return p;
  };
  const [pattern, setPattern] = useState(() => load(preset));
  const [bpm, setBpm] = useState(PRESETS[preset].bpm);
  const [swing, setSwing] = useState(!!PRESETS[preset].swing);
  const [presetKey, setPresetKey] = useState<string>(preset);
  const [step, setStep] = useState(-1);
  const clock = useRef<(() => number) | null>(null);
  const [playing, setPlaying] = useState(false);
  // phones: two rows of 8 steps instead of one row of 16, so cells are big enough to tap
  const narrow = useNarrow();
  const all = Array.from({ length: 16 }, (_, i) => i);
  const halves = narrow ? [all.slice(0, 8), all.slice(8)] : [all];

  const code = useMemo(() => gridToCode(pattern, tracks, bpm, swing, lang), [pattern, tracks, bpm, swing, lang]);

  const toggle = (tr: Track, i: number) =>
    setPattern((p) => {
      const n = new Set(p[tr]);
      n.has(i) ? n.delete(i) : n.add(i);
      return { ...p, [tr]: n };
    });

  const choose = (key: string) => {
    setPresetKey(key);
    setPattern(load(key));
    setBpm(PRESETS[key].bpm);
    setSwing(!!PRESETS[key].swing);
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
    setStep((prev) => (prev === s ? prev : s));
  });

  return (
    <Widget
      title={lang === 'pl' ? 'Siatka 16 kroków → kod Strudla' : '16-step grid → Strudel code'}
      caption={
        lang === 'pl'
          ? 'Klikaj kratki. Kod poniżej zmienia się na żywo — jeśli gra, usłyszysz zmianę od razu. 1 takt = 4 uderzenia = 16 kroków.'
          : 'Click cells. The code below updates live — if it is playing you hear the change at once. 1 bar = 4 beats = 16 steps.'
      }
    >
      {halves.map((steps) => (
        <div className="grid16" key={steps[0]} style={{ gridTemplateColumns: `var(--g-label) repeat(${steps.length}, minmax(0, 1fr))` }}>
          <div className="g-head" />
          {steps.map((i) => (
            <div key={i} className={`g-num ${i % 4 === 0 ? 'beat' : ''} ${step === i ? 'now' : ''}`}>
              {i % 4 === 0 ? i / 4 + 1 : i % 4 === 2 ? '&' : '·'}
            </div>
          ))}
          {tracks.map((tr) => (
            <div className="g-row" key={tr} style={{ display: 'contents' }}>
              <div className="g-head">
                <code>{tr}</code> <span>{lang === 'pl' ? TRACK_INFO[tr].pl : TRACK_INFO[tr].en}</span>
              </div>
              {steps.map((i) => (
                <button
                  key={i}
                  className={`cell t-${tr} ${pattern[tr].has(i) ? 'on' : ''} ${i % 4 === 0 ? 'beat' : ''} ${step === i ? 'now' : ''}`}
                  onClick={() => toggle(tr, i)}
                  aria-label={`${tr} ${t.w_step} ${i + 1}`}
                  aria-pressed={pattern[tr].has(i)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
      <Controls>
        <Seg
          label={t.w_preset}
          options={(presets ?? (Object.keys(PRESETS) as string[])).map((k) => ({ value: k, label: lang === 'pl' ? PRESETS[k].pl : PRESETS[k].en }))}
          value={presetKey}
          onChange={choose}
        />
        <Slider label="BPM" value={bpm} min={100} max={160} step={1} onChange={setBpm} format={(v) => String(Math.round(v))} />
        <Seg
          label="Swing"
          options={[
            { value: 'off', label: lang === 'pl' ? 'wył.' : 'off' },
            { value: 'on', label: lang === 'pl' ? 'wł.' : 'on' },
          ]}
          value={swing ? 'on' : 'off'}
          onChange={(v) => setSwing(v === 'on')}
        />
      </Controls>
      <Strudel code={code} live onClock={onClock} />
    </Widget>
  );
}
