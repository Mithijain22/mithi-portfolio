# NOTES

Decisions and deviations from the spec.

- **No deployment for now.** The spec's Vercel section is dropped. No `vercel.json`.
  `SITE_URL` in `src/content.ts` is empty, so canonical URLs, `og:url` and `sitemap.xml`
  are skipped until a domain exists. `robots.txt` is still generated.
- **Phase order changed:** portfolio pages (old Phase 8) now come right after setup;
  webcam-letters phase cut; hand tracking is a late optional phase; real case studies last.
- **Grain** is pure CSS (`.grain` element) instead of `fx/grain.ts`, and is shifted with
  `transform` on an oversized layer rather than animating `background-position` (cheaper).
- **tsx** and **@types/node** added as dev dependencies (needed to run `build-pages.ts`
  and type-check it).
- **Clean URLs:** links use `/work` and `/about` without a trailing slash. Vite dev and
  preview run with `appType: 'mpa'` and should resolve them; verify on first run.
  A static host without clean-URL support would need trailing slashes.
- **Lips art** (later phase): original lips sticker, not a copy of any existing logo.
