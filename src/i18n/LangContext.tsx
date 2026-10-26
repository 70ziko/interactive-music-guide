import { createContext, useContext } from 'react';
import { en, type Dict } from './en';
import { pl } from './pl';

export type Lang = 'en' | 'pl';
export const LANGS: Lang[] = ['en', 'pl'];
export const dicts: Record<Lang, Dict> = { en, pl };

const STORAGE_KEY = 'img-lang';

export function savedLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'pl') return v;
  } catch {}
  return navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

export const LangContext = createContext<{ lang: Lang; t: Dict }>({ lang: 'en', t: en });

export const useLang = () => useContext(LangContext);
