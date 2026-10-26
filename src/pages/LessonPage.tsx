import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { useLang } from '../i18n/LangContext';
import { lessonIndex, lessonLoader, lessons } from '../lessons';
import { mdxComponents } from '../components/mdxComponents';

export default function LessonPage() {
  const { slug = '' } = useParams();
  const { lang, t } = useLang();
  const idx = lessonIndex(slug);
  const loader = lessonLoader(lang, slug);
  const Body = useMemo(() => (loader ? lazy(loader) : null), [loader]);

  useEffect(() => window.scrollTo(0, 0), [slug, lang]);

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
