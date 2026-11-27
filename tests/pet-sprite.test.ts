import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SPRITE_MANIFEST_PATH,
  LEGACY_SPRITE_MANIFEST_PATH,
  animationDurationMs,
  loadPetSpriteManifest,
  shouldAnimateFallback,
  shouldAnimateSprite,
  spriteAnimationForState,
  spriteFrameStyle,
  spritePlayback,
  validatePetSpriteManifest,
  type PetSpriteManifest,
} from '../lib/pet/sprite-assets.ts';
import { PET_STATE_NAMES } from '../lib/pet/states.ts';
import { createVisibilitySubscription, type VisibilityDocument } from '../lib/pet/visibility.ts';
import { frameForState, frameRows, petManifest, validateManifest } from '../lib/pet-sprite-manifest.ts';

const sample = JSON.parse(readFileSync(new URL('../public/pets/sarmate-cat/manifest.json', import.meta.url), 'utf8')) as PetSpriteManifest;
const animated = JSON.parse(readFileSync(new URL('../public/pets/sarmate-cat/animation-manifest.json', import.meta.url), 'utf8')) as PetSpriteManifest;
const sheetBytes = readFileSync(new URL('../public/pets/sarmate-cat/animation-sheet.png', import.meta.url));
const contactBytes = readFileSync(new URL('../public/pets/sarmate-cat/contact-sheet.png', import.meta.url));
const TOTAL_FRAMES = Object.values(animated.animations).reduce((sum, animation) => sum + animation.frames, 0);

function fakeDocument(state: string): VisibilityDocument & { listeners: Set<() => void> } {
  const listeners = new Set<() => void>();
  return {
    visibilityState: state,
    listeners,
    addEventListener: (_type, listener) => { listeners.add(listener); },
    removeEventListener: (_type, listener) => { listeners.delete(listener); },
  };
}

test('sample and final manifests parse and expose all sprite animations', () => {
  assert.deepEqual(validatePetSpriteManifest(sample), []);
  assert.deepEqual(validatePetSpriteManifest(animated), []);
  assert.equal(DEFAULT_SPRITE_MANIFEST_PATH, '/pets/sarmate-cat/animation-manifest.json');
  assert.equal(LEGACY_SPRITE_MANIFEST_PATH, '/pets/sarmate-cat/manifest.json');
  assert.equal(Object.keys(animated.animations).length, 12);
  assert.equal(animated.columns, TOTAL_FRAMES);
  assert.equal(animated.displayName, 'Mate');
  let cursor = 0;
  for (const animation of Object.values(animated.animations)) {
    assert.ok(animation.frames >= 4);
    assert.equal(animation.startFrame, cursor);
    cursor += animation.frames;
  }
});

test('final artwork PNG and contact sheet have expected geometry', () => {
  assert.equal(sheetBytes.readUInt32BE(16), animated.columns * animated.frameWidth);
  assert.equal(sheetBytes.readUInt32BE(20), animated.rows * animated.frameHeight);
  assert.ok(contactBytes.length > sheetBytes.length);
  assert.ok(animated.frameWidth >= 32);
  assert.ok(animated.frameHeight >= 32);
});

test('invalid manifests are rejected before rendering', () => {
  assert.ok(validatePetSpriteManifest(null).length > 0);
  assert.ok(validatePetSpriteManifest({ ...sample, schema: 'unknown/1' }).length > 0);
  assert.ok(validatePetSpriteManifest({ ...animated, animations: {} }).length > 0);
  const broken = { ...animated, animations: { ...animated.animations, idle: { ...animated.animations.idle, fps: 0 } } };
  assert.ok(validatePetSpriteManifest(broken).some(message => message.includes('fps')));
  const badDuration = { ...animated, animations: { ...animated.animations, idle: { ...animated.animations.idle, durationMs: -1 } } };
  assert.ok(validatePetSpriteManifest(badDuration).some(message => message.includes('durationMs')));
  const overflow = { ...animated, animations: { ...animated.animations, greet: { ...animated.animations.greet, startFrame: animated.columns } } };
  assert.ok(validatePetSpriteManifest(overflow).some(message => message.includes('columns')));
});

test('fallback asset manifest stays in sync with the typed fallback', () => {
  const asset = JSON.parse(readFileSync(new URL('../public/companion/manifest.json', import.meta.url), 'utf8')) as unknown;
  assert.deepEqual(asset, petManifest);
});

