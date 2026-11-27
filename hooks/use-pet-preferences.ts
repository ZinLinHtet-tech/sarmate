'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getPetPreferencesSnapshot,
  getServerPetPreferencesSnapshot,
  subscribePetPreferences,
  updatePetPreferences,
} from '../lib/pet/preferences.ts';

export function usePetPreferences() {
  const preferences = useSyncExternalStore(subscribePetPreferences, getPetPreferencesSnapshot, getServerPetPreferencesSnapshot);
  const setHidden = useCallback((hidden: boolean) => updatePetPreferences({ hidden }), []);
  const setMuted = useCallback((muted: boolean) => updatePetPreferences({ muted }), []);
  const toggleHidden = useCallback(() => setHidden(!getPetPreferencesSnapshot().hidden), [setHidden]);
  const toggleMuted = useCallback(() => setMuted(!getPetPreferencesSnapshot().muted), [setMuted]);
  return { hidden: preferences.hidden, muted: preferences.muted, setHidden, setMuted, toggleHidden, toggleMuted };
}
