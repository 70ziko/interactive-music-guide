# Interactive Music Guide

Learn music theory, synths and song structure for **house, bounce and hard house** — with real, runnable [Strudel](https://strudel.cc) code on every page. English and Polish.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Audio starts after your first click (browser autoplay rules).

```bash
npm run build     # static site in dist/ (works from any folder or GitHub Pages)
npm run typecheck
```

## What's inside

| Part | Lessons |
|---|---|
| Sound & math | 01 Sound is math · 02 Pitch, octaves and ratios |
| Rhythm | 03 Time: cycles, bars, steps · 04 House drum grammar · 05 Groove and variation |
| Harmony & melody | 06 Scales and keys · 07 Chords and progressions · 08 Melody and hooks · 09 Bass and the offbeat |
| Synthesis & sound design | 10 Synth basics · 11 Effects · 12 Sound design recipes |
| Arrangement & mix | 13 Song structure · 14 Tension and release · 15 Mixing basics |
| Genres & practice | 16 House · 17 Bounce / donk · 18 Hard house · 19 Techno · 20 Acid techno · 21 Groovy techno · 22 EDM / big room · 23 Trance · 24 From idea to finished track |
| Reference | Cheat sheet · Glossary EN ↔ PL |

Each lesson: concept → interactive widget → Strudel blocks → "Try this" → Do / Don't.

## How it is built

- **Vite + React + TypeScript**, lessons are **MDX** files in `src/lessons/{en,pl}/`.
- **Strudel is not reimplemented.** `src/strudel/engine.ts` creates editors with Strudel's own `StrudelMirror` (`@strudel/codemirror`) plus the stock sound bank prebake. It mirrors `@strudel/repl`'s `<strudel-editor>` but gives every editor a unique id — without it, inline widgets like `._pianoroll()` in two editors share one canvas and freeze the page.
- `src/components/StrudelBlock.tsx` wraps an editor with Play / Stop / Reset / Copy / open-in-strudel.cc. Only one block plays at a time (Strudel's solo mode).
- `src/widgets/` are concept visualisations (waveform, harmonics, rhythm→pitch, intervals, keyboard, step grid, melody grid, circle of fifths, ADSR, filter, tempo calculator, ducking curve, frequency map, arrangement). They use plain Web Audio only for demo tones; all lesson code runs through Strudel.
- UI strings: `src/i18n/{en,pl}.ts`. Language lives in the URL (`#/en/…`, `#/pl/…`) and is remembered in localStorage.

## Strudel gotchas found while writing the course

- Do arithmetic on `n` **before** `.scale()`: `n("[0,2,4]").add(n(prog)).scale(key)`. After `.scale()` it is silently ignored.
- `.add("…")` with plain numbers on a `note`/`n` pattern does nothing ("Can't do arithmetic on control pattern"); wrap it: `.add(n("…"))` or `.add(note("…"))`.
- Inside `arrange()` every section counts its own cycles from 0.
- Signals like `saw` on `lpf` are read once per note; for one long note use a filter envelope (`lpenv`, `lpattack`).
- Reverb size and delay time are shared per `orbit`; Strudel's delay line maxes out at 1 s.

## Adding a lesson

1. Add an entry to `src/lessons/index.ts` (slug, part, titles, blurbs). Lesson numbers come from the order in that list.
2. Create `src/lessons/en/<slug>.mdx` and `src/lessons/pl/<slug>.mdx`.
3. Use components without imports: `<Strudel code={\`…\`} />`, `<DoDont do={[…]} dont={[…]} />`, `<TryThis>`, `<Callout kind="math|tip|warn">`, `<Formula>`, and any widget from `src/components/mdxComponents.tsx`.

## License

AGPL-3.0-or-later, because the Strudel packages are AGPL-3.0-or-later. If you publish the site, publish its source too.
