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
  techno: {
    en: 'Techno (~132 BPM)',
    pl: 'Techno (~132 BPM)',
    bpm: 132,
    sections: [
      S('Intro', 'Intro', 32, 3, ['kick', 'hats'], 'Long, drums-first, made for mixing. Layers creep in.', 'Długie, od bębnów, do miksowania. Warstwy wchodzą powoli.'),
      S('Build', 'Budowanie', 32, 6, ['kick', 'hats', 'clap', 'bass', 'fx'], 'Rumble/bass and percussion arrive one by one; filters open slowly.', 'Rumble/bas i perkusja wchodzą po kolei; filtry powoli się otwierają.'),
      S('Peak', 'Szczyt', 32, 8, ['kick', 'hats', 'clap', 'bass', 'lead', 'fx'], 'The hypnotic hook loops; small changes every 8 bars.', 'Hipnotyczny motyw w pętli; drobne zmiany co 8 taktów.'),
      S('Break', 'Przerwa', 16, 4, ['lead', 'pad', 'fx'], 'Short. Kick out, the loop and atmosphere stay.', 'Krótka. Stopa wypada, zostaje pętla i atmosfera.'),
      S('Peak 2', 'Szczyt 2', 32, 9, ['kick', 'hats', 'clap', 'bass', 'lead', 'fx'], 'Back in, harder: more resonance, more percussion.', 'Powrót, mocniej: więcej rezonansu, więcej perkusji.'),
      S('Outro', 'Outro', 32, 3, ['kick', 'hats'], 'Strip back slowly for the next record.', 'Powolne rozbieranie pod następny numer.'),
    ],
  },
  edm: {
    en: 'EDM / big room (~128 BPM)',
    pl: 'EDM / big room (~128 BPM)',
    bpm: 128,
    sections: [
      S('Intro', 'Intro', 16, 4, ['kick', 'hats', 'chords'], 'Drums and a filtered hint of the hook.', 'Bębny i przefiltrowana zapowiedź hooka.'),
      S('Verse', 'Zwrotka', 16, 4, ['chords', 'pad', 'lead'], 'Breakdown-style: chords, vocal or melody, no kick.', 'Jak breakdown: akordy, wokal albo melodia, bez stopy.'),
      S('Build-up', 'Narastanie', 8, 7, ['clap', 'chords', 'fx'], 'Snare roll accelerates, riser, pitch and filter rise.', 'Rolka werbla przyspiesza, riser, rośnie wysokość i filtr.'),
      S('Drop', 'Drop', 16, 10, ['kick', 'hats', 'clap', 'bass', 'lead', 'fx'], 'Big kick + lead. Simple, loud, wide.', 'Wielka stopa + lead. Prosto, głośno, szeroko.'),
      S('Break', 'Przerwa', 16, 3, ['chords', 'pad', 'lead'], 'Back to the verse idea; emotional.', 'Powrót do zwrotki; emocjonalnie.'),
      S('Build-up 2', 'Narastanie 2', 8, 8, ['clap', 'chords', 'fx'], 'Bigger and longer-feeling than the first.', 'Większe niż pierwsze.'),
      S('Drop 2', 'Drop 2', 16, 10, ['kick', 'hats', 'clap', 'bass', 'lead', 'chords', 'fx'], 'Drop + a twist (new lead layer or variation).', 'Drop + zmiana (nowa warstwa leadu albo wariacja).'),
      S('Outro', 'Outro', 16, 3, ['kick', 'hats'], 'Drums out for the DJ.', 'Bębny na wyjście dla DJ-a.'),
    ],
  },
  trance: {
    en: 'Trance (~138 BPM)',
    pl: 'Trance (~138 BPM)',
    bpm: 138,
    sections: [
      S('Intro', 'Intro', 16, 3, ['kick', 'hats'], 'Drums only, for mixing in.', 'Same bębny, do wmiksowania.'),
      S('Groove', 'Groove', 32, 6, ['kick', 'hats', 'clap', 'bass', 'chords'], 'Rolling bass, then the arp and the gated pad — one new layer every 8–16 bars.', 'Toczący się bas, potem arp i bramkowany pad — nowa warstwa co 8–16 taktów.'),
      S('Breakdown', 'Breakdown', 32, 3, ['pad', 'lead', 'fx'], 'Kick and bass out. The hook alone over a pad: the emotional centre.', 'Stopa i bas wypadają. Sam hook nad padem: emocjonalne centrum.'),
      S('Build-up', 'Narastanie', 8, 7, ['clap', 'lead', 'pad', 'fx'], 'Snare roll, riser, the lead filter opens, one silent beat.', 'Rolka werbla, riser, otwiera się filtr leadu, jedno ciche uderzenie.'),
      S('Anthem', 'Hymn', 32, 10, ['kick', 'hats', 'clap', 'bass', 'chords', 'lead'], 'The same hook over everything, pumping with the kick.', 'Ten sam hook nad wszystkim, pompujący ze stopą.'),
      S('Outro', 'Outro', 16, 4, ['kick', 'hats', 'bass'], 'Drums and bass out for the next record.', 'Bębny i bas na wyjście pod następny numer.'),
    ],
  },
  bounce: {
    en: 'Bounce / donk (~145 BPM)',
    pl: 'Bounce / donk (~145 BPM)',
    bpm: 145,
    sections: [
      S('Intro', 'Intro', 16, 4, ['kick', 'hats'], 'Kick and offbeat hats; a filtered hint of the donk.', 'Stopa i hi-haty na offbicie; przefiltrowana zapowiedź donka.'),
      S('Donk in', 'Wejście donka', 16, 6, ['kick', 'hats', 'clap', 'bass'], 'The donk takes the offbeat. This IS the groove.', 'Donk zajmuje offbit. To JEST groove.'),
      S('Hook', 'Hook', 16, 8, ['kick', 'hats', 'clap', 'bass', 'lead'], 'Catchy lead hook on top, short and repeated.', 'Chwytliwy lead na wierzchu, krótki i powtarzany.'),
      S('Breakdown', 'Breakdown', 16, 3, ['lead', 'pad', 'fx'], 'Hook alone with pad and reverb — let the crowd sing it.', 'Sam hook z padem i pogłosem — niech tłum go zaśpiewa.'),
      S('Build-up', 'Narastanie', 8, 7, ['clap', 'lead', 'fx'], 'Snare roll, rising filter, donk teases.', 'Rolka werbla, rosnący filtr, zapowiedzi donka.'),
      S('Drop', 'Drop', 32, 10, ['kick', 'hats', 'clap', 'bass', 'chords', 'lead'], 'Everything, hook + donk + stabs.', 'Wszystko: hook + donk + stabsy.'),
      S('Outro', 'Outro', 16, 4, ['kick', 'hats', 'bass'], 'Kick, hats and donk for the next mix.', 'Stopa, haty i donk pod następny miks.'),
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
  const n = T.sections.length;

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
        <div className="arr-note-head">
          <button className="btn" onClick={() => setSel((s) => (s + n - 1) % n)} aria-label={t.prev}>
            ‹
          </button>
          <strong>
            {cur.name[lang]} · {cur.bars} {t.w_bars} · {t.w_energy} {cur.energy}/10
          </strong>
          <button className="btn" onClick={() => setSel((s) => (s + 1) % n)} aria-label={t.next}>
            ›
          </button>
        </div>
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
