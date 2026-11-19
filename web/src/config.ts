export const DONATE_URL = 'https://buymeacoffee.com/REPLACE_ME';
/** Donate links are only rendered once DONATE_URL holds a real address. */
export const DONATE_ENABLED = !DONATE_URL.includes('REPLACE_ME');
/** Canonical origin; also `site` in astro.config.mjs. */
export const SITE_URL = 'https://patterns2learn.vercel.app';
export const REPO_URL = 'https://github.com/zuldare/patterns2learn';

/** GitHub folder of a lesson's runnable Spring Boot example (spec §3, item 5). */
export function exampleUrl(category: string, slug: string): string {
  return `${REPO_URL}/tree/main/examples/${category}/${slug}`;
}