test('fallback pixel frames remain valid for every pet state', () => {
  assert.deepEqual(validateManifest(petManifest), []);
  for (const state of PET_STATE_NAMES) {
    const rows = frameRows(frameForState(state));
    assert.equal(rows.length, petManifest.tile);
    for (const row of rows) assert.equal(row.length, petManifest.tile);
  }
});

test('every pet state maps to a valid sprite animation', () => {
  for (const state of PET_STATE_NAMES) {
    assert.ok(Object.keys(animated.animations).includes(spriteAnimationForState(state)));
  }
  assert.equal(spriteAnimationForState('greeting'), 'greet');
  assert.equal(spriteAnimationForState('focused'), 'read');
  assert.equal(spriteAnimationForState('error'), 'error');
});

test('loader rejects missing, invalid and wrongly sized sheets', async () => {
  const expected = { width: animated.columns * animated.frameWidth, height: animated.rows * animated.frameHeight };
  assert.equal(await loadPetSpriteManifest('/test-pet-sprite-missing.json', async () => new Response('', { status: 404 })), null);
  assert.equal(await loadPetSpriteManifest('/test-pet-sprite-invalid.json', async () => Response.json({ schema: 'wrong' })), null);
  const valid = await loadPetSpriteManifest('/test-pet-sprite-final.json', async () => Response.json(animated), async () => expected);
  assert.deepEqual(valid, animated);
  const wrongSize = await loadPetSpriteManifest('/test-pet-sprite-size.json', async () => Response.json(animated), async () => ({ width: 96, height: 32 }));
  assert.equal(wrongSize, null);
});

test('frame style uses the final sheet grid without stretching', () => {
  const animation = animated.animations.sleep;
  const style = spriteFrameStyle(animated, 'sleep');
  const size = animated.frameWidth * animated.scale;
  assert.equal(style.width, size);
  assert.equal(style.height, size);
  assert.equal(style.backgroundPositionX, `${-animation.startFrame * size}px`);
  assert.equal(style.backgroundSize, `${animated.columns * size}px ${animated.rows * size}px`);
  assert.equal(style['--pet-sheet-frames'], String(animation.frames));
  assert.equal(animationDurationMs(animation), 1000 * animation.frames / animation.fps);
  assert.equal(animationDurationMs({ ...animation, durationMs: 900 }), 900);
});

test('playback distinguishes looping, one-shot, reduced motion and paused states', () => {
  const looping = spritePlayback(animated, 'idle');
  assert.equal(looping.animate, true);
  assert.match(looping.className, /pet-sheet-loop/);
  assert.doesNotMatch(looping.className, /pet-sheet-one-shot/);
  const oneShot = spritePlayback(animated, 'greet');
  assert.equal(oneShot.animate, true);
  assert.match(oneShot.className, /pet-sheet-one-shot/);
  const stopped = spritePlayback(animated, 'idle', true, false);
  assert.equal(stopped.animate, false);
  assert.equal(stopped.className, '');
  const paused = spritePlayback(animated, 'idle', false, true);
  assert.equal(paused.animate, false);
  assert.match(paused.className, /pet-sheet-paused/);
  assert.equal(shouldAnimateSprite(false, 4), true);
  assert.equal(shouldAnimateSprite(true, 4), false);
  assert.equal(shouldAnimateFallback(true, 'wave'), false);
});

test('stylesheet preserves reduced-motion, paused and mobile-safe pet rules', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /pet-sheet-paused\{animation-play-state:paused\}/);
  assert.match(css, /pet-card\{pointer-events:none/);
  assert.match(css, /\.pet-state-label,\.pet-name\{display:none\}/u);
});

test('visibility subscription notifies and removes its listener', () => {
  const doc = fakeDocument('visible');
  const subscription = createVisibilitySubscription(doc);
  let notified = 0;
  const unsubscribe = subscription.subscribe(() => { notified += 1; });
  assert.equal(subscription.getSnapshot(), 'visible');
  doc.visibilityState = 'hidden';
  doc.listeners.forEach(listener => listener());
  assert.equal(subscription.getSnapshot(), 'hidden');
  assert.equal(notified, 1);
  unsubscribe();
  assert.equal(doc.listeners.size, 0);
});
