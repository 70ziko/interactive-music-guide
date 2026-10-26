import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Lang } from '../i18n/LangContext';

export type Part = 'sound' | 'rhythm' | 'harmony' | 'synth' | 'structure';

export interface LessonMeta {
  slug: string;
  part: Part;
  title: Record<Lang, string>;
  blurb: Record<Lang, string>;
}

// Order here = order in the course. File name = `${slug}.mdx` in en/ and pl/.
export const lessons: LessonMeta[] = [
  {
    slug: '01-sound',
    part: 'sound',
    title: { en: 'Sound is math', pl: 'Dźwięk to matematyka' },
    blurb: {
      en: 'Frequency, amplitude, waveforms and harmonics.',
      pl: 'Częstotliwość, amplituda, kształty fal i harmoniczne.',
    },
  },
  {
    slug: '02-pitch',
    part: 'sound',
    title: { en: 'Pitch, octaves and ratios', pl: 'Wysokość, oktawy i stosunki' },
    blurb: {
      en: 'Why 2:1 and 3:2 sound good, and how rhythm turns into pitch.',
      pl: 'Dlaczego 2:1 i 3:2 brzmią dobrze i jak rytm zamienia się w wysokość.',
    },
  },
  {
    slug: '03-time',
    part: 'rhythm',
    title: { en: 'Time: cycles, bars, steps', pl: 'Czas: cykle, takty, kroki' },
    blurb: {
      en: 'BPM vs Strudel cycles, the 16-step grid, mini-notation.',
      pl: 'BPM a cykle Strudla, siatka 16 kroków, mini-notacja.',
    },
  },
  {
    slug: '04-drums',
    part: 'rhythm',
    title: { en: 'House drum grammar', pl: 'Gramatyka bębnów house' },
    blurb: {
      en: 'Four-on-the-floor, claps, offbeat hats, swing, Euclid.',
      pl: 'Four-on-the-floor, klaśnięcia, hi-haty na offbicie, swing, Euklides.',
    },
  },
  {
    slug: '05-scales',
    part: 'harmony',
    title: { en: 'Scales and keys', pl: 'Skale i tonacje' },
    blurb: {
      en: 'Major, minor, dorian — and why you pick one key per track.',
      pl: 'Dur, moll, dorycka — i dlaczego wybierasz jedną tonację na utwór.',
    },
  },
  {
    slug: '06-chords',
    part: 'harmony',
    title: { en: 'Chords and progressions', pl: 'Akordy i progresje' },
    blurb: {
      en: 'Triads, minor 7ths, house stabs, the circle of fifths.',
      pl: 'Trójdźwięki, akordy septymowe, stabsy house, koło kwintowe.',
    },
  },
  {
    slug: '07-bass',
    part: 'harmony',
    title: { en: 'Bass and the offbeat', pl: 'Bas i offbit' },
    blurb: {
      en: 'Offbeat bass, the donk, and keeping kick and bass apart.',
      pl: 'Bas na offbicie, donk i rozdzielanie stopy od basu.',
    },
  },
  {
    slug: '08-synth',
    part: 'synth',
    title: { en: 'Synth basics', pl: 'Podstawy syntezy' },
    blurb: {
      en: 'Oscillator → filter → envelope → LFO. Acid, stabs, pads.',
      pl: 'Oscylator → filtr → obwiednia → LFO. Acid, stabsy, pady.',
    },
  },
  {
    slug: '09-structure',
    part: 'structure',
    title: { en: 'Song structure', pl: 'Struktura utworu' },
    blurb: {
      en: '8-bar blocks, intro → build → drop → break, arrange() in Strudel.',
      pl: 'Bloki po 8 taktów, intro → narastanie → drop → przerwa, arrange() w Strudlu.',
    },
  },
];

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
