import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aevum.fr',
  output: 'hybrid',
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  redirects: {
    '/demo': '/comment-ca-marche',
    '/download': '/',
  },
});
