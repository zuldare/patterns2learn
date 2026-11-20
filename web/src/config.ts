export const DONATE_URL = 'https://paypal.me/binauraljames';
/** Donate links are only rendered once DONATE_URL holds a real address. */
export const DONATE_ENABLED = !DONATE_URL.includes('REPLACE_ME');
/** Canonical origin; also `site` in astro.config.mjs. */
export const SITE_URL = 'https://patterns2learn.vercel.app';
export const REPO_URL = 'https://github.com/zuldare/patterns2learn';
/** Author profiles linked from the site footer. */
export const AUTHOR_NAME = 'Jaime Hernández';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/jaimehernandezortiz';
export const GITHUB_URL = 'https://github.com/zuldare';

/** GitHub folder of a lesson's runnable Spring Boot example (spec §3, item 5). */
export function exampleUrl(category: string, slug: string): string {
  return `${REPO_URL}/tree/main/examples/${category}/${slug}`;
}
