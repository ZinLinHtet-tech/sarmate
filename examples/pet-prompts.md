# Pixel-cat sprite prompt pack (historical concept)

This pack documents the earlier green "Pip" concept. The shipped companion is **Mate**, generated deterministically by `scripts/build-pet-art.py`; see `docs/pet-art-direction.md` and `docs/pet-sprite-spec.md`. This file is retained only as design history, not as the final asset source.

Use this pack with an image model or an artist. Every prompt assumes the **master style lock** below is prepended. The final section is a single copy-ready pack.

Related documents: `docs/pet-art-direction.md` (design brief), `docs/pet-sprite-spec.md` (technical contract).

## Master style lock

```text
MASTER STYLE LOCK — Pixel-art cat named Pip for a calm education app. Work on a 12×12 logical pixel grid with hard square pixels and a 1 px dark outline. Transparent background. No anti-aliasing, no gradients, no blur, no dithering noise, no soft shadows, no text, no watermark. Use exactly six colors plus full transparency: outline #182C29, body #23664F, accent lime #DCEC9C, paper white #F7F9F7, blush #F2B8A2, tiny spark #E6C15A. The same cat in every frame: rounded ears with both tips fully inside the canvas, a visible tail that is never cropped, lime eyes with one dark pupil each, a tiny lime scarf at the neck, identical body proportions and the same baseline. Friendly, smart, warm, cute but not childish. Readable at 36×36 CSS px and still clear at 24×24. No extra objects unless the state prompt explicitly names them. No other accessory, no glasses, no hat, no costume, no second character, no background scenery.
```

## Global negative prompt

```text
NEGATIVE — photorealism, 3D render, smooth vector shapes, anti-aliased or fuzzy edges, gradients, alpha shading, blur, motion blur, drop shadows, dithering noise, extra limbs, extra tail, second cat, cropped ears, cropped tail, off-grid pixels, colors outside the six-color palette, glasses, hats, crowns, costumes, busy background, text, logo, watermark, multiple frames in one cell.
```

## Per-animation prompts

Append each state line to the master style lock and global negative prompt.

### greet — frame 00

```text
STATE greet — One front paw lifted in a small friendly wave. Open smile using a paper-white 2 px shape. Eyes bright lime with dark pupils. Tail relaxed with a gentle curl. Scarf visible. No props.
```

### idle — frame 01

```text
STATE idle — Relaxed sitting pose, calm level eyes, tiny flat mouth, tail curled to one side. Body centered, quiet and attentive. No props.
```

### read — frame 02

```text
STATE read — Holding a small open book in both paws. Book uses paper-white pages with a dark spine, no lettering. Eyes lowered toward the book, soft closed smile. Scarf visible. No other props.
```

### think — frame 03

```text
STATE think — Head shifted one pixel to the right, one eye narrowed, one paw touching the chin. A single tiny amber dot floats above one ear. Tail still. No props.
```

### upload — frame 04

```text
STATE upload — Holding a small paper-white document with a dark edge in one paw, inspecting it with one focused eye and one lime eye slightly wider. Scarf visible. No book, no magnifier.
```

### celebrate — frame 05

```text
STATE celebrate — Body lifted one pixel, both paws raised, open paper-white smile, tail angled upward. One small amber star above the head. No other props.
```

### encourage — frame 06

```text
STATE encourage — Gentle nod pose, head lowered one pixel, soft closed smile, one paw extended toward the viewer. One blush cheek visible. Tail calm. No props.
```

### hint — frame 07

```text
STATE hint — One paw raised with a single pointed gesture, one eye narrowed knowingly, the other eye open. One tiny amber dot beside the raised paw. No full answer text, no book.
```

### explain — frame 08

```text
STATE explain — One paw pointing toward a small open book beside the cat. Mouth open in a short teaching line, eyes calm and attentive. Scarf visible. No other props.
```

### search — frame 09

```text
STATE search — Holding a tiny magnifier to one eye: dark circular ring, lime handle. Body leaned one pixel forward, eyes wide, tail straight with curiosity. Scarf visible. No book, no document.
```

### error — frame 10

```text
STATE error — Ears lowered by one pixel, eyes wide with small dark pupils, mouth a short downward line, one blush cheek. Tail tucked close. No props. Confused, not scared.
```

### sleep — frame 11

```text
STATE sleep — Body lowered one pixel, eyes closed as two short dark lines, tail curled around the paws. One tiny amber dot as a quiet dream accent. No text, no props.
```

## Strict sprite consistency checklist

