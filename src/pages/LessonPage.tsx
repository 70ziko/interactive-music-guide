import { Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { useLang } from '../i18n/LangContext';
import { lessonComponent, lessonIndex, lessons } from '../lessons';
import { mdxComponents } from '../components/mdxComponents';
import { restoreScroll } from '../scrollAnchor';

/** Rendered after the lesson body in the same Suspense boundary, so its effect runs once the body is in the DOM. */
function RestoreScroll() {
  useEffect(() => {
    restoreScroll();
  }, []);
  return null;
}

export default function LessonPage() {
  const { slug = '' } = useParams();
  const { lang, t } = useLang();
  const idx = lessonIndex(slug);
  const Body = lessonComponent(lang, slug);

  // New lesson → top of page. A language switch keeps the slug, so RestoreScroll keeps the place instead.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (idx < 0 || !Body) return <p>{t.notFound}</p>;
  const meta = lessons[idx];
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];

  return (
    <article className={`lesson part-${meta.part}`}>
      <div className="eyebrow">
        {t.lesson} {meta.slug.slice(0, 2)} · {t[`part_${meta.part}`]}
      </div>
      <h1>{meta.title[lang]}</h1>
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="muted">{t.loading}</p>}>
          {/* key forces a fresh mount (and fresh Strudel editors) per lesson + language */}
          <Body key={`${lang}-${slug}`} />
          <RestoreScroll key={`r-${lang}-${slug}`} />
        </Suspense>
      </MDXProvider>
      <nav className="pager">
        {prev ? (
          <Link to={`/${lang}/${prev.slug}`} className="pager-link">
            <small>← {t.prev}</small>
            {prev.title[lang]}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/${lang}/${next.slug}`} className="pager-link right">
            <small>{t.next} →</small>
            {next.title[lang]}
          </Link>
        )}
      </nav>
    </article>
  );
}
