import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEvents,
  baselineState,
  createPetState,
  eventsFromSnapshot,
  PET_STATES,
  priorityOf,
  reducePetState,
  resolveState,
} from '../lib/pet/index.ts';
import { dialogueFor, hasDialogue, PET_DIALOGUE } from '../lib/pet/dialogue.ts';
import type { CompanionSnapshot, PetStateName } from '../lib/pet/index.ts';

const REQUIRED: PetStateName[] = ['hidden', 'greeting', 'idle', 'reading', 'focused', 'thinking', 'uploading', 'celebrating', 'encouraging', 'hinting', 'explaining', 'searching', 'error', 'sleeping'];

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

test('every required state has animation, message, duration and priority metadata', () => {
  for (const name of REQUIRED) {
    const definition = PET_STATES[name];
    assert.ok(definition, name);
    assert.ok(definition.animation, name);
    assert.ok(priorityOf(name) > 0, name);
    assert.ok(definition.durationMs >= 0, name);
    assert.equal(definition.message, PET_DIALOGUE[name]);
    assert.equal(hasDialogue(name), name !== 'hidden');
    assert.ok(dialogueFor(name, 'en').length > 0 || name === 'hidden');
    assert.ok(dialogueFor(name, 'my').length > 0 || name === 'hidden');
  }
});

test('createPetState starts with a temporary greeting that expires', () => {
  const state = createPetState(1000);
  assert.equal(state.current, 'greeting');
  assert.equal(state.previous, null);
  assert.equal(state.temporary, true);
  assert.equal(state.expiresAt, 1000 + PET_STATES.greeting.durationMs);
  assert.equal(createPetState(1000, 'idle').expiresAt, null);
});

test('important reactions override idle states but not more important active reactions', () => {
  const idle = createPetState(0, 'idle');
  assert.equal(reducePetState(idle, { type: 'error' }, 10).current, 'error');
  assert.equal(reducePetState(reducePetState(idle, { type: 'import' }, 10), { type: 'answer', outcome: 'correct', attempt: 1 }, 20).current, 'celebrating');
  const error = reducePetState(idle, { type: 'error' }, 10);
  assert.equal(reducePetState(error, { type: 'answer', outcome: 'correct', attempt: 1 }, 20).current, 'error');
  assert.equal(reducePetState(error, { type: 'hide' }, 20).current, 'hidden');
  assert.equal(reducePetState(reducePetState(idle, { type: 'show' }, 10), { type: 'show' }, 20).current, 'idle');
});

test('answer attempts progress through encouraging, hinting and explaining', () => {
  let state = createPetState(0, 'idle');
  for (const [attempt, expected] of [[1, 'encouraging'], [2, 'hinting'], [3, 'explaining']] as const) {
    state = reducePetState(state, { type: 'answer', outcome: 'wrong', attempt }, attempt * 1000);
    assert.equal(state.current, expected);
    assert.equal(state.temporary, true);
  }
  state = reducePetState(state, { type: 'answer', outcome: 'correct', attempt: 4 }, 4000);
  assert.equal(state.current, 'celebrating');
  assert.equal(reducePetState(state, { type: 'PRACTICE_RESET', baseline: 'focused' }, 5000).current, 'focused');
});

test('expiry returns to baseline and locked build/upload states hold', () => {
  const idle = createPetState(0, 'idle');
  const reading = reducePetState(idle, { type: 'expire', baseline: 'reading', locked: false }, 100);
  assert.equal(reading.current, 'reading');
  assert.equal(reading.temporary, false);
  const thinking = reducePetState(idle, { type: 'build-start' }, 100);
  assert.equal(reducePetState(thinking, { type: 'expire', baseline: 'reading', locked: true }, 200).current, 'thinking');
  assert.equal(reducePetState(thinking, { type: 'expire', baseline: 'reading', locked: false }, 200).current, 'reading');
  assert.equal(reducePetState(reducePetState(idle, { type: 'sleep' }, 100), { type: 'open' }, 200).current, 'greeting');
});

test('resolveState and snapshot adapter emit structured practice events', () => {
  assert.equal(resolveState({ type: 'build-start' }), 'thinking');
  assert.equal(resolveState({ type: 'tab', tab: 'ask' }), 'searching');
  assert.equal(resolveState({ type: 'answer', outcome: 'wrong', attempt: 3 }), 'explaining');
  assert.equal(resolveState({ type: 'PRACTICE_CORRECT' }), 'celebrating');
  assert.equal(resolveState({ type: 'PRACTICE_WRONG_FIRST' }), 'encouraging');
  assert.equal(resolveState({ type: 'PRACTICE_WRONG_SECOND' }), 'hinting');
  assert.equal(resolveState({ type: 'PRACTICE_WRONG_THIRD' }), 'explaining');
  assert.equal(resolveState({ type: 'PRACTICE_RESET', baseline: 'focused' }), 'focused');
  assert.equal(resolveState({ type: 'tab', tab: 'practice' }), 'focused');
  assert.equal(resolveState({ type: 'import-complete' }), 'reading');
  assert.equal(baselineState(snapshot({ tab: 'ask' })), 'searching');
  assert.equal(baselineState(snapshot({ tab: 'practice' })), 'focused');
  const base = snapshot();
  assert.deepEqual(eventsFromSnapshot(null, base), [{ type: 'open' }]);
  const next = snapshot({ busy: true, importing: true, error: 'bad', tab: 'ask', evidenceSearched: true, evidenceCount: 1 });
  assert.deepEqual(eventsFromSnapshot(base, next), [
    { type: 'error' },
    { type: 'import' },
    { type: 'build-start' },
    { type: 'tab', tab: 'ask' },
    { type: 'evidence', found: true },
  ]);
  const answered = snapshot({ practice: { index: 0, attempt: 2, outcome: 'wrong' } });
  assert.deepEqual(eventsFromSnapshot(base, answered), [{ type: 'PRACTICE_WRONG_SECOND' }]);
  assert.deepEqual(eventsFromSnapshot(base, snapshot({ practice: { index: 0, attempt: 1, outcome: 'correct' } })), [{ type: 'PRACTICE_CORRECT' }]);
  const answeredInPractice = { ...answered, tab: 'practice' as const };
  assert.deepEqual(eventsFromSnapshot(answeredInPractice, snapshot({ tab: 'practice', practice: { index: -1, attempt: 0, outcome: 'reset' } })), [{ type: 'PRACTICE_RESET', baseline: 'focused' }]);
  assert.deepEqual(eventsFromSnapshot(base, snapshot({ importCompleted: 1 })), [{ type: 'import-complete' }]);
  assert.deepEqual(eventsFromSnapshot(base, snapshot({ tab: 'practice' })), [{ type: 'tab', tab: 'practice' }]);
  assert.equal(applyEvents(createPetState(0, 'idle'), eventsFromSnapshot(null, base), 100).current, 'greeting');
});
