import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LANGS, saveLang, useLang, type Lang } from '../i18n/LangContext';
import { lessonNumber, lessons, PARTS } from '../lessons';
import { rememberScroll } from '../scrollAnchor';


export default function Layout({ children }: { children: ReactNode }) {
  const { lang, t } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.siteTitle;
    saveLang(lang);
  }, [lang, t]);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  // phones: the page behind the open menu should not scroll; Escape closes the menu
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchTo = (l: Lang) => {
    if (l === lang) return;
    rememberScroll();
    nav(loc.pathname.replace(/^\/(en|pl)/, `/${l}`));
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="menu-btn" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>
        <Link to={`/${lang}`} className="brand">
          <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden>
            <path d="M1 10 Q5 0 9 10 T17 10 T25 10 T31 10" stroke="var(--accent)" strokeWidth="2.5" fill="none" />
          </svg>
          <span>{t.siteTitle}</span>
        </Link>
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => switchTo(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <div className="shell">
        <nav className={`sidebar ${open ? 'open' : ''}`}>
          <NavLink to={`/${lang}`} end className="side-home">
            {t.home}
          </NavLink>
          {PARTS.map((p) => (
            <div key={p} className={`side-part part-${p}`}>
              <div className="side-part-title">{t[`part_${p}`]}</div>
              {lessons
                .filter((l) => l.part === p)
                .map((l) => (
                  <NavLink key={l.slug} to={`/${lang}/${l.slug}`}>
                    <span className="num">{lessonNumber(l.slug) ?? '•'}</span>
                    {l.title[lang]}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        {open && <div className="scrim" onClick={() => setOpen(false)} />}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
