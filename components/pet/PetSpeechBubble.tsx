'use client';

import type { PetLocale } from '../../lib/pet/types.ts';

export type PetSpeechBubbleProps = {
  message?: string | null;
  locale?: PetLocale;
  visible?: boolean;
};

export function PetSpeechBubble({ message, locale = 'en', visible = true }: PetSpeechBubbleProps) {
  if (!visible || !message) return null;
  return <div className="pet-bubble" aria-live="polite" aria-atomic="true"><span lang={locale === 'my' ? 'my' : 'en'}>{message}</span></div>;
}
