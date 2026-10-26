import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { claim, release } from '../audio/tone';

export function Widget({ title, children, caption }: { title: string; children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="widget">
      <div className="widget-title">{title}</div>
      {children}
      {caption && <figcaption className="widget-caption">{caption}</figcaption>}
    </figure>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** logarithmic slider (for frequencies) */
  log?: boolean;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step, log, format, onChange }: SliderProps) {
  const toPos = (v: number) => (log ? (Math.log(v / min) / Math.log(max / min)) * 1000 : v);
  const fromPos = (p: number) => (log ? min * Math.pow(max / min, p / 1000) : p);
  return (
    <label className="slider">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min={log ? 0 : min}
        max={log ? 1000 : max}
        step={log ? 1 : (step ?? 'any')}
        value={toPos(value)}
        onChange={(e) => onChange(fromPos(Number(e.target.value)))}
      />
      <output>{format ? format(value) : value}</output>
    </label>
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {label && <span className="seg-label">{label}</span>}
      {options.map((o) => (
        <button key={String(o.value)} className={o.value === value ? 'on' : ''} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="controls">{children}</div>;
}

/**
 * Manage a sustained sound. `start` builds the audio graph and returns a stop function.
 * Only one widget sound plays at a time across the page.
 */
export function useSustained(start: () => () => void) {
  const [on, setOn] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (stopRef.current) {
      const s = stopRef.current;
      stopRef.current = null;
      s();
    }
    setOn(false);
  }, []);

  const begin = useCallback(() => {
    const s = start();
    const wrapped = () => {
      s();
      release(wrapped);
      stopRef.current = null;
      setOn(false);
    };
    claim(wrapped);
    stopRef.current = wrapped;
    setOn(true);
  }, [start]);

  useEffect(() => stop, [stop]);

  return { on, toggle: () => (on ? stop() : begin()), stop };
}

export function PlayButton({ on, onClick, labels }: { on: boolean; onClick: () => void; labels: [string, string] }) {
  return (
    <button className={`btn ${on ? '' : 'primary'} play-btn`} onClick={onClick}>
      {on ? '■ ' + labels[1] : '▶ ' + labels[0]}
    </button>
  );
}

/** requestAnimationFrame loop while `active`. */
export function useFrame(active: boolean, cb: (t: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = (t: number) => {
      cbRef.current(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

export const fmtHz = (f: number) => (f >= 1000 ? (f / 1000).toFixed(2) + ' kHz' : f >= 100 ? f.toFixed(0) + ' Hz' : f.toFixed(1) + ' Hz');

/** Build an SVG polyline "points" string from a function y(x) with x in [0,1]. */
export function plot(fn: (x: number) => number, w: number, h: number, n = 400, pad = 6) {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const y = fn(x);
    pts.push(`${(x * w).toFixed(1)},${(h / 2 - y * (h / 2 - pad)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** true on phone-width screens; updates on resize / rotation. */
export function useNarrow(maxWidth = 600) {
  const query = `(max-width: ${maxWidth}px)`;
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}
