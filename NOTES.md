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
- **Clean URLs:** Vite dev returned 404 for /work without a trailing slash, so vite.config.ts has a small `cleanUrls` plugin (dev + preview) that maps /work to /work/index.html.
- **Lips art** (later phase): original lips sticker, not a copy of any existing logo.
