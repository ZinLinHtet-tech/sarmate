'use client';

import { useCallback, useEffect, useReducer, useRef, useSyncExternalStore } from 'react';
import { applyEvents, baselineState, createPetState, eventsFromSnapshot, reducePetState } from '../lib/pet/controller.ts';
import { animationFor } from '../lib/pet/states.ts';
import { dialogueFor } from '../lib/pet/dialogue.ts';
import type { CompanionSnapshot, PetEvent, PetRuntimeState } from '../lib/pet/types.ts';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IDLE_AFTER_MS = 30000;
const FALLBACK_SNAPSHOT: CompanionSnapshot = {
  tab: 'notes',
  busy: false,
  importing: false,
  error: '',
  hasGuide: false,
  importCompleted: 0,
  practice: { index: -1, attempt: 0, outcome: null },
  evidenceSearched: false,
  evidenceCount: 0,
};

type PetAction = PetEvent | { type: 'batch'; events: PetEvent[] };

function controllerReducer(state: PetRuntimeState, action: PetAction): PetRuntimeState {
  if (action.type === 'batch') return applyEvents(state, action.events);
  return reducePetState(state, action);
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function reducedMotionSnapshot(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverReducedMotion(): boolean {
  return false;
}

export function usePetController(snapshot?: CompanionSnapshot | null) {
  const [state, dispatch] = useReducer(controllerReducer, undefined, () => createPetState());
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, serverReducedMotion);
  const previous = useRef<CompanionSnapshot | null>(null);

  useEffect(() => {
    if (!snapshot) return;
    const events = eventsFromSnapshot(previous.current, snapshot);
    previous.current = snapshot;
    if (events.length) dispatch({ type: 'batch', events });
  }, [snapshot]);

  useEffect(() => {
    if (!state.temporary || !state.expiresAt) return;
    const delay = Math.max(0, state.expiresAt - Date.now());
    const timer = setTimeout(() => dispatch({
      type: 'expire',
      baseline: baselineState(snapshot || FALLBACK_SNAPSHOT),
      locked: false,
      now: Date.now(),
    }), delay);
    return () => clearTimeout(timer);
  }, [snapshot, state.expiresAt, state.pulse, state.temporary]);

  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'idle' }), IDLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [state.pulse]);

  const isIdle = state.current === 'idle';
  useEffect(() => {
    if (!isIdle) return;
    const timer = setTimeout(() => dispatch({ type: 'sleep' }), IDLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [isIdle, state.pulse]);

  const send = useCallback((event: PetEvent) => dispatch(event), []);
  return {
    state,
    dispatch: send,
    reducedMotion,
    animation: animationFor(state.current),
    message: dialogueFor(state.current),
  };
}
