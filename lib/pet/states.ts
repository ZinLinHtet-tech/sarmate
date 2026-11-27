import { PET_DIALOGUE } from './dialogue.ts';
import type { PetAnimationKey, PetPriority, PetStateDefinition, PetStateName } from './types.ts';

const define = (
  name: PetStateName,
  animation: PetAnimationKey,
  durationMs: number,
  priority: PetPriority,
  persistent: boolean,
): PetStateDefinition => ({ name, animation, durationMs, priority, persistent, message: PET_DIALOGUE[name] });

export const PET_STATES: Record<PetStateName, PetStateDefinition> = {
  hidden: define('hidden', 'none', 0, 100, true),
  error: define('error', 'confused', 3000, 90, false),
  celebrating: define('celebrating', 'jump', 2000, 80, false),
  explaining: define('explaining', 'point', 4200, 75, false),
  hinting: define('hinting', 'wink', 3200, 70, false),
  encouraging: define('encouraging', 'nod', 2200, 60, false),
  thinking: define('thinking', 'think', 0, 55, false),
  uploading: define('uploading', 'carry', 2500, 55, false),
  greeting: define('greeting', 'wave', 2200, 50, false),
  searching: define('searching', 'search', 2400, 40, false),
  reading: define('reading', 'read', 0, 20, true),
  focused: define('focused', 'idle', 0, 25, true),
  idle: define('idle', 'idle', 0, 10, true),
  sleeping: define('sleeping', 'rest', 0, 5, true),
};

export const PET_STATE_NAMES = Object.keys(PET_STATES) as PetStateName[];

export function isTemporaryState(name: PetStateName): boolean {
  return !PET_STATES[name].persistent;
}

export function durationFor(name: PetStateName): number {
  return PET_STATES[name].durationMs;
}

export function animationFor(name: PetStateName): PetAnimationKey {
  return PET_STATES[name].animation;
}

export function priorityOf(name: PetStateName): PetPriority {
  return PET_STATES[name].priority;
}
