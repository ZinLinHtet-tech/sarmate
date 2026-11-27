import { durationFor, isTemporaryState, priorityOf } from './states.ts';
import type { CompanionSnapshot, PetEvent, PetRuntimeState, PetStateName, PracticeSignal } from './types.ts';

export function createPetState(now: number = Date.now(), initial: PetStateName = 'greeting'): PetRuntimeState {
  const temporary = isTemporaryState(initial);
  const duration = durationFor(initial);
  return {
    current: initial,
    previous: null,
    pulse: 0,
    temporary,
    expiresAt: temporary && duration > 0 ? now + duration : null,
  };
}

export function baselineState(snapshot: CompanionSnapshot): PetStateName {
  if (snapshot.tab === 'ask') return 'searching';
  if (snapshot.tab === 'practice') return 'focused';
  if (snapshot.hasGuide) return 'reading';
  return 'idle';
}

export function resolveState(event: PetEvent): PetStateName {
  switch (event.type) {
    case 'open': return 'greeting';
    case 'hide': return 'hidden';
    case 'show': return 'idle';
    case 'import': return 'uploading';
    case 'import-complete': return 'reading';
    case 'build-start': return 'thinking';
    case 'build-success': return 'reading';
    case 'error': return 'error';
    case 'tab': return event.tab === 'ask' ? 'searching' : event.tab === 'practice' ? 'focused' : 'reading';
    case 'answer':
      if (event.outcome === 'correct') return 'celebrating';
      return event.attempt >= 3 ? 'explaining' : event.attempt === 2 ? 'hinting' : 'encouraging';
    case 'PRACTICE_CORRECT': return 'celebrating';
    case 'PRACTICE_WRONG_FIRST': return 'encouraging';
    case 'PRACTICE_WRONG_SECOND': return 'hinting';
    case 'PRACTICE_WRONG_THIRD': return 'explaining';
    case 'PRACTICE_RESET': return event.baseline ?? 'focused';
    case 'evidence': return 'searching';
    case 'idle': return 'idle';
    case 'sleep': return 'sleeping';
    case 'reset': return 'idle';
    case 'expire': return event.baseline;
  }
}

function enter(state: PetRuntimeState, name: PetStateName, now: number, force: boolean): PetRuntimeState {
  const temporary = isTemporaryState(name);
  if (state.current === name && !temporary) return state;
  if (!force && state.temporary && priorityOf(state.current) > priorityOf(name)) return state;
  const duration = durationFor(name);
  return {
    current: name,
    previous: state.current,
    pulse: state.pulse + 1,
    temporary,
    expiresAt: temporary && duration > 0 ? now + duration : null,
  };
}

export function reducePetState(state: PetRuntimeState, event: PetEvent, now: number = Date.now()): PetRuntimeState {
  if (event.type === 'expire') {
    if (event.locked && (state.current === 'thinking' || state.current === 'uploading')) return state;
    if (event.now !== undefined && now < event.now) return state;
    return enter(state, event.baseline, now, true);
  }
  if (event.type === 'hide' || event.type === 'show' || event.type === 'reset' || event.type === 'PRACTICE_RESET' || event.type === 'build-success' || event.type === 'import-complete' || event.type === 'error') {
    return enter(state, resolveState(event), now, true);
  }
  if (event.type === 'idle' || event.type === 'sleep') {
    if (state.temporary) return state;
    return enter(state, resolveState(event), now, true);
  }
  return enter(state, resolveState(event), now, false);
}

export function applyEvents(state: PetRuntimeState, events: PetEvent[], now: number = Date.now()): PetRuntimeState {
  let next = state;
  for (const event of events) next = reducePetState(next, event, now);
  return next;
}

export function practiceEvent(previous: PracticeSignal, next: PracticeSignal, baseline: PetStateName): PetEvent | null {
  if (previous.outcome === next.outcome && previous.index === next.index && previous.attempt === next.attempt) return null;
  if (next.outcome === 'correct') return { type: 'PRACTICE_CORRECT' };
  if (next.outcome === 'reset') return { type: 'PRACTICE_RESET', baseline };
  if (next.outcome === 'wrong') {
    if (next.attempt === 1) return { type: 'PRACTICE_WRONG_FIRST' };
    if (next.attempt === 2) return { type: 'PRACTICE_WRONG_SECOND' };
    return { type: 'PRACTICE_WRONG_THIRD' };
  }
  return null;
}

export function eventsFromSnapshot(previous: CompanionSnapshot | null, next: CompanionSnapshot): PetEvent[] {
  if (!previous) return [{ type: 'open' }];
  const events: PetEvent[] = [];
  if (next.error && next.error !== previous.error) events.push({ type: 'error' });
  if (next.importing && !previous.importing) events.push({ type: 'import' });
  if (next.importCompleted > previous.importCompleted) events.push({ type: 'import-complete' });
  if (next.busy && !previous.busy) events.push({ type: 'build-start' });
  if (!next.busy && previous.busy && next.hasGuide && !next.error) events.push({ type: 'build-success' });
  const practice = practiceEvent(previous.practice, next.practice, baselineState(next));
  if (practice) events.push(practice);
  if (next.tab !== previous.tab) events.push({ type: 'tab', tab: next.tab });
  if (next.evidenceSearched && !previous.evidenceSearched) events.push({ type: 'evidence', found: next.evidenceCount > 0 });
  return events;
}
