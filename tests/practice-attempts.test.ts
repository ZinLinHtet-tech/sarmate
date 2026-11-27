import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAttempt,
  checkAnswer,
  initialPracticeState,
  normaliseAnswer,
  resetAttempt,
  resetPractice,
  tokenise,
  type PracticeState,
} from '../lib/practice.ts';
import { eventsFromSnapshot } from '../lib/pet/controller.ts';
import type { CompanionSnapshot } from '../lib/pet/types.ts';

const question = { prompt: 'What is an algorithm?', answer: 'A finite sequence of well-defined steps.', passageId: 'P1' };
const passage = { id: 'P1', text: 'An algorithm is a finite sequence of well-defined steps used to solve a problem.' };
const wrong = 'photosynthesis';

const snapshot = (state: PracticeState, tab: CompanionSnapshot['tab'] = 'practice'): CompanionSnapshot => ({
  tab,
  busy: false,
  importing: false,
  error: '',
  hasGuide: true,
  importCompleted: 0,
  practice: state.last,
  evidenceSearched: false,
  evidenceCount: 0,
});

function wrongAttempts(count: number): PracticeState {
  let state = initialPracticeState();
  for (let attempt = 0; attempt < count; attempt++) state = applyAttempt(state, 0, wrong, question, passage);
  return state;
}

test('first incorrect attempt asks for retry without revealing a hint', () => {
  const before = initialPracticeState();
  const after = applyAttempt(before, 0, wrong, question, passage);
  assert.equal(after.attempts[0].status, 'retry');
  assert.equal(after.attempts[0].attempts, 1);
  assert.equal(after.attempts[0].input, wrong);
  assert.equal(after.attempts[0].correct, false);
  assert.equal(after.attempts[0].hint, null);
  assert.equal(after.attempts[0].hintShown, false);
  assert.equal(after.attempts[0].explanationShown, false);
  assert.equal(after.attempts[0].answerShown, false);
  assert.deepEqual(eventsFromSnapshot(snapshot(before), snapshot(after)), [{ type: 'PRACTICE_WRONG_FIRST' }]);
});

test('second incorrect attempt shows a hint referencing the passage', () => {
  const before = wrongAttempts(1);
  const after = applyAttempt(before, 0, wrong, question, passage);
  assert.equal(after.attempts[0].status, 'hint');
  assert.equal(after.attempts[0].hintShown, true);
  assert.match(after.attempts[0].hint || '', /P1/);
  assert.equal(after.attempts[0].explanationShown, false);
  assert.deepEqual(eventsFromSnapshot(snapshot(before), snapshot(after)), [{ type: 'PRACTICE_WRONG_SECOND' }]);
});

test('third incorrect attempt shows the answer and explanation then stops', () => {
  const before = wrongAttempts(2);
  const after = applyAttempt(before, 0, wrong, question, passage);
  assert.equal(after.attempts[0].status, 'explained');
  assert.equal(after.attempts[0].explanationShown, true);
  assert.equal(after.attempts[0].answerShown, true);
  assert.match(after.attempts[0].explanation || '', /A finite sequence/);
  assert.match(after.attempts[0].explanation || '', /P1/);
  assert.deepEqual(eventsFromSnapshot(snapshot(before), snapshot(after)), [{ type: 'PRACTICE_WRONG_THIRD' }]);
  assert.equal(applyAttempt(after, 0, question.answer, question, passage), after);
});

test('a correct answer before the limit marks success and emits celebration', () => {
  const before = initialPracticeState();
  const after = applyAttempt(before, 0, 'finite sequence of well-defined steps', question, passage);
  assert.equal(after.attempts[0].status, 'matched');
  assert.equal(after.attempts[0].correct, true);
  assert.equal(after.attempts[0].attempts, 1);
  assert.equal(after.attempts[0].explanationShown, false);
  assert.deepEqual(eventsFromSnapshot(snapshot(before), snapshot(after)), [{ type: 'PRACTICE_CORRECT' }]);
});

test('reset emits a calm practice event and clears attempts', () => {
  const answered = wrongAttempts(2);
  const reset = resetPractice();
  assert.deepEqual(reset.attempts, {});
  assert.deepEqual(eventsFromSnapshot(snapshot(answered), snapshot(reset)), [{ type: 'PRACTICE_RESET', baseline: 'focused' }]);
  const twoQuestions = applyAttempt(answered, 1, wrong, question, passage);
  const oneReset = resetAttempt(twoQuestions, 0);
  assert.equal(oneReset.attempts[0], undefined);
  assert.ok(oneReset.attempts[1]);
  assert.equal(oneReset.last.outcome, 'reset');
});

test('normalised comparison accepts exact and forgiving answers', () => {
  assert.equal(normaliseAnswer('  A finite, sequence—of steps! '), 'a finite sequence of steps');
  assert.equal(checkAnswer('a finite sequence of well-defined steps', question.answer).score, 1);
  assert.equal(checkAnswer('A finite sequence of steps', question.answer).match, true);
  assert.equal(checkAnswer(wrong, question.answer).match, false);
  assert.equal(checkAnswer('', question.answer).match, false);
  assert.ok(tokenise('ဒစ်ဂျစ်တယ် စာတတ်မြောက်မှုသည် အရေးကြီးသည်။').includes('ဒစ်ဂျစ်တယ်'));
});
