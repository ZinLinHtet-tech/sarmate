'use client';

import { useMemo } from 'react';
import type { PracticeState } from '../lib/practice.ts';
import type { CompanionSnapshot, PetTab } from '../lib/pet/types.ts';

export type StudyPetSnapshotInput = {
  tab: PetTab;
  busy: boolean;
  importing: boolean;
  error: string;
  hasGuide: boolean;
  importCompleted: number;
  practice: PracticeState['last'];
  evidenceSearched: boolean;
  evidenceCount: number;
};

export function useStudyPetSnapshot(input: StudyPetSnapshotInput): CompanionSnapshot {
  const { tab, busy, importing, error, hasGuide, importCompleted, practice, evidenceSearched, evidenceCount } = input;
  return useMemo<CompanionSnapshot>(() => ({
    tab,
    busy,
    importing,
    error,
    hasGuide,
    importCompleted,
    practice,
    evidenceSearched,
    evidenceCount,
  }), [tab, busy, importing, error, hasGuide, importCompleted, practice, evidenceSearched, evidenceCount]);
}
