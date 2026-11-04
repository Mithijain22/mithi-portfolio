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
- **Game replaced.** The find-the-odd-one Wall was dropped. A fruit-merge game is being built separately from
  `fruit-merge-build-spec.md` and will be integrated later. `src/game/slot.ts` is a stand-in with a test button;
  the real game replaces it and calls the same preview card (`showPoster`) per unlock.
- **Pages removed:** no `/work` index and no `/about` page. Work is a section on the home page (`#work`);
  each project keeps a case study page at `/work/<slug>`, or links to its GitHub repo if `repo` is set in `content.ts`.
- **Work panel colours:** teal `#12B5C4`, yellow `#F5D90A`, hot pink `#EE3E9C`.
- **Fruit-merge game integrated.** Source lives in `src/fruit-merge/` (unchanged from the delivered build, minus its dev
  harness and gallery). `src/game/host.ts` mounts it in the TV screen, opens the project preview card on each unlock
  (the game waits until the card is closed), and pauses the game when the TV scrolls out of view.
- New dependencies: `matter-js 0.20.0`, `@types/matter-js 0.19.8`; `@mediapipe/tasks-vision` raised to `0.10.21`
  (matches the WASM URL in `src/fruit-merge/config.ts`). Versions were not checked against the npm registry.
