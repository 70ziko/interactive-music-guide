import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { lessonNumber, lessons } from '../lessons';

export default function Home() {
  const { lang, t } = useLang();
  return (
    <article className="home">
      <section className="hero">
        <h1>{t.siteTitle}</h1>
        <p className="lede">{t.siteTagline}</p>
        <Link className="btn primary big" to={`/${lang}/${lessons[0].slug}`}>
          {t.start} →
        </Link>
        <p className="note">{t.audioNote}</p>
      </section>

      <section>
        <h2>{t.mapTitle}</h2>
        <ol className="build-map">
          {t.mapSteps.map(([name, desc], i) => (
            <li key={name} style={{ ['--i' as string]: i }}>
              <strong>{name}</strong>
              <span>{desc}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t.howTitle}</h2>
        <ol className="how">
          {t.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t.lessons}</h2>
        <div className="cards">
          {lessons.map((l) => (
            <Link key={l.slug} to={`/${lang}/${l.slug}`} className={`card part-${l.part}`}>
              <span className="card-part">
                {lessonNumber(l.slug) ? `${lessonNumber(l.slug)} · ` : ''}{t[`part_${l.part}`]}
              </span>
              <strong>{l.title[lang]}</strong>
              <span>{l.blurb[lang]}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
