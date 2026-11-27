import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SPRITE_MANIFEST_PATH,
  loadPetSpriteManifest,
  spriteAnimationFor,
  spriteFrameStyle,
  validatePetSpriteManifest,
  type PetSpriteManifest,
} from '../lib/pet/sprite-assets.ts';

const sample = JSON.parse(readFileSync(new URL('../public/pets/sarmate-cat/manifest.json', import.meta.url), 'utf8')) as PetSpriteManifest;

test('sample sprite manifest is valid and complete', () => {
  assert.deepEqual(validatePetSpriteManifest(sample), []);
  assert.equal(sample.schema, 'sarmate-pet-sprites/1');
  assert.equal(sample.id, 'sarmate-cat');
  assert.equal(sample.sheet, '/pets/sarmate-cat/spritesheet.png');
  assert.equal(DEFAULT_SPRITE_MANIFEST_PATH, '/pets/sarmate-cat/animation-manifest.json');
  assert.equal(Object.keys(sample.animations).length, 12);
});

test('manifest validation rejects missing or invalid animation entries', () => {
  assert.ok(validatePetSpriteManifest(null).length > 0);
  assert.ok(validatePetSpriteManifest({ ...sample, schema: 'other/1' }).length > 0);
  const missing = { ...sample, animations: { ...sample.animations, sleep: undefined } };
  assert.ok(validatePetSpriteManifest(missing).some(message => message.includes('sleep')));
  const broken = { ...sample, animations: { ...sample.animations, greet: { ...sample.animations.greet, frames: 0 } } };
  assert.ok(validatePetSpriteManifest(broken).some(message => message.includes('frames')));
  const overflow = { ...sample, animations: { ...sample.animations, greet: { ...sample.animations.greet, startFrame: 12 } } };
  assert.ok(validatePetSpriteManifest(overflow).some(message => message.includes('columns')));
});

test('domain animation keys map to sprite animation keys with state fallback', () => {
  assert.equal(spriteAnimationFor('wave'), 'greet');
  assert.equal(spriteAnimationFor('jump'), 'celebrate');
  assert.equal(spriteAnimationFor('carry'), 'upload');
  assert.equal(spriteAnimationFor('nod'), 'encourage');
  assert.equal(spriteAnimationFor('wink'), 'hint');
  assert.equal(spriteAnimationFor('point'), 'explain');
  assert.equal(spriteAnimationFor('confused'), 'error');
  assert.equal(spriteAnimationFor('rest'), 'sleep');
  assert.equal(spriteAnimationFor('none'), 'idle');
  assert.equal(spriteAnimationFor('none', 'searching'), 'search');
  assert.equal(spriteAnimationFor('none', 'focused'), 'read');
});

test('frame style uses sprite-sheet coordinates and animation variables', () => {
  const style = spriteFrameStyle(sample, 'explain');
  assert.equal(style.width, 36);
  assert.equal(style.height, 36);
  assert.equal(style.backgroundImage, 'url("/pets/sarmate-cat/spritesheet.png")');
  assert.equal(style.backgroundSize, '432px 36px');
  assert.equal(style.backgroundPositionX, '-288px');
  assert.equal(style.backgroundPositionY, '0px');
  assert.equal(style['--pet-sheet-start'], '-288px');
  assert.equal(style['--pet-sheet-end'], '-324px');
  assert.equal(style['--pet-sheet-frames'], '1');
});

test('loader returns a validated manifest and rejects invalid responses', async () => {
  const ok = await loadPetSpriteManifest('/test-manifest-ok.json', async () => Response.json(sample));
  assert.deepEqual(ok, sample);
  const invalid = await loadPetSpriteManifest('/test-manifest-bad.json', async () => Response.json({ schema: 'wrong' }));
  assert.equal(invalid, null);
  const missing = await loadPetSpriteManifest('/test-manifest-missing.json', async () => new Response('', { status: 404 }));
  assert.equal(missing, null);
});
