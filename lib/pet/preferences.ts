export type PetPreferences = { hidden: boolean; muted: boolean };
export type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };

export const PET_PREFERENCES_KEY = 'sarmate-pet-preferences';
export const DEFAULT_PET_PREFERENCES: PetPreferences = { hidden: false, muted: false };

export function parsePetPreferences(raw: string | null): PetPreferences {
  if (!raw) return { ...DEFAULT_PET_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<PetPreferences>;
    return {
      hidden: typeof parsed.hidden === 'boolean' ? parsed.hidden : false,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
    };
  } catch {
    return { ...DEFAULT_PET_PREFERENCES };
  }
}

export function readPetPreferences(storage?: StorageLike | null): PetPreferences {
  if (!storage) return { ...DEFAULT_PET_PREFERENCES };
  try {
    return parsePetPreferences(storage.getItem(PET_PREFERENCES_KEY));
  } catch {
    return { ...DEFAULT_PET_PREFERENCES };
  }
}

export function writePetPreferences(storage: StorageLike | null | undefined, value: PetPreferences): void {
  if (!storage) return;
  try {
    storage.setItem(PET_PREFERENCES_KEY, JSON.stringify(value));
  } catch {
    return;
  }
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let snapshot: PetPreferences = { ...DEFAULT_PET_PREFERENCES };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  snapshot = readPetPreferences(browserStorage());
}

export function subscribePetPreferences(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PET_PREFERENCES_KEY) return;
    snapshot = readPetPreferences(browserStorage());
    listeners.forEach(notify => notify());
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

export function getPetPreferencesSnapshot(): PetPreferences {
  hydrate();
  return snapshot;
}

export function getServerPetPreferencesSnapshot(): PetPreferences {
  return DEFAULT_PET_PREFERENCES;
}

export function updatePetPreferences(patch: Partial<PetPreferences>): void {
  hydrate();
  snapshot = { ...snapshot, ...patch };
  writePetPreferences(browserStorage(), snapshot);
  listeners.forEach(listener => listener());
}
