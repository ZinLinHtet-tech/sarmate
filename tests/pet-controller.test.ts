import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEvents,
  baselineState,
  createPetState,
  PET_STATES,
  reducePetState,
  resolveState,
  type CompanionSnapshot,
  type PetEvent,
} from '../lib/pet/index.ts';

const snapshot = (overrides: Partial<CompanionSnapshot> = {}): CompanionSnapshot => ({
  tab: 'notes',
  busy: false,
  importing: false,
  error: '',
  hasGuide: false,
  importCompleted: 0,
  practice: { index: -1, attempt: 0, outcome: null },
  evidenceSearched: false,
  evidenceCount: 0,
  ...overrides,
});

test('first render creates a temporary greeting with an expiry', () => {
  const state = createPetState(1000);
  assert.equal(state.current, 'greeting');
  assert.equal(state.previous, null);
  assert.equal(state.temporary, true);
  assert.equal(state.expiresAt, 1000 + PET_STATES.greeting.durationMs);
  assert.equal(resolveState({ type: 'open' }), 'greeting');
});

test('building holds thinking until success or an unlocked expiry', () => {
  const idle = createPetState(0, 'idle');
  const thinking = reducePetState(idle, { type: 'build-start' }, 10);
  assert.equal(thinking.current, 'thinking');
  assert.equal(thinking.temporary, true);
  assert.equal(thinking.expiresAt, null);
  assert.equal(reducePetState(thinking, { type: 'expire', baseline: 'reading', locked: true }, 20).current, 'thinking');
  const reading = reducePetState(thinking, { type: 'build-success' }, 20);
  assert.equal(reading.current, 'reading');
  assert.equal(reading.temporary, false);
  const expired = reducePetState(thinking, { type: 'expire', baseline: 'reading', locked: false }, 20);
  assert.equal(expired.current, 'reading');
});

test('errors override active reactions and force to baseline on reset', () => {
  const idle = createPetState(0, 'idle');
  const error = reducePetState(idle, { type: 'error' }, 10);
  assert.equal(error.current, 'error');
  assert.equal(error.temporary, true);
  assert.equal(reducePetState(error, { type: 'PRACTICE_CORRECT' }, 20).current, 'error');
  assert.equal(reducePetState(error, { type: 'PRACTICE_RESET', baseline: 'focused' }, 20).current, 'focused');
  assert.equal(reducePetState(error, { type: 'hide' }, 20).current, 'hidden');
});

test('higher-priority temporary reactions replace lower-priority ones', () => {
  let state = createPetState(0, 'idle');
  const steps = [
    [{ type: 'PRACTICE_WRONG_FIRST' }, 'encouraging'],
    [{ type: 'PRACTICE_WRONG_SECOND' }, 'hinting'],
    [{ type: 'PRACTICE_WRONG_THIRD' }, 'explaining'],
    [{ type: 'PRACTICE_CORRECT' }, 'celebrating'],
  ] as const;
  for (const [event, expected] of steps) {
    state = reducePetState(state, event, 1000);
    assert.equal(state.current, expected);
    assert.equal(state.temporary, true);
  }
  const uploading = reducePetState(createPetState(0, 'idle'), { type: 'import' }, 10);
  assert.equal(reducePetState(uploading, { type: 'PRACTICE_CORRECT' }, 20).current, 'celebrating');
});

test('temporary reactions expire to the appropriate baseline', () => {
  const idle = createPetState(0, 'idle');
  const celebrating = reducePetState(idle, { type: 'PRACTICE_CORRECT' }, 10);
  const practiceBaseline = baselineState(snapshot({ tab: 'practice', hasGuide: true }));
  assert.equal(practiceBaseline, 'focused');
  const expired = reducePetState(celebrating, { type: 'expire', baseline: practiceBaseline, locked: false }, 20);
  assert.equal(expired.current, 'focused');
  assert.equal(expired.temporary, false);
  assert.equal(expired.expiresAt, null);
  assert.equal(baselineState(snapshot({ tab: 'ask' })), 'searching');
  assert.equal(baselineState(snapshot()), 'idle');
});

test('applyEvents applies a batch in order without mutating the input', () => {
  const initial = createPetState(0, 'idle');
  const events: PetEvent[] = [{ type: 'PRACTICE_WRONG_FIRST' }, { type: 'PRACTICE_WRONG_SECOND' }];
  const next = applyEvents(initial, events, 100);
  assert.equal(next.current, 'hinting');
  assert.equal(initial.current, 'idle');
  assert.equal(next.pulse, 2);
});
