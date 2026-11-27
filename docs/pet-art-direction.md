# Mate — final art direction

Mate is Sarmate's original pixel-cat study companion. The canonical reference is `docs/mate-reference.png`, generated from the same deterministic drawing code as the runtime frames by `scripts/build-pet-art.py`.

## Character

- Compact 32×32 pixel tabby with warm orange fur, cream muzzle/belly, teal eyes and a small teal scarf.
- Friendly, intelligent and supportive; expressive but not childish or emoji-like.
- Distinctive rounded ears, forehead tabby stripes, a curled tail and readable paws.
- The scarf is the subtle educational identity cue. No book, magnifier or document appears outside the animation that needs it.
- Designed to read at the actual 64×64 app display size and to hold up under 4× pixel inspection.

## Palette

| Role | Hex |
| --- | --- |
| Outline | `#4A2E22` |
| Fur | `#E8A44D` |
| Fur shadow / stripes | `#B86A32` |
| Cream muzzle/belly | `#FFF1D6` |
| Eye | `#2F5D50` |
| Eye highlight | `#FFFFFF` |
| Blush | `#E88E7A` |
| Scarf | `#3E6B63` |
| Idea / celebration spark | `#F2C14E` |

No gradients, anti-aliasing, blur or extra colors are used. The dark outline and cream highlights keep the character readable on both light and dark backgrounds.

## Animation design

Each state uses four to eight genuinely different poses, changing eyes, mouth, paws, tail, head offset and the occasional prop rather than translating one image.

- `greet`: paw lowers, raises, waves and returns.
- `idle`: breathing, blink, tail sway and glance.
- `read`: small book, eye movement across the page, page shift and blink.
- `think`: head tilt, chin paw, moving idea sparkle.
- `upload`: document inspection with focused eyes and a final smile.
- `celebrate`: crouch, jump, mid-air spark, landing and settle.
- `encourage`: soft nod and supportive extended paw.
- `hint`: raised paw with a subtle idea indicator.
- `explain`: book and pointing teaching gesture.
- `search`: magnifier, scanning eyes and lean.
- `error`: brief confusion, then calm recovery.
- `sleep`: closed eyes, curled breathing and a quiet sparkle.

## Generation provenance

Artwork is generated locally with Python 3 and Pillow via `scripts/build-pet-art.py`. The script draws each frame from deterministic primitives, validates the atlas (dimensions, palette, transparency, margins, duplicate frames), then writes the PNG, manifest, contact sheet and canonical reference. No image model, API key, paid service or third-party character is used.

Run `python scripts/build-pet-art.py` to regenerate, or `python scripts/build-pet-art.py --check` to validate the committed assets.

Related: `docs/pet-sprite-spec.md`, `docs/PET-COMPANION.md`, `public/pets/sarmate-cat/preview.html`.
