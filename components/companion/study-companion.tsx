'use client';

import { StudyPet } from '../pet/index.ts';
import type { CompanionSnapshot, PetLocale } from '../../lib/pet/types.ts';

export function StudyCompanion({ snapshot, locale = 'en' }: { snapshot: CompanionSnapshot; locale?: PetLocale }) {
  return <StudyPet snapshot={snapshot} locale={locale} />;
}
