import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { audio } from '../audio/tone';
import { Controls, fmtHz, PlayButton, Seg, useFrame, useSustained, Widget } from './ui';

interface Interval {
  id: string;
  en: string;
  pl: string;
  p: number;
  q: number;
  semis: number;
}

const INTERVALS: Interval[] = [
  { id: 'oct', en: 'Octave', pl: 'Oktawa', p: 2, q: 1, semis: 12 },
  { id: 'p5', en: 'Fifth', pl: 'Kwinta', p: 3, q: 2, semis: 7 },
  { id: 'p4', en: 'Fourth', pl: 'Kwarta', p: 4, q: 3, semis: 5 },
  { id: 'M3', en: 'Major 3rd', pl: 'Tercja wielka', p: 5, q: 4, semis: 4 },
  { id: 'm3', en: 'Minor 3rd', pl: 'Tercja mała', p: 6, q: 5, semis: 3 },
  { id: 'tt', en: 'Tritone', pl: 'Tryton', p: 45, q: 32, semis: 6 },
];

const BASE = 220; // A3
const S = 220;

/** Lissajous figure: a pure ratio draws a still shape; equal temperament makes it slowly turn. */
export default function IntervalLab({ initial = 'p5' }) {
  const { t, lang } = useLang();
  const [id, setId] = useState(initial);
  const [tuning, setTuning] = useState<'just' | 'equal'>('just');
  const [now, setNow] = useState(0);
  const oscs = useRef<OscillatorNode[] | null>(null);

  const iv = INTERVALS.find((i) => i.id === id)!;
  const justRatio = iv.p / iv.q;
  const etRatio = Math.pow(2, iv.semis / 12);
  const ratio = tuning === 'just' ? justRatio : etRatio;
  const f2 = BASE * ratio;
  const cents = 1200 * Math.log2(etRatio / justRatio);
  const beat = Math.abs(iv.q * BASE * etRatio - iv.p * BASE);

  const start = useCallback(() => {
    const { ctx, out } = audio();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.frequency.value = 2500;
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.18, ctx.currentTime, 0.03);
    g.connect(lp).connect(out);
    const os = [BASE, f2].map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(g);
      o.start();
      return o;
    });
    oscs.current = os;
    return () => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      os.forEach((o) => o.stop(ctx.currentTime + 0.15));
      oscs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { on, toggle } = useSustained(start);

  useEffect(() => {
    if (oscs.current) oscs.current[1].frequency.setTargetAtTime(f2, audio().ctx.currentTime, 0.01);
  }, [f2, on]);

  useFrame(true, (ms) => setNow(ms / 1000));

  // Lissajous: x = sin(2π·f1·t), y = sin(2π·f2·t). Drawn shape uses p:q; drift = real detuning.
  const drift = 2 * Math.PI * (f2 - (BASE * iv.p) / iv.q) * now * 0.25; // slowed ×4 so it is visible
  const pts: string[] = [];
  const steps = 900;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * 2 * Math.PI * Math.min(iv.q, 8);
    const x = Math.sin(th);
    const y = Math.sin((th * iv.p) / iv.q + drift);
    pts.push(`${(S / 2 + x * (S / 2 - 10)).toFixed(1)},${(S / 2 - y * (S / 2 - 10)).toFixed(1)}`);
  }

  const name = lang === 'pl' ? iv.pl : iv.en;
  return (
    <Widget
      title={lang === 'pl' ? 'Laboratorium interwałów' : 'Interval lab'}
      caption={
        lang === 'pl'
          ? 'Figura Lissajous: oś X = dolny ton, oś Y = górny. Czysty stosunek rysuje nieruchomy kształt. Strój równomierny lekko rozstraja i figura powoli się obraca (tu spowolnione 4×).'
          : 'Lissajous figure: X = lower tone, Y = upper tone. A pure ratio draws a still shape. Equal temperament is slightly off, so the shape slowly turns (slowed 4× here).'
      }
    >
      <div className="interval-lab">
        <svg viewBox={`0 0 ${S} ${S}`} className="lissajous" role="img" aria-label={`${name} Lissajous`}>
          <rect x={0} y={0} width={S} height={S} rx={10} className="bg" />
          <polyline points={pts.join(' ')} className="trace" />
        </svg>
        <table className="mini-table">
          <tbody>
            <tr>
              <th>{t.w_just}</th>
              <td>
                {iv.p}/{iv.q} = {justRatio.toFixed(4)}
              </td>
            </tr>
            <tr>
              <th>{t.w_equal}</th>
              <td>
                2^({iv.semis}/12) = {etRatio.toFixed(4)}
              </td>
            </tr>
            <tr>
              <th>{lang === 'pl' ? 'Różnica' : 'Difference'}</th>
              <td>{cents >= 0 ? '+' : ''}{cents.toFixed(1)} cents</td>
            </tr>
            <tr>
              <th>{lang === 'pl' ? 'Częstotliwości' : 'Frequencies'}</th>
              <td>
                {fmtHz(BASE)} + {fmtHz(f2)}
              </td>
            </tr>
            <tr>
              <th>{lang === 'pl' ? 'Dudnienie (ET)' : 'Beating (ET)'}</th>
              <td>
                {beat.toFixed(2)} {t.w_beats}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Controls>
        <PlayButton on={on} onClick={toggle} labels={[t.w_play, t.w_stop]} />
        <Seg options={INTERVALS.map((i) => ({ value: i.id, label: lang === 'pl' ? i.pl : i.en }))} value={id} onChange={setId} />
        <Seg
          options={[
            { value: 'just', label: t.w_just },
            { value: 'equal', label: lang === 'pl' ? 'Równomierny (ET)' : 'Equal (ET)' },
          ]}
          value={tuning}
          onChange={setTuning}
        />
      </Controls>
    </Widget>
  );
}
