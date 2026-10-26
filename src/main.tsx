import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// No StrictMode: it mounts effects twice, which would create two Strudel editors per block.
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
