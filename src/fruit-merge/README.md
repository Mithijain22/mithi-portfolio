# Fruit Merge

A pop-art fruit-merge game with webcam hand control, built as an **embeddable module**. Merge fruits up the ladder
(lemon, blueberry, orange, apple, watermelon). The first orange, apple and watermelon each unlock a project: the game
bursts, tells the host page to show the project, waits, then continues. Point a finger to aim, pinch to drop.
Mouse, keyboard and touch play the same game.

## Run it

```bash
npm install
npm run dev      # dev harness at http://localhost:5173 (gallery at /gallery.html)
npm run build    # type-check + production build into dist/
```

`?fakehand=1` runs the whole hand-control pipeline with a simulated hand, so you can test without a camera.

## Embed it

```ts
import { createGame, type GameHost } from './src/game';

const host: GameHost = {
  // Called when a project unlocks (0, 1 or 2). The game freezes until the returned promise resolves.
  onUnlock: (index) => showProjectPreview(index),        // return a Promise (or nothing: the game waits 300 ms)
  // Called once, after the third unlock sequence has finished.
  onComplete: () => console.log('all three unlocked'),
  // Optional: progress and camera state changes.
  onProgress: ({ unlocked, camera }) => {},               // camera: 'off' | 'on' | 'denied' | 'error'
};

const game = createGame(document.getElementById('tv-screen')!, host, { camera: 'ask' });
game.start();   // call after your own start button
```

### `GameOptions`
| option | meaning |
|---|---|
| `camera: 'ask' \| 'off'` | `'ask'` (default) shows the camera card inside the game on desktop; `'off'` never asks. |
| `fakeHand: boolean` | Simulated hand for testing (same as `?fakehand=1`). |

### `GameHandle`
`start()`, `pause()` (stops physics, rendering and camera tracks), `resume()`, `restart()` (clears the container,
resets progress, replays the scripted opening), `destroy()` (removes listeners, DOM, loops, camera tracks),
`enableCamera(): Promise<boolean>`, `setCameraBackground(on)`.

### Rules the game follows so it can live inside a page
- It fills `root` and scales a 1600 x 800 canvas to fit (letterboxed, transparent outside). It watches `root` with a `ResizeObserver`.
- Every CSS class is prefixed `fm-`. No styles on `html`/`body`, no `position: fixed`, no `100vw/100vh`.
- It never scrolls the page. `touch-action: pan-y` keeps vertical swipes scrolling the page while horizontal drags aim.
- Keyboard input only works while `root` has focus or the pointer is over it (`root` gets `tabindex="0"`).
- The host owns project content and navigation. The game owns the camera card, the camera layer and the hand UI.
- No backend, no analytics, no storage. Webcam frames are never recorded, stored or uploaded.

### Fonts
The module declares font stacks with fallbacks for **Anton** (display), **DM Mono** (labels) and **DM Sans** (body)
but does not load them. The host page must load them (see the `<link>` in `index.html`).

## Controls
- **Camera:** point your index finger to aim, pinch thumb and index finger to drop. The drop uses the aim from ~150 ms before the pinch started.
- **Mouse:** move to aim, click to drop. **Touch:** drag to aim, release to drop. **Keyboard:** arrows or A/D, Space or Enter.
- While the camera is on and a hand is in view, mouse and keyboard are ignored; after 5 s without a hand they work again.
- On phones/tablets (narrow screens or coarse pointers) the camera is never requested.

## Tuning
Every number lives in `src/config.ts`: layout (`LAYOUTS`, `ACTIVE_LAYOUT`: `top`, `rails`, `max`), fruit sizes
(`fruitScale`), physics, assist magnet (`ASSIST_FRACTION`, set 0 to disable), reveal timing, overflow, camera thresholds
(`CAMERA.pinchOn/pinchOff/smoothingAlpha`), polish effects (`JUICE`) and all text (`TEXT`).

## Fruit art
The five fruit pictures are `src/assets/fruits/fruit1.webp` ... `fruit5.webp` (transparent cut-outs, 512 px).
`FRUIT_ART` in `config.ts` stores, for each picture, its size and the center/radius of the largest circle inside the fruit;
the game scales each picture so that circle matches the physics body. To replace a picture, keep the file name and
update its `FRUIT_ART` row. If the images fail to load, a built-in vector version of the fruits is drawn instead.

## Sound
`src/audio.ts` has empty hooks (`audio.play('drop' | 'merge' | 'unlock' | 'burst' | 'overflow')`). No audio files are included.

## Tests that were run
See `BUILD_LOG.md` for what was verified and what still needs a real device (real webcam + MediaPipe model, Lighthouse, real touch scrolling).
