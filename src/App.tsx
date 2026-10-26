import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LangContext, dicts, savedLang, type Lang } from './i18n/LangContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import LessonPage from './pages/LessonPage';

function LangRoot({ page }: { page: 'home' | 'lesson' }) {
  const { lang } = useParams();
  if (lang !== 'en' && lang !== 'pl') return <Navigate to={`/${savedLang()}`} replace />;
  const l = lang as Lang;
  return (
    <LangContext.Provider value={{ lang: l, t: dicts[l] }}>
      <Layout>{page === 'home' ? <Home /> : <LessonPage />}</Layout>
    </LangContext.Provider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/:lang" element={<LangRoot page="home" />} />
      <Route path="/:lang/:slug" element={<LangRoot page="lesson" />} />
      <Route path="*" element={<Navigate to={`/${savedLang()}`} replace />} />
    </Routes>
  );
}
