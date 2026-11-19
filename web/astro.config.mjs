import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config.ts';
import { locales } from './src/i18n/index.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') })],
  i18n: {
    locales: [...locales],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  vite: { server: { fs: { allow: ['..'] } } },
});
