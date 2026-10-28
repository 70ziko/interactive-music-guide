import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Lang } from '../i18n/LangContext';

export type Part = 'sound' | 'rhythm' | 'harmony' | 'synth' | 'structure' | 'genres' | 'reference';

export const PARTS: Part[] = ['sound', 'rhythm', 'harmony', 'synth', 'structure', 'genres', 'reference'];

export interface LessonMeta {
  slug: string;
  part: Part;
  title: Record<Lang, string>;
  blurb: Record<Lang, string>;
}

const L = (slug: string, part: Part, en: string, pl: string, blurbEn: string, blurbPl: string): LessonMeta => ({
  slug,
  part,
  title: { en, pl },
  blurb: { en: blurbEn, pl: blurbPl },
});

// Order here = order in the course. File name = `${slug}.mdx` in en/ and pl/.
// Lesson numbers are computed from this order; reference pages get no number.
export const lessons: LessonMeta[] = [
  L('sound', 'sound', 'Sound is math', 'Dźwięk to matematyka',
    'Frequency, amplitude, waveforms and harmonics.',
    'Częstotliwość, amplituda, kształty fal i harmoniczne.'),
  L('pitch', 'sound', 'Pitch, octaves and ratios', 'Wysokość, oktawy i stosunki',
    'Why 2:1 and 3:2 sound good, and how rhythm turns into pitch.',
    'Dlaczego 2:1 i 3:2 brzmią dobrze i jak rytm zamienia się w wysokość.'),
  L('time', 'rhythm', 'Time: cycles, bars, steps', 'Czas: cykle, takty, kroki',
    'BPM vs Strudel cycles, the 16-step grid, mini-notation.',
    'BPM a cykle Strudla, siatka 16 kroków, mini-notacja.'),
  L('drums', 'rhythm', 'Dance drum grammar', 'Gramatyka bębnów klubowych',
    'Four-on-the-floor, claps, offbeat hats, swing, Euclid.',
    'Four-on-the-floor, klaśnięcia, hi-haty na offbicie, swing, Euklides.'),
  L('groove', 'rhythm', 'Groove and variation', 'Groove i wariacje',
    'Keep a loop alive: ghost notes, chance, every-N-bars changes, humanising.',
    'Jak utrzymać pętlę przy życiu: ghost notes, losowość, zmiany co N taktów.'),
  L('scales', 'harmony', 'Scales and keys', 'Skale i tonacje',
    'Major, minor, dorian — and why you pick one key per track.',
    'Dur, moll, dorycka — i dlaczego wybierasz jedną tonację na utwór.'),
  L('chords', 'harmony', 'Chords and progressions', 'Akordy i progresje',
    'Triads, minor 7ths, house stabs, the circle of fifths.',
    'Trójdźwięki, akordy septymowe, stabsy house, koło kwintowe.'),
  L('melody', 'harmony', 'Melody and hooks', 'Melodia i hooki',
    'Motifs, contour, call and response, arps — writing a riff people remember.',
    'Motywy, kontur, pytanie i odpowiedź, arpeggia — riff, który się pamięta.'),
  L('bass', 'harmony', 'Bass and the offbeat', 'Bas i offbit',
    'Offbeat bass, the donk, and keeping kick and bass apart.',
    'Bas na offbicie, donk i rozdzielanie stopy od basu.'),
  L('synth', 'synth', 'Synth basics', 'Podstawy syntezy',
    'Oscillator → filter → envelope → LFO. Acid, stabs, pads.',
    'Oscylator → filtr → obwiednia → LFO. Acid, stabsy, pady.'),
  L('effects', 'synth', 'Effects: space, time, dirt', 'Efekty: przestrzeń, czas, brud',
    'Reverb, delay in sync, distortion, the DJ filter, compression and orbits.',
    'Pogłos, delay w tempie, przester, filtr DJ-ski, kompresja i orbity.'),
  L('sound-design', 'synth', 'Sound design recipes', 'Przepisy na brzmienia',
    'Hoover, reese, supersaw lead, organ stab, donk variations, risers and impacts.',
    'Hoover, reese, lead supersaw, organowy stab, warianty donka, risery i impakty.'),
  L('structure', 'structure', 'Song structure', 'Struktura utworu',
    '8-bar blocks, intro → build → drop → break, arrange() in Strudel.',
    'Bloki po 8 taktów, intro → narastanie → drop → przerwa, arrange() w Strudlu.'),
  L('tension', 'structure', 'Tension and release', 'Napięcie i rozładowanie',
    'Build-ups that work: rolls, risers, filter sweeps, silence, the drop.',
    'Narastania, które działają: rolki, risery, sweepy filtra, cisza, drop.'),
  L('mixing', 'structure', 'Mixing basics', 'Podstawy miksu',
    'Levels, frequency slots, panning, space, ducking — a mix checklist.',
    'Poziomy, pasma, panorama, przestrzeń, ducking — lista kontrolna miksu.'),
  L('house', 'genres', 'Playbook: house', 'Podręcznik: house',
    'What makes house house, sub-styles, and a full track template.',
    'Co sprawia, że house to house, odmiany i pełny szablon utworu.'),
  L('bounce', 'genres', 'Playbook: bounce / donk', 'Podręcznik: bounce / donk',
    'Scouse house roots, the donk bassline, hooks, and a full track template.',
    'Korzenie scouse house, linia donka, hooki i pełny szablon utworu.'),
  L('hard-house', 'genres', 'Playbook: hard house', 'Podręcznik: hard house',
    'Offbeat stabs, hoovers, long strings, drum-roll drops — full template.',
    'Stabsy na offbicie, hoovery, długie smyczki, dropy po rolce — pełny szablon.'),
  L('techno', 'genres', 'Playbook: techno', 'Podręcznik: techno',
    'Detroit roots, rhythm over harmony, hypnotic loops, the rumble, long DJ-friendly builds.',
    'Korzenie z Detroit, rytm ponad harmonią, hipnotyczne pętle, rumble, długie przejścia pod DJ-a.'),
  L('acid-techno', 'genres', 'Playbook: acid techno', 'Podręcznik: acid techno',
    'The 303 squelch on hard techno: accents, riding cutoff and resonance, distortion.',
    'Mlaskanie 303 na twardym techno: akcenty, kręcenie odcięciem i rezonansem, przester.'),
  L('groovy-techno', 'genres', 'Playbook: groovy techno', 'Podręcznik: groovy techno',
    'Rolling percussion, shuffle, toms and congas, short syncopated bass.',
    'Toczące się perkusjonalia, shuffle, tomy i kongi, krótki synkopowany bas.'),
  L('edm', 'genres', 'Playbook: EDM / big room', 'Podręcznik: EDM / big room',
    'Festival EDM: pop structure, long build-ups, supersaw leads, the drop.',
    'Festiwalowe EDM: struktura popowa, długie narastania, leady supersaw, drop.'),
  L('trance', 'genres', 'Playbook: trance', 'Podręcznik: trance',
    'Rolling 16th bass, arps, trance gates, the long breakdown and the anthem.',
    'Toczący się bas w szesnastkach, arpeggia, bramki trance, długi breakdown i hymn.'),
  L('workflow', 'genres', 'From idea to finished track', 'Od pomysłu do gotowego utworu',
    'A step-by-step workflow, sliders for live tweaking, and a done-checklist.',
    'Proces krok po kroku, suwaki do kręcenia na żywo i lista „gotowe”.'),
  L('cheatsheet', 'reference', 'Cheat sheet', 'Ściąga',
    'Mini-notation, time math, frequency map, key functions, genre numbers.',
    'Mini-notacja, matematyka czasu, mapa pasm, kluczowe funkcje, liczby gatunków.'),
  L('glossary', 'reference', 'Glossary EN ↔ PL', 'Słowniczek EN ↔ PL',
    'Every term from the course in English and Polish, with the Strudel function.',
    'Każde pojęcie z kursu po angielsku i po polsku, z funkcją Strudla.'),
];

/** "01".."19" for lessons, null for reference pages. */
export function lessonNumber(slug: string) {
  const numbered = lessons.filter((l) => l.part !== 'reference');
  const i = numbered.findIndex((l) => l.slug === slug);
  return i < 0 ? null : String(i + 1).padStart(2, '0');
}

const modules = import.meta.glob<{ default: ComponentType }>('./*/*.mdx');

// One lazy component per lesson file, created once. Creating lazy() during render
// makes React suspend forever when navigation runs as a transition.
const cache = new Map<string, LazyExoticComponent<ComponentType>>();

export function lessonComponent(lang: Lang, slug: string) {
  const key = `./${lang}/${slug}.mdx`;
  const loader = modules[key];
  if (!loader) return null;
  if (!cache.has(key)) cache.set(key, lazy(loader));
  return cache.get(key)!;
}

export const lessonIndex = (slug: string) => lessons.findIndex((l) => l.slug === slug);
