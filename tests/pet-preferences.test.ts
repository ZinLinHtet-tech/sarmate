import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PET_PREFERENCES,
  PET_PREFERENCES_KEY,
  parsePetPreferences,
  readPetPreferences,
  writePetPreferences,
  type StorageLike,
} from '../lib/pet/preferences.ts';

function fakeStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

test('preferences parse safely from stored JSON', () => {
  assert.deepEqual(parsePetPreferences(null), DEFAULT_PET_PREFERENCES);
  assert.deepEqual(parsePetPreferences('not json'), DEFAULT_PET_PREFERENCES);
  assert.deepEqual(parsePetPreferences('{}'), DEFAULT_PET_PREFERENCES);
  assert.deepEqual(parsePetPreferences('{"hidden":true,"muted":"no"}'), { hidden: true, muted: false });
  assert.deepEqual(parsePetPreferences('{"hidden":false,"muted":true}'), { hidden: false, muted: true });
});

test('preferences round-trip through storage and tolerate storage failures', () => {
  const storage = fakeStorage();
  assert.deepEqual(readPetPreferences(storage), DEFAULT_PET_PREFERENCES);
  writePetPreferences(storage, { hidden: true, muted: true });
  assert.equal(storage.getItem(PET_PREFERENCES_KEY), '{"hidden":true,"muted":true}');
  assert.deepEqual(readPetPreferences(storage), { hidden: true, muted: true });
  const broken: StorageLike = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.deepEqual(readPetPreferences(broken), DEFAULT_PET_PREFERENCES);
  assert.doesNotThrow(() => writePetPreferences(broken, { hidden: true, muted: false }));
  assert.deepEqual(readPetPreferences(null), DEFAULT_PET_PREFERENCES);
});