- [ ] Exactly 12 frames, each 12×12 logical pixels, aligned left-to-right with no gaps.
- [ ] Transparent background in every frame; no matte color, no checkerboard.
- [ ] Hard pixel edges only; no anti-aliasing, blur, gradient or alpha-soft pixels.
- [ ] Only the six approved colors plus full transparency appear in the sheet.
- [ ] Same silhouette in all frames: rounded ears, centered head, visible uncropped tail.
- [ ] At least 1 px margin around ear tips and tail tip inside each frame.
- [ ] Same body baseline and proportions across all frames; only pose and expression change.
- [ ] Tiny lime scarf present in every frame, same width and position.
- [ ] No extra objects except the prop named in that frame's state prompt.
- [ ] No text, letters, numbers, logos or watermarks inside any frame.
- [ ] Frame reads clearly at 36×36 CSS px and remains recognizable at 24×24.
- [ ] Frame order matches the manifest: greet, idle, read, think, upload, celebrate, encourage, hint, explain, search, error, sleep.

## Recommended final prompt pack

Copy the entire block below into the image-generation workflow. If the model cannot hold an exact 12-frame grid, generate the 12 state lines as individual 12×12 frames and assemble them left-to-right according to `docs/pet-sprite-spec.md`.

```text
CANVAS — Create one horizontal pixel-art sprite sheet for an education app companion cat named Pip. Exactly 12 frames in a single row. Each frame is 12×12 logical pixels. Total sheet size: 144×12 pixels. Frame 00 at columns 0–11, frame 01 at columns 12–23, and so on to frame 11 at columns 132–143. Transparent background. Hard square pixels, 1 image pixel = 1 logical pixel. No anti-aliasing, no gradients, no blur, no dithering noise, no soft shadows, no text, no watermark.

PALETTE — Use exactly six colors plus full transparency: outline #182C29, body #23664F, accent lime #DCEC9C, paper white #F7F9F7, blush #F2B8A2, spark #E6C15A.

IDENTITY LOCK — Same cat in every frame: rounded ears with both tips fully inside the 12×12 frame, visible tail never cropped, lime eyes with dark pupils, tiny lime scarf at the neck, identical body proportions and baseline. Friendly, smart, warm, cute but not childish. Readable at 36×36 CSS px and still clear at 24×24. No extra objects unless named in the frame instruction. No glasses, no hat, no costume, no second character, no background scenery.

NEGATIVE — photorealism, 3D render, smooth vector shapes, fuzzy edges, gradients, alpha shading, blur, motion blur, drop shadows, dithering, extra limbs, extra tail, second cat, cropped ears, cropped tail, off-grid pixels, colors outside the six-color palette, glasses, hats, crowns, costumes, busy background, text, logo, watermark, multiple poses inside one frame.

FRAME 00 greet — One front paw lifted in a small friendly wave. Open smile. Bright eyes. Tail gently curled. No props.
FRAME 01 idle — Relaxed sitting pose, calm level eyes, tiny flat mouth, tail curled to one side. No props.
FRAME 02 read — Holding a small open book in both paws, paper-white pages with dark spine, no lettering. Eyes lowered. No other props.
FRAME 03 think — Head shifted one pixel right, one eye narrowed, one paw touching chin, one tiny amber dot above one ear. No props.
FRAME 04 upload — Holding a small paper-white document with dark edge in one paw, inspecting it. No book, no magnifier.
FRAME 05 celebrate — Body lifted one pixel, both paws raised, open smile, tail up, one small amber star above head. No other props.
FRAME 06 encourage — Gentle nod, head lowered one pixel, soft closed smile, one paw extended toward viewer, one blush cheek. No props.
FRAME 07 hint — One paw raised in a single pointed gesture, one eye narrowed knowingly, one tiny amber dot beside the paw. No book, no text.
FRAME 08 explain — One paw pointing toward a small open book beside the cat, short teaching mouth line, calm eyes. No other props.
FRAME 09 search — Tiny magnifier at one eye, dark ring and lime handle, body leaned one pixel forward, wide eyes, tail straight. No book, no document.
FRAME 10 error — Ears lowered one pixel, wide eyes, short downward mouth, one blush cheek, tail tucked close. Confused, not scared. No props.
FRAME 11 sleep — Body lowered one pixel, eyes closed as two short dark lines, tail curled around paws, one tiny amber dream dot. No text, no props.

OUTPUT — A single transparent PNG sprite sheet, 144×12 pixels, 12 evenly spaced 12×12 frames in the exact order above, no gaps, no borders, no metadata.
```
