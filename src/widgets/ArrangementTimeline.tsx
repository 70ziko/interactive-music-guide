import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { Seg, Widget } from './ui';

type Lane = 'kick' | 'hats' | 'clap' | 'bass' | 'chords' | 'lead' | 'pad' | 'fx';
const LANES: { id: Lane; en: string; pl: string }[] = [
  { id: 'kick', en: 'Kick', pl: 'Stopa' },
  { id: 'hats', en: 'Hats', pl: 'Hi-haty' },
  { id: 'clap', en: 'Clap/snare', pl: 'Klap/werbel' },
  { id: 'bass', en: 'Bass', pl: 'Bas' },
  { id: 'chords', en: 'Chords/stabs', pl: 'Akordy/stabsy' },
  { id: 'lead', en: 'Lead/hoover', pl: 'Lead/hoover' },
  { id: 'pad', en: 'Pad', pl: 'Pad' },
  { id: 'fx', en: 'FX/riser', pl: 'FX/riser' },
];

interface Section {
  name: { en: string; pl: string };
  bars: number;
  energy: number; // 1..10
  lanes: Lane[];
  note: { en: string; pl: string };
}

const S = (en: string, pl: string, bars: number, energy: number, lanes: Lane[], noteEn: string, notePl: string): Section => ({
  name: { en, pl },
  bars,
  energy,
  lanes,
  note: { en: noteEn, pl: notePl },
});

const TEMPLATES: Record<string, { en: string; pl: string; bpm: number; sections: Section[] }> = {
  house: {
    en: 'House (~124 BPM)',
    pl: 'House (~124 BPM)',
    bpm: 124,
    sections: [
      S('Intro', 'Intro', 16, 3, ['kick', 'hats'], 'DJ-friendly: drums only, so it mixes in cleanly.', 'Pod DJ-a: same bębny, żeby łatwo zmiksować.'),
      S('Groove', 'Groove', 16, 5, ['kick', 'hats', 'clap', 'bass'], 'Bass enters. Add one new layer every 8 bars.', 'Wchodzi bas. Dodawaj jedną warstwę co 8 taktów.'),
      S('Main', 'Główna', 32, 7, ['kick', 'hats', 'clap', 'bass', 'chords'], 'Chord stabs carry the hook.', 'Stabsy akordów niosą motyw.'),
      S('Breakdown', 'Breakdown', 16, 3, ['chords', 'pad', 'fx'], 'Kick out. Chords and pad breathe. Tension goes up while energy goes down.', 'Stopa wypada. Akordy i pad oddychają. Napięcie rośnie, energia spada.'),
      S('Build-up', 'Narastanie', 8, 6, ['hats', 'clap', 'chords', 'fx'], 'Snare/clap roll speeds up, filter opens, riser climbs.', 'Rolka werbla przyspiesza, filtr się otwiera, riser rośnie.'),
      S('Drop', 'Drop', 32, 9, ['kick', 'hats', 'clap', 'bass', 'chords', 'lead'], 'Everything back at once. The payoff.', 'Wszystko wraca naraz. Nagroda.'),
      S('Outro', 'Outro', 16, 3, ['kick', 'hats'], 'Strip back to drums for the next DJ mix.', 'Rozbierz do bębnów pod następny miks.'),
    ],
  },
  hard: {
    en: 'Hard house / bounce (~145 BPM)',
    pl: 'Hard house / bounce (~145 BPM)',
    bpm: 145,
    sections: [
      S('Intro', 'Intro', 16, 4, ['kick', 'hats'], 'Hard kick + offbeat hats from bar 1.', 'Twarda stopa + hi-haty na offbicie od pierwszego taktu.'),
      S('Bass in', 'Wejście basu', 16, 6, ['kick', 'hats', 'clap', 'bass'], 'Offbeat bass (donk) locks in with the kick.', 'Bas na offbicie (donk) zazębia się ze stopą.'),
      S('Main', 'Główna', 32, 8, ['kick', 'hats', 'clap', 'bass', 'lead'], 'Hoover / lead riff. Short phrases, repeated.', 'Riff hoovera / leadu. Krótkie frazy, powtarzane.'),
      S('Breakdown', 'Breakdown', 16, 3, ['lead', 'pad', 'fx'], 'Melody exposed, often with big reverb.', 'Melodia odsłonięta, często z dużym pogłosem.'),
      S('Build-up', 'Narastanie', 8, 7, ['clap', 'lead', 'fx'], 'Snare roll 8ths → 16ths → 32nds, pitch rising.', 'Rolka werbla ósemki → szesnastki → trzydziestodwójki, rosnąca wysokość.'),
      S('Drop', 'Drop', 32, 10, ['kick', 'hats', 'clap', 'bass', 'lead', 'fx'], 'Full power. Keep it simple and loud.', 'Pełna moc. Prosto i głośno.'),
      S('Outro', 'Outro', 16, 4, ['kick', 'hats', 'bass'], 'Drums + bass out for mixing.', 'Bębny + bas na wyjście do miksu.'),
    ],
  },
};

