# Sarmate pet companion

Mate is a small pixel-cat study buddy. It sits in a corner of the study studio and reacts to what the learner is doing. It is client-side only: no new backend, database, API key or analytics is required, and it works identically in source mode and AI mode.

Art direction: `docs/pet-art-direction.md`. Full sprite specification: `docs/pet-sprite-spec.md`. Copy-ready art prompts: `examples/pet-prompts.md`.

## Architecture

- `lib/pet/types.ts`, `states.ts`, `dialogue.ts` — typed state names, animation keys, priorities, durations and English/Burmese messages.
- `lib/pet/controller.ts` — pure reducer, event resolution, priority rule, expiry and snapshot diffing.
- `lib/pet/sprite-assets.ts` — sprite-sheet manifest validation (including sheet dimensions), frame math, looping/one-shot playback and reduced-motion helpers.
- `lib/pet/preferences.ts`, `lib/pet/visibility.ts` — persisted hide/mute preferences and visibility subscription.
- `hooks/use-pet-controller.ts`, `use-pet-preferences.ts`, `use-study-pet-snapshot.ts`, `use-document-visible.ts` — React adapters with timers, storage sync, visibility and one memoized page snapshot.
- `components/pet/StudyPet.tsx`, `PetSprite.tsx`, `PetSpeechBubble.tsx`, `PetControls.tsx` — reusable presentation components.
- `components/companion/study-companion.tsx` — thin wrapper that keeps the existing page mount stable.

## States

| State | Animation key | Typical trigger |
| --- | --- | --- |
| `greeting` | `greet` | First render, clicking the sprite |
| `idle` | `idle` | Calm baseline, inactivity |
| `reading` | `read` | Notes tab, guide ready |
| `focused` | `idle` | Practice tab baseline / calm practice-ready state |
| `thinking` | `think` | Guide generation in progress |
| `uploading` | `upload` | File import started |
| `celebrating` | `celebrate` | Correct answer |
| `encouraging` | `encourage` | First wrong attempt |
| `hinting` | `hint` | Second wrong attempt |
| `explaining` | `explain` | Third wrong attempt |
| `searching` | `search` | Ask tab, evidence search |
| `error` | `error` | Build/import error |
| `sleeping` | `sleep` | Long inactivity |
| `hidden` | — | User hid the companion |

Persistent baselines are `hidden`, `idle`, `reading`, `focused`, `searching` and `sleeping`. Temporary reactions carry an expiry and return to the baseline from the current snapshot. Higher-priority reactions override lower-priority ones; `error`, `hide`, `show`, `reset`, `build-success`, `import-complete` and `PRACTICE_RESET` are forced transitions.

## Sprite manifest format

The default runtime loads `public/pets/sarmate-cat/animation-manifest.json` (schema `sarmate-pet-sprites/1`) and the final Mate artwork in `animation-sheet.png`. The older 12×12 single-frame `manifest.json` remains only as a legacy sample.

```json
{
  "schema": "sarmate-pet-sprites/1",
  "id": "sarmate-cat",
  "displayName": "Mate",
  "sheet": "/pets/sarmate-cat/animation-sheet.png",
  "frameWidth": 32,
  "frameHeight": 32,
  "scale": 2,
  "columns": 74,
  "rows": 1,
  "animations": {
    "greet": { "frames": 6, "fps": 6, "loop": false, "startFrame": 0, "row": 0, "durationMs": 2200 }
  }
}
```

Each animation entry needs `frames`, `fps`, `loop`, `startFrame` and optional `row`/`durationMs`. `fps` sets per-frame duration; `durationMs` overrides the whole clip. The loader checks schema, frame bounds and the sheet's real pixel dimensions. The renderer uses CSS `background-position` with `steps()` and derives `background-size` from `frameWidth × scale` and `columns`; no image is stretched. Full constraints are in `docs/pet-sprite-spec.md`.

## Animation lifecycle

