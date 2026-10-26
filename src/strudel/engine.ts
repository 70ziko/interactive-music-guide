/*
 * Creates Strudel editors from Strudel's own packages.
 *
 * This mirrors @strudel/repl's <strudel-editor> component (repl-component.mjs + prebake.mjs,
 * AGPL-3.0-or-later, Strudel contributors) with one change: every editor gets a unique `id`.
 * <strudel-editor> passes no id, so inline widgets (._pianoroll(), ._scope() …) in different
 * editors got the same DOM id and fought over one canvas, freezing the page.
 */
import * as core from '@strudel/core';
import { evalScope, noteToMidi, valueToMidi, Pattern, silence } from '@strudel/core';
import { StrudelMirror, codemirrorSettings } from '@strudel/codemirror';
import { getDrawContext } from '@strudel/draw';
import { transpiler } from '@strudel/transpiler';
import {
  aliasBank,
  getAudioContext,
  initAudio,
  registerSynthSounds,
  registerZZFXSounds,
  samples,
  webaudioOutput,
} from '@strudel/webaudio';

// Start audio + load Strudel's AudioWorklets once, on the first user gesture.
// (superdough's own initAudioOnFirstClick only listens for mousedown, which misses keyboard users.)
let audioInit: Promise<void> | null = null;
export function ensureAudio() {
  if (!audioInit) audioInit = initAudio();
  return audioInit;
}
for (const ev of ['mousedown', 'keydown', 'touchstart']) {
  document.addEventListener(ev, () => ensureAudio(), { once: true, capture: true });
}

const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
const ts = 'https://raw.githubusercontent.com/todepond/samples/main';
const tc = 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main';

let prebaked: Promise<unknown> | null = null;
/** Load functions + sounds once for the whole page (the stock component did it per editor). */
function prebake() {
  if (!prebaked) {
    prebaked = Promise.all([
      evalScope(
        core,
        import('@strudel/draw'),
        import('@strudel/mini'),
        import('@strudel/tonal'),
        import('@strudel/webaudio'),
        import('@strudel/codemirror'),
        import('@strudel/soundfonts'),
      ),
      registerSynthSounds(),
      registerZZFXSounds(),
      import('@strudel/soundfonts').then(({ registerSoundfonts }) => registerSoundfonts()),
      samples(`${ds}/tidal-drum-machines.json`),
      samples(`${ds}/piano.json`),
      samples(`${ds}/Dirt-Samples.json`),
      samples(`${ds}/vcsl.json`),
      samples(`${ds}/mridangam.json`),
      samples(`${tc}/strudel.json`),
    ]).then(() => aliasBank(`${ts}/tidal-drum-machines-alias.json`));
  }
  return prebaked;
}

// .piano() helper from the stock prebake
const maxPan = noteToMidi('C8');
const panwidth = (pan: number, width: number) => pan * width + (1 - width) / 2;
(Pattern.prototype as any).piano = function () {
  return this.fmap((v: any) => ({ ...v, clip: v.clip ?? 1 }))
    .s('piano')
    .release(0.1)
    .fmap((value: any) => {
      const midi = valueToMidi(value);
      const pan = panwidth(Math.min(Math.round(midi) / maxPan, 1), 0.5);
      return { ...value, pan: (value.pan || 1) * pan };
    });
};

export interface StrudelState {
  started?: boolean;
  pending?: boolean;
  error?: { message?: string } | string;
  code?: string;
}

export interface StrudelEditor {
  evaluate: () => Promise<void>;
  stop: () => Promise<void>;
  setCode: (code: string) => void;
  code: string;
  repl: { scheduler: { now: () => number; started: boolean } };
}

let counter = 0;

export function createEditor(root: HTMLElement, code: string, onUpdateState: (s: StrudelState) => void): StrudelEditor {
  const id = `img${++counter}`;
  const editor = new StrudelMirror({
    id,
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    root,
    initialCode: code,
    pattern: silence,
    drawTime: [-2, 2],
    drawContext: getDrawContext(),
    prebake,
    onUpdateState,
    solo: true,
  });
  editor.updateSettings(codemirrorSettings.get());
  editor.setCode(code);
  return editor;
}
