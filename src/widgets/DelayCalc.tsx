import { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { Slider, Widget } from './ui';

// [label, length in bars (= Strudel cycles when setcpm(BPM/4))]
const VALUES: [string, number][] = [
  ['1 bar', 1],
  ['1/2', 1 / 2],
  ['3/8 (dotted 1/4)', 3 / 8],
  ['1/4 (beat)', 1 / 4],
  ['3/16 (dotted 1/8)', 3 / 16],
  ['1/8', 1 / 8],
  ['1/12 (1/8 triplet)', 1 / 12],
  ['1/16', 1 / 16],
];

const PL: Record<string, string> = {
  '1 bar': '1 takt',
  '3/8 (dotted 1/4)': '3/8 (ćwierćnuta z kropką)',
  '1/4 (beat)': '1/4 (uderzenie)',
  '3/16 (dotted 1/8)': '3/16 (ósemka z kropką)',
  '1/12 (1/8 triplet)': '1/12 (triola ósemkowa)',
};

const frac = (x: number) => {
  const known: [number, string][] = [[1, '1'], [1 / 2, '1/2'], [3 / 8, '3/8'], [1 / 4, '1/4'], [3 / 16, '3/16'], [1 / 8, '1/8'], [1 / 12, '1/12'], [1 / 16, '1/16']];
  return known.find(([v]) => Math.abs(v - x) < 1e-9)?.[1] ?? x.toFixed(3);
};

/** Tempo → note lengths in ms, Hz and Strudel values. Strudel's delay line holds at most 1 s. */
export default function DelayCalc() {
  const { lang } = useLang();
  const L = lang === 'pl';
  const [bpm, setBpm] = useState(128);
  const barMs = (4 * 60000) / bpm;

  return (
    <Widget
      title={L ? 'Kalkulator tempa: długości nut w ms' : 'Tempo calculator: note lengths in ms'}
      caption={
        L
          ? `1 uderzenie = 60 000 / BPM ms = ${(60000 / bpm).toFixed(1)} ms. Linia opóźnienia w Strudlu mieści maksymalnie 1 s — dłuższe wartości są oznaczone ⚠.`
          : `1 beat = 60,000 / BPM ms = ${(60000 / bpm).toFixed(1)} ms. Strudel's delay line holds at most 1 s — longer values are marked ⚠.`
      }
    >
      <Slider label="BPM" value={bpm} min={90} max={170} step={1} onChange={setBpm} format={(v) => String(Math.round(v))} />
      <table className="mini-table calc">
        <thead>
          <tr>
            <th>{L ? 'Wartość' : 'Value'}</th>
            <th>ms</th>
            <th>Hz</th>
            <th>{L ? 'Delay w Strudlu' : 'Strudel delay'}</th>
            <th>LFO</th>
          </tr>
        </thead>
        <tbody>
          {VALUES.map(([label, bars]) => {
            const ms = barMs * bars;
            return (
              <tr key={label}>
                <th>{L ? (PL[label] ?? label) : label}</th>
                <td>
                  {ms.toFixed(1)} {ms > 1000 && '⚠'}
                </td>
                <td>{(1000 / ms).toFixed(2)}</td>
                <td>
                  <code>.delaysync({frac(bars)})</code>
                </td>
                <td>
                  <code>{bars >= 1 ? `sine.slow(${bars})` : `sine.fast(${+(1 / bars).toFixed(2)})`}</code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Widget>
  );
}