- Continuous activities loop: `idle` (including the `focused` practice baseline), `read`, `think`, `search` and `sleep`.
- Temporary reactions play once and hold the last frame: `greet`, `upload`, `celebrate`, `encourage`, `hint`, `explain` and `error`. Their `durationMs` values mirror the controller's temporary-state durations.
- The controller returns to the snapshot baseline when a temporary reaction expires; priority rules prevent low-priority reactions from interrupting important ones.
- The sprite element is keyed by animation, so React re-renders do not restart a running clip; only a real animation change remounts it.
- When the pet is hidden it is not rendered at all. When the browser tab is hidden, `useDocumentVisible()` adds `pet-sheet-paused` to stop CSS animation work; listeners are removed on unmount.
- `prefers-reduced-motion` and paused state render a single static frame. If the sheet is invalid, the SVG fallback is used.

## Final artwork and regeneration

The runtime now uses the final Mate artwork: a 32×32 logical, 74-frame transparent PNG generated deterministically by `scripts/build-pet-art.py` with Pillow. No image model, API key or paid service was used. The canonical reference is `docs/mate-reference.png`; the labelled `contact-sheet.png` documents every frame.

1. To regenerate, run `python scripts/build-pet-art.py`; to validate only, run `python scripts/build-pet-art.py --check`.
2. Keep the palette and identity lock in `docs/pet-art-direction.md`. The generator enforces margins, transparency, palette, duplicate-frame and dimension checks.
3. The generator writes `animation-sheet.png`, `animation-manifest.json`, `contact-sheet.png` and `mate-reference.png` together, so the manifest stays in sync.
4. `npm test` also checks manifest structure, PNG header dimensions, frame math, loader failure, fallback frames and playback decisions. If the sheet fails validation in the browser, `PetSprite` falls back to the built-in SVG frames in `public/companion/manifest.json`.
5. `public/pets/sarmate-cat/preview.html` shows all 12 animations at actual and 4× size, with loop/one-shot playback and light/dark backgrounds.

## Accessibility

- Hide/show and mute controls are labeled buttons using `aria-label`, `aria-pressed`, `aria-controls` and `aria-expanded`; global focus-visible styling applies.
- Preferences persist in `localStorage` under `sarmate-pet-preferences` and sync across tabs.
- The speech bubble is one `aria-live="polite"`/`aria-atomic="true"` region, visible only for temporary reactions. Muting removes it; idle and sleep states do not announce.
- `prefers-reduced-motion` disables CSS animation and renders a single static sprite frame.
- The pet is mounted after `<main>` so keyboard focus reaches study controls first.
- On small screens the card shrinks, respects safe-area insets and ignores pointer events except on its controls/sprite button.

## Developer note: event wiring

`app/page.tsx` does not call pet methods. It passes existing study state to `useStudyPetSnapshot()`, which memoizes one `CompanionSnapshot`. `StudyCompanion` forwards it to `StudyPet`; `usePetController` diffs it with `eventsFromSnapshot()` and dispatches batched events to the pure reducer.

Practice is explicit: `applyAttempt()` updates `PracticeState.last`, the snapshot carries it, and `practiceEvent()` emits `PRACTICE_CORRECT`, `PRACTICE_WRONG_FIRST/SECOND/THIRD` or `PRACTICE_RESET`. Those map to celebration, encouragement, hinting, explanation and the practice-ready baseline. Lesson build, upload and tab changes flow through the same snapshot path, so study behavior is unchanged.

## Tests

`npm test` runs 56 tests. Companion coverage includes `tests/pet-controller.test.ts` (greeting, loading, error, priority, baseline expiry), `tests/practice-attempts.test.ts` (three attempts, hints, explanations, success, reset, normalization), `tests/pet-sprite.test.ts` (manifest and dimension validation, frame coordinates, one-shot/loop/paused/reduced-motion decisions, visibility listener cleanup, fallback parity), `tests/pet-domain.test.ts` (domain reducer and snapshot events), `tests/pet-assets.test.ts` (asset key mapping and frame math) and `tests/pet-preferences.test.ts` (persisted hide/mute settings). `npm run typecheck`, `npm run lint` and `npm run build` also run clean.
