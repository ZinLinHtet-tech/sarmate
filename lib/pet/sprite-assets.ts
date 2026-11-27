import type { PetAnimationKey, PetStateName } from './types.ts';

export type SpriteAnimationKey = 'greet' | 'idle' | 'read' | 'think' | 'upload' | 'celebrate' | 'encourage' | 'hint' | 'explain' | 'search' | 'error' | 'sleep';

export type PetSpriteAnimation = {
  frames: number;
  fps: number;
  loop: boolean;
  startFrame: number;
  row?: number;
  durationMs?: number;
};

export type PetSpriteManifest = {
  schema: 'sarmate-pet-sprites/1';
  id: string;
  displayName: string;
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  columns: number;
  rows: number;
  animations: Record<SpriteAnimationKey, PetSpriteAnimation>;
};

export type SpriteFrameStyle = {
  width: number;
  height: number;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPositionX: string;
  backgroundPositionY: string;
  '--pet-sheet-start': string;
  '--pet-sheet-end': string;
  '--pet-sheet-duration': string;
  '--pet-sheet-frames': string;
};

export const SPRITE_ANIMATIONS: SpriteAnimationKey[] = ['greet', 'idle', 'read', 'think', 'upload', 'celebrate', 'encourage', 'hint', 'explain', 'search', 'error', 'sleep'];
export const DEFAULT_SPRITE_MANIFEST_PATH = '/pets/sarmate-cat/animation-manifest.json';
export const LEGACY_SPRITE_MANIFEST_PATH = '/pets/sarmate-cat/manifest.json';

const ANIMATION_MAP: Record<PetAnimationKey, SpriteAnimationKey> = {
  none: 'idle',
  wave: 'greet',
  idle: 'idle',
  read: 'read',
  think: 'think',
  carry: 'upload',
  jump: 'celebrate',
  nod: 'encourage',
  wink: 'hint',
  point: 'explain',
  search: 'search',
  confused: 'error',
  rest: 'sleep',
};

const STATE_MAP: Partial<Record<PetStateName, SpriteAnimationKey>> = {
  greeting: 'greet',
  uploading: 'upload',
  celebrating: 'celebrate',
  encouraging: 'encourage',
  hinting: 'hint',
  explaining: 'explain',
  searching: 'search',
  error: 'error',
  sleeping: 'sleep',
  reading: 'read',
  focused: 'read',
  idle: 'idle',
};

export function spriteAnimationFor(animation: PetAnimationKey, state?: PetStateName): SpriteAnimationKey {
  if (animation === 'none') {
    if (state && STATE_MAP[state]) return STATE_MAP[state]!;
    return 'idle';
  }
  const mapped = ANIMATION_MAP[animation];
  if (SPRITE_ANIMATIONS.includes(mapped)) return mapped;
  if (state && STATE_MAP[state]) return STATE_MAP[state]!;
  return 'idle';
}

export function spriteAnimationForState(state: PetStateName, animation?: PetAnimationKey): SpriteAnimationKey {
  return animation ? spriteAnimationFor(animation, state) : spriteAnimationFor('none', state);
}

export function animationDurationMs(animation: PetSpriteAnimation): number {
  return animation.durationMs ?? 1000 * animation.frames / animation.fps;
}

export function validatePetSpriteManifest(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Manifest must be an object.'];
  const manifest = value as Partial<PetSpriteManifest>;
  const problems: string[] = [];
  if (manifest.schema !== 'sarmate-pet-sprites/1') problems.push('Unsupported sprite manifest schema.');
  if (!manifest.id || !manifest.displayName) problems.push('Pet id and display name are required.');
  if (typeof manifest.sheet !== 'string' || !manifest.sheet.startsWith('/')) problems.push('Sheet must be a public URL path.');
  for (const key of ['frameWidth', 'frameHeight', 'scale', 'columns', 'rows'] as const) {
    if (!Number.isInteger(manifest[key]) || (manifest[key] as number) < 1) problems.push(`${key} must be a positive integer.`);
  }
  if (!manifest.animations) return [...problems, 'Animations are required.'];
  for (const key of SPRITE_ANIMATIONS) {
    const animation = manifest.animations[key];
    if (!animation) {
      problems.push(`Missing animation: ${key}.`);
      continue;
    }
    if (!Number.isInteger(animation.frames) || animation.frames < 1) problems.push(`${key}.frames must be at least 1.`);
    if (!Number.isFinite(animation.fps) || animation.fps <= 0) problems.push(`${key}.fps must be positive.`);
    if (animation.durationMs !== undefined && (!Number.isFinite(animation.durationMs) || animation.durationMs <= 0)) problems.push(`${key}.durationMs must be positive.`);
    if (typeof animation.loop !== 'boolean') problems.push(`${key}.loop must be a boolean.`);
    if (!Number.isInteger(animation.startFrame) || animation.startFrame < 0) problems.push(`${key}.startFrame must be non-negative.`);
    if (!Number.isInteger(animation.row ?? 0) || (animation.row ?? 0) < 0) problems.push(`${key}.row must be a non-negative integer.`);
    if (manifest.columns && animation.startFrame + animation.frames > manifest.columns) problems.push(`${key} exceeds the sheet columns.`);
    if (manifest.rows && (animation.row ?? 0) >= manifest.rows) problems.push(`${key} exceeds the sheet rows.`);
  }
  return problems;
}