export default function ArrangementTimeline({ template = 'house' }) {
  const { t, lang } = useLang();
  const [tpl, setTpl] = useState(template);
  const [sel, setSel] = useState(0);
  const T = TEMPLATES[tpl];
  const totalBars = T.sections.reduce((s, x) => s + x.bars, 0);
  const minutes = (totalBars * 4) / T.bpm;
  let acc = 0;
  const cols = T.sections.map((s) => {
    const c = { start: acc, ...s };
    acc += s.bars;
    return c;
  });
  const pct = (b: number) => (b / totalBars) * 100;
  const energyPts = cols.map((c) => `${pct(c.start + c.bars / 2)},${100 - c.energy * 9}`).join(' ');
  const cur = T.sections[sel] ?? T.sections[0];

  return (
    <Widget
      title={lang === 'pl' ? 'Mapa aranżacji' : 'Arrangement map'}
      caption={
        lang === 'pl'
          ? `${totalBars} ${t.w_bars} × 4 uderzenia ÷ ${T.bpm} BPM ≈ ${minutes.toFixed(1)} min. Każda sekcja to wielokrotność 8 taktów.`
          : `${totalBars} ${t.w_bars} × 4 beats ÷ ${T.bpm} BPM ≈ ${minutes.toFixed(1)} min. Every section is a multiple of 8 bars.`
      }
    >
      <div className="arr-scroll">
        <div className="arr">
          <svg className="arr-energy" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={t.w_energy}>
            <polyline points={energyPts} />
          </svg>
          <div className="arr-sections">
            {cols.map((c, i) => (
              <button
                key={i}
                className={`arr-sec ${i === sel ? 'on' : ''}`}
                style={{ left: `${pct(c.start)}%`, width: `${pct(c.bars)}%` }}
                onClick={() => setSel(i)}
              >
                <strong>{c.name[lang]}</strong>
                <small>{c.bars}</small>
              </button>
            ))}
          </div>
          {LANES.map((ln) => (
            <div className="arr-lane" key={ln.id}>
              <span className="arr-lane-name">{lang === 'pl' ? ln.pl : ln.en}</span>
              {cols.map((c, i) =>
                c.lanes.includes(ln.id) ? (
                  <span
                    key={i}
                    className={`arr-block l-${ln.id} ${i === sel ? 'on' : ''}`}
                    style={{ left: `${pct(c.start)}%`, width: `calc(${pct(c.bars)}% - 2px)` }}
                  />
                ) : null,
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="arr-note">
        <strong>
          {cur.name[lang]} · {cur.bars} {t.w_bars} · {t.w_energy} {cur.energy}/10
        </strong>
        <p>{cur.note[lang]}</p>
      </div>
      <Seg
        options={Object.entries(TEMPLATES).map(([k, v]) => ({ value: k, label: lang === 'pl' ? v.pl : v.en }))}
        value={tpl}
        onChange={(k) => {
          setTpl(k);
          setSel(0);
        }}
      />
    </Widget>
  );
}
