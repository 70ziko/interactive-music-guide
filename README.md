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
| Rhythm | 03 Time: cycles, bars, steps · 04 House drum grammar |
| Harmony | 05 Scales and keys · 06 Chords and progressions · 07 Bass and the offbeat |
| Synthesis | 08 Synth basics |
| Song structure | 09 Song structure |

Each lesson: concept → interactive widget → Strudel blocks → "Try this" → Do / Don't.

## How it is built

- **Vite + React + TypeScript**, lessons are **MDX** files in `src/lessons/{en,pl}/`.
- **Strudel is not reimplemented.** `src/strudel/engine.ts` creates editors with Strudel's own `StrudelMirror` (`@strudel/codemirror`) plus the stock sound bank prebake. It mirrors `@strudel/repl`'s `<strudel-editor>` but gives every editor a unique id — without it, inline widgets like `._pianoroll()` in two editors share one canvas and freeze the page.
- `src/components/StrudelBlock.tsx` wraps an editor with Play / Stop / Reset / Copy / open-in-strudel.cc. Only one block plays at a time (Strudel's solo mode).
- `src/widgets/` are concept visualisations (waveform, harmonics, rhythm→pitch, intervals, keyboard, step grid, circle of fifths, ADSR, filter, arrangement). They use plain Web Audio only for demo tones; all lesson code runs through Strudel.
- UI strings: `src/i18n/{en,pl}.ts`. Language lives in the URL (`#/en/…`, `#/pl/…`) and is remembered in localStorage.

## Adding a lesson

1. Add an entry to `src/lessons/index.ts` (slug, part, titles, blurbs).
2. Create `src/lessons/en/<slug>.mdx` and `src/lessons/pl/<slug>.mdx`.
3. Use components without imports: `<Strudel code={\`…\`} />`, `<DoDont do={[…]} dont={[…]} />`, `<TryThis>`, `<Callout kind="math|tip|warn">`, `<Formula>`, and any widget from `src/components/mdxComponents.tsx`.

## License

AGPL-3.0-or-later, because the Strudel packages are AGPL-3.0-or-later. If you publish the site, publish its source too.
