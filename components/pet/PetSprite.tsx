'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { PET_STATES } from '../../lib/pet/states.ts';
import { frameForState, frameRows, petManifest } from '../../lib/pet-sprite-manifest.ts';
import {
  DEFAULT_SPRITE_MANIFEST_PATH,
  loadPetSpriteManifest,
  shouldAnimateFallback,
  spriteAnimationForState,
  spriteFrameStyle,
  spritePlayback,
  type PetSpriteManifest,
} from '../../lib/pet/sprite-assets.ts';
import type { PetAnimationKey, PetStateName } from '../../lib/pet/types.ts';

export type PetSpriteProps = {
  state: PetStateName;
  animation?: PetAnimationKey;
  reducedMotion?: boolean;
  paused?: boolean;
  manifestSrc?: string;
  onClick?: () => void;
  className?: string;
};

export function PetSprite({
  state,
  animation,
  reducedMotion = false,
  paused = false,
  manifestSrc = DEFAULT_SPRITE_MANIFEST_PATH,
  onClick,
  className = '',
}: PetSpriteProps) {
  const [asset, setAsset] = useState<PetSpriteManifest | null>(null);

  useEffect(() => {
    let active = true;
    loadPetSpriteManifest(manifestSrc).then(manifest => {
      if (active) setAsset(manifest);
    });
    return () => { active = false; };
  }, [manifestSrc]);

  const fallbackMotion = animation ?? PET_STATES[state].animation;
  const spriteKey = spriteAnimationForState(state, animation);
  const animationDefinition = asset?.animations[spriteKey];
  const useSheet = Boolean(asset && animationDefinition);
  const playback = asset && animationDefinition ? spritePlayback(asset, spriteKey, reducedMotion, paused) : null;
  const motionClass = !useSheet && shouldAnimateFallback(reducedMotion || paused, fallbackMotion) ? ` pet-anim--${fallbackMotion}` : '';
  const classes = `pet-sprite${motionClass}${className ? ` ${className}` : ''}`;

  const visual = useSheet && asset && animationDefinition ? (
    <span
      key={spriteKey}
      className={`pet-sheet-frame ${playback?.className || ''}`.trim()}
      style={spriteFrameStyle(asset, spriteKey) as CSSProperties}
      data-sprite-animation={spriteKey}
      aria-hidden="true"
    />
  ) : (
    <svg viewBox={`0 0 ${petManifest.tile} ${petManifest.tile}`} width={petManifest.tile * petManifest.scale} height={petManifest.tile * petManifest.scale} shapeRendering="crispEdges" focusable="false" aria-hidden="true">
      {frameRows(frameForState(state)).flatMap((row, y) => [...row].map((key, x) => ({ key, x, y }))).filter(pixel => Boolean(petManifest.palette[pixel.key])).map(pixel => (
        <rect key={`${pixel.x}-${pixel.y}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={petManifest.palette[pixel.key]} />
      ))}
    </svg>
  );

  return onClick
    ? <button type="button" className={`${classes} pet-sprite-button`} onClick={onClick} aria-label="Say hello to Mate">{visual}</button>
    : <span className={classes}>{visual}</span>;
}
