import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';

/*
 * A lesson code block running the real Strudel editor (StrudelMirror from @strudel/codemirror).
 * We only add buttons around it; parsing, scheduling, sound and highlighting are Strudel's.
 */
import type { StrudelEditor, StrudelState } from '../strudel/engine';

// Editor settings Strudel reads from localStorage (key and shape from @strudel/codemirror defaultSettings).
const EDITOR_SETTINGS = {
  keybindings: 'codemirror',
  isBracketMatchingEnabled: true,
  isBracketClosingEnabled: true,
  isLineNumbersDisplayed: true,
  isActiveLineHighlighted: false,
  isAutoCompletionEnabled: false,
  isPatternHighlightingEnabled: true,
  isFlashEnabled: true,
  isTooltipEnabled: true,
  isLineWrappingEnabled: true,
  isTabIndentationEnabled: false,
  isMultiCursorEnabled: false,
  theme: 'strudelTheme',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
};

let engineLoading: Promise<typeof import('../strudel/engine')> | null = null;
function loadEngine() {
  if (!engineLoading) {
    try {
      localStorage.setItem('codemirror-settings', JSON.stringify(EDITOR_SETTINGS));
    } catch {}
    engineLoading = import('../strudel/engine');
  }
  return engineLoading;
}

/** Remove common leading indentation so code in MDX can be indented. */
function dedent(src: string) {
  const lines = src.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

function strudelUrl(code: string) {
  const bytes = new TextEncoder().encode(code);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `https://strudel.cc/#${encodeURIComponent(btoa(bin))}`;
}

export interface StrudelProps {
  code: string;
  title?: string;
  /** Code is driven by a widget: push prop changes into the editor and re-run if playing. */
  live?: boolean;
  /** Called with Strudel's current cycle position getter once the editor exists. */
  onClock?: (now: (() => number) | null, playing: boolean) => void;
}

export default function Strudel({ code, title, live, onClock }: StrudelProps) {
  const { t } = useLang();
  const initial = useMemo(() => dedent(code), [code]);
  const hostRef = useRef<HTMLDivElement>(null);
  const edRef = useRef<StrudelEditor | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(initial);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(initial);
  codeRef.current = initial;

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    loadEngine().then(({ createEditor }) => {
      if (cancelled || !host) return;
      edRef.current = createEditor(host, codeRef.current, (st: StrudelState) => {
        setStarted(!!st.started);
        setPending(!!st.pending);
        const err = st.error;
        setError(err ? String(typeof err === 'string' ? err : (err.message ?? err)) : null);
        if (typeof st.code === 'string') setCurrent(st.code);
      });
      setReady(true);
    });
    return () => {
      cancelled = true;
      edRef.current?.stop();
      edRef.current = null;
      if (host) host.innerHTML = '';
    };
  }, []);

  // live mode: widget changed the code
  useEffect(() => {
    const ed = edRef.current;
    if (!live || !ed || ed.code === initial) return;
    ed.setCode(initial);
    if (ed.repl.scheduler.started) ed.evaluate();
  }, [initial, live]);

  useEffect(() => {
    const ed = edRef.current;
    onClock?.(ed && started ? () => ed.repl.scheduler.now() : null, started);
  }, [started, onClock]);

  const editor = () => edRef.current;
  const play = async () => {
    const { ensureAudio } = await loadEngine();
    await ensureAudio();
    editor()?.evaluate();
  };
  const stop = () => editor()?.stop();
  const reset = () => {
    editor()?.setCode(initial);
    setCurrent(initial);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editor()?.code ?? current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const dirty = current !== initial;

  return (
    <figure className={`strudel ${started ? 'is-playing' : ''}`}>
      <div className="strudel-bar">
        <button className="btn primary" onClick={play} disabled={!ready} aria-label={started ? t.update : t.play}>
          {started ? '⟳ ' + t.update : '▶ ' + t.play}
        </button>
        <button className="btn" onClick={stop} disabled={!ready || !started}>
          ■ {t.stop}
        </button>
        {title && <span className="strudel-title">{title}</span>}
        <span className="spacer" />
        {dirty && (
          <button className="btn ghost" onClick={reset} title={t.reset}>
            ↺ {t.reset}
          </button>
        )}
        <button className="btn ghost" onClick={copy}>
          {copied ? '✓ ' + t.copied : t.copy}
        </button>
        <a className="btn ghost" href={strudelUrl(current)} target="_blank" rel="noreferrer" title={t.openStrudel}>
          ↗<span className="hide-sm"> strudel.cc</span>
        </a>
      </div>
      {/* React never renders into this div; Strudel owns it. */}
      <div className="strudel-host" ref={hostRef} />
      {!ready && <pre className="strudel-placeholder">{initial}</pre>}
      {error && <div className="strudel-error">{error}</div>}
      <figcaption className={`strudel-hint ${pending ? 'loading' : ''}`}>
        {pending ? t.loadingSounds : t.keysHint}
      </figcaption>
    </figure>
  );
}