export function shouldAnimateSprite(reducedMotion: boolean, frames: number): boolean {
  return !reducedMotion && frames > 1;
}

export function shouldAnimateFallback(reducedMotion: boolean, animation: PetAnimationKey): boolean {
  return !reducedMotion && animation !== 'none';
}

export type SpritePlayback = { animate: boolean; loop: boolean; durationMs: number; className: string };

export function spritePlayback(manifest: PetSpriteManifest, key: SpriteAnimationKey, reducedMotion = false, paused = false): SpritePlayback {
  const animation = manifest.animations[key];
  const animate = shouldAnimateSprite(reducedMotion, animation.frames) && !paused;
  const loop = animate && animation.loop && animation.frames > 1;
  const className = [
    animate ? 'pet-sheet-animated' : '',
    loop ? 'pet-sheet-loop' : '',
    animate && !loop ? 'pet-sheet-one-shot' : '',
    paused ? 'pet-sheet-paused' : '',
  ].filter(Boolean).join(' ');
  return { animate, loop, durationMs: animationDurationMs(animation), className };
}

export function spriteFrameStyle(manifest: PetSpriteManifest, key: SpriteAnimationKey): SpriteFrameStyle {
  const animation = manifest.animations[key];
  const frameWidth = manifest.frameWidth * manifest.scale;
  const frameHeight = manifest.frameHeight * manifest.scale;
  const start = -animation.startFrame * frameWidth;
  const end = -(animation.startFrame + animation.frames) * frameWidth;
  return {
    width: frameWidth,
    height: frameHeight,
    backgroundImage: `url("${manifest.sheet}")`,
    backgroundSize: `${manifest.columns * frameWidth}px ${manifest.rows * frameHeight}px`,
    backgroundPositionX: `${start}px`,
    backgroundPositionY: `${-(animation.row ?? 0) * frameHeight}px`,
    '--pet-sheet-start': `${start}px`,
    '--pet-sheet-end': `${end}px`,
    '--pet-sheet-duration': `${animationDurationMs(animation)}ms`,
    '--pet-sheet-frames': String(animation.frames),
  };
}

const manifestCache = new Map<string, Promise<PetSpriteManifest | null>>();

export type SheetSize = { width: number; height: number };
export type SheetVerifier = (src: string) => Promise<SheetSize | null>;

async function defaultSheetVerifier(src: string): Promise<SheetSize | null> {
  if (typeof Image === 'undefined') return null;
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Sprite sheet could not be loaded.'));
    image.src = src;
  });
}

export function loadPetSpriteManifest(
  url: string = DEFAULT_SPRITE_MANIFEST_PATH,
  fetcher: typeof fetch = fetch,
  verifySheet: SheetVerifier = defaultSheetVerifier,
): Promise<PetSpriteManifest | null> {
  const cached = manifestCache.get(url);
  if (cached) return cached;
  const task = (async () => {
    try {
      const response = await fetcher(url, { cache: 'force-cache' });
      if (!response.ok) return null;
      const raw: unknown = await response.json();
      if (validatePetSpriteManifest(raw).length) return null;
      const manifest = raw as PetSpriteManifest;
      const size = await verifySheet(manifest.sheet);
      if (size && (size.width !== manifest.columns * manifest.frameWidth || size.height !== manifest.rows * manifest.frameHeight)) return null;
      return manifest;
    } catch {
      return null;
    }
  })();
  manifestCache.set(url, task);
  return task;
}
