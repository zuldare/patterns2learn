import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://patterns2learn.vercel.app',
  trailingSlash: 'always',
  integrations: [sitemap()],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  vite: { server: { fs: { allow: ['..'] } } },
});
