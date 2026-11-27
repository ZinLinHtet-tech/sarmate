export type PetStateName =
  | 'hidden'
  | 'greeting'
  | 'idle'
  | 'reading'
  | 'focused'
  | 'thinking'
  | 'uploading'
  | 'celebrating'
  | 'encouraging'
  | 'hinting'
  | 'explaining'
  | 'searching'
  | 'error'
  | 'sleeping';

export type PetAnimationKey = 'none' | 'wave' | 'idle' | 'read' | 'think' | 'carry' | 'jump' | 'nod' | 'wink' | 'point' | 'search' | 'confused' | 'rest';
export type PetLocale = 'en' | 'my';
export type PetMessage = { en: string; my: string };
export type PetPriority = number;

export type PetStateDefinition = {
  name: PetStateName;
  animation: PetAnimationKey;
  message?: PetMessage;
  durationMs: number;
  priority: PetPriority;
  persistent: boolean;
};

export type PetRuntimeState = {
  current: PetStateName;
  previous: PetStateName | null;
  pulse: number;
  temporary: boolean;
  expiresAt: number | null;
};

export type PetTab = 'notes' | 'practice' | 'ask';

export type PetContext = {
  tab: PetTab;
  hasGuide: boolean;
  busy: boolean;
  importing: boolean;
  error: boolean;
};

export type CompanionSnapshot = {
  tab: PetTab;
  busy: boolean;
  importing: boolean;
  error: string;
  hasGuide: boolean;
  importCompleted: number;
  practice: { index: number; attempt: number; outcome: 'correct' | 'wrong' | 'reset' | null };
  evidenceSearched: boolean;
  evidenceCount: number;
};

export type PracticeSignal = CompanionSnapshot['practice'];

export type PetEvent =
  | { type: 'open' }
  | { type: 'hide' }
  | { type: 'show' }
  | { type: 'import' }
  | { type: 'import-complete' }
  | { type: 'build-start' }
  | { type: 'build-success' }
  | { type: 'error' }
  | { type: 'tab'; tab: PetTab }
  | { type: 'answer'; outcome: 'correct' | 'wrong'; attempt: number }
  | { type: 'PRACTICE_CORRECT' }
  | { type: 'PRACTICE_WRONG_FIRST' }
  | { type: 'PRACTICE_WRONG_SECOND' }
  | { type: 'PRACTICE_WRONG_THIRD' }
  | { type: 'PRACTICE_RESET'; baseline?: PetStateName }
  | { type: 'evidence'; found: boolean }
  | { type: 'idle' }
  | { type: 'sleep' }
  | { type: 'reset' }
  | { type: 'expire'; baseline: PetStateName; locked: boolean; now?: number };
