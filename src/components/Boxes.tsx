import type { ReactNode } from 'react';
import { useLang } from '../i18n/LangContext';

export function DoDont({ do: dos, dont }: { do: string[]; dont: string[] }) {
  const { t } = useLang();
  return (
    <div className="dodont">
      <div className="do">
        <h4>✓ {t.do}</h4>
        <ul>{dos.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      <div className="dont">
        <h4>✕ {t.dont}</h4>
        <ul>{dont.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
    </div>
  );
}

export function TryThis({ children }: { children: ReactNode }) {
  const { t } = useLang();
  return (
    <aside className="box try">
      <h4>▶ {t.tryThis}</h4>
      {children}
    </aside>
  );
}

export function Callout({ kind = 'tip', children }: { kind?: 'math' | 'tip' | 'warn'; children: ReactNode }) {
  const { t } = useLang();
  const icon = { math: '∑', tip: '★', warn: '!' }[kind];
  return (
    <aside className={`box ${kind}`}>
      <h4>
        {icon} {t[kind]}
      </h4>
      {children}
    </aside>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return <div className="formula">{children}</div>;
}

/** A left-to-right signal chain: [{name, desc, code}] */
export function Chain({ steps }: { steps: { name: string; desc: string; code?: string }[] }) {
  return (
    <ol className="chain">
      {steps.map((s) => (
        <li key={s.name}>
          <strong>{s.name}</strong>
          <span>{s.desc}</span>
          {s.code && <code>{s.code}</code>}
        </li>
      ))}
    </ol>
  );
}
