import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';

// MDX must run before the React plugin so JSX inside lessons is handled.
export default defineConfig({
  base: './',
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react', remarkPlugins: [remarkGfm] }) },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
  build: { chunkSizeWarningLimit: 4000 },
});
