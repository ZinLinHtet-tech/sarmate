import type { Passage } from './study.ts';

export type PracticeStatus = 'idle' | 'retry' | 'hint' | 'explained' | 'matched';
export type PracticeAttempt = {
  index: number;
  status: PracticeStatus;
  attempts: number;
  input: string;
  correct: boolean;
  matched: string[];
  hint: string | null;
  hintShown: boolean;
  explanation: string | null;
  explanationShown: boolean;
  answerShown: boolean;
};
export type PracticeState = {
  attempts: Record<number, PracticeAttempt>;
  last: { index: number; attempt: number; outcome: 'correct' | 'wrong' | 'reset' | null };
};
export type PracticeQuestion = { prompt: string; answer: string; passageId: string };

export const MAX_ATTEMPTS = 3;

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'it', 'its', 'this', 'that', 'by', 'as', 'at', 'from', 'into', 'be', 'been', 'being', 'do', 'does', 'did', 'how', 'what', 'why', 'when', 'which', 'who', 'can', 'could', 'should', 'would', 'may', 'might', 'not', 'no', 'yes',
  'သည်', 'ဖြစ်သည်', 'ဖြစ်တယ်', 'သော', 'က', 'ကို', 'မှာ', 'နှင့်', 'နဲ့', 'တစ်', 'တစ်ခု', 'အတွက်', 'ရန်', 'လည်း', 'ဒါ', 'ဒီ', 'အ', 'ကြ', 'ပါ', 'တယ်', 'မ', 'ရှိ', 'ရှိသည်',
]);

export function tokenise(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter(token => token.length > 1 && !STOP.has(token)))];
}

export function normaliseAnswer(text: string): string {
  return text.toLowerCase().replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/gu, ' ').trim();
}

export function checkAnswer(input: string, reference: string): { match: boolean; score: number; matched: string[] } {
  const expected = tokenise(reference);
  const provided = tokenise(input);
  if (!expected.length || !provided.length) return { match: false, score: 0, matched: [] };
  if (normaliseAnswer(input) === normaliseAnswer(reference)) return { match: true, score: 1, matched: expected };
  const matched = expected.filter(token => provided.includes(token));
  const score = matched.length / expected.length;
  return { match: score >= 0.6, score, matched };
}

export function makeHint(reference: string, passage?: Passage): string {
  const words = tokenise(reference).filter(word => word.length > 3).slice(0, 2);
  if (!words.length) return 'Look again at the cited passage.';
  return passage ? `Check ${passage.id}: look for “${words.join('” and “')}”.` : `Look for: ${words.join(' and ')}.`;
}

export function makeExplanation(reference: string, passage?: Passage): string {
  const source = passage ? ` From ${passage.id}: ${passage.text.slice(0, 300)}` : '';
  return `Reference answer: ${reference}.${source}`;
}

export function initialPracticeState(): PracticeState {
  return { attempts: {}, last: { index: -1, attempt: 0, outcome: null } };
}

export function resetPractice(): PracticeState {
  return { attempts: {}, last: { index: -1, attempt: 0, outcome: 'reset' } };
}

export function resetAttempt(state: PracticeState, index: number): PracticeState {
  if (!state.attempts[index]) return state;
  const attempts = { ...state.attempts };
  delete attempts[index];
  return { attempts, last: { index, attempt: 0, outcome: 'reset' } };
}

export function applyAttempt(
  state: PracticeState,
  index: number,
  input: string,
  question: PracticeQuestion,
  passage?: Passage,
): PracticeState {
  const current = state.attempts[index];
  if (current && (current.status === 'matched' || current.status === 'explained')) return state;
  const attempt = (current?.attempts || 0) + 1;
  const result = checkAnswer(input, question.answer);
  const status: PracticeStatus = result.match ? 'matched' : attempt >= MAX_ATTEMPTS ? 'explained' : attempt === 2 ? 'hint' : 'retry';
  const hint = status === 'hint' ? makeHint(question.answer, passage) : null;
  const explanation = status === 'explained' ? makeExplanation(question.answer, passage) : null;
  const entry: PracticeAttempt = {
    index,
    status,
    attempts: attempt,
    input,
    correct: result.match,
    matched: result.matched,
    hint,
    hintShown: hint !== null,
    explanation,
    explanationShown: explanation !== null,
    answerShown: explanation !== null,
  };
  return {
    attempts: { ...state.attempts, [index]: entry },
    last: { index, attempt, outcome: result.match ? 'correct' : 'wrong' },
  };
}

export function feedbackTitle(status: PracticeStatus): string {
  if (status === 'matched') return 'Nice work — that looks supported.';
  if (status === 'hint') return 'Here is a small hint.';
  if (status === 'explained') return 'Here is the answer and a short explanation.';
  return 'Not quite — try once more.';
}
