'use client';

import { useDocumentVisible } from '../../hooks/use-document-visible.ts';
import { usePetController } from '../../hooks/use-pet-controller.ts';
import { usePetPreferences } from '../../hooks/use-pet-preferences.ts';
import { stateLabel } from '../../lib/pet/dialogue.ts';
import { DEFAULT_SPRITE_MANIFEST_PATH } from '../../lib/pet/sprite-assets.ts';
import type { CompanionSnapshot, PetLocale } from '../../lib/pet/types.ts';
import { PetControls } from './PetControls.tsx';
import { PetSpeechBubble } from './PetSpeechBubble.tsx';
import { PetSprite } from './PetSprite.tsx';

export type StudyPetProps = {
  snapshot?: CompanionSnapshot | null;
  locale?: PetLocale;
  className?: string;
  manifestSrc?: string;
};

export function StudyPet({ snapshot, locale = 'en', className = '', manifestSrc = DEFAULT_SPRITE_MANIFEST_PATH }: StudyPetProps) {
  const { state, dispatch, reducedMotion, animation, message } = usePetController(snapshot);
  const { hidden, muted, toggleHidden, toggleMuted } = usePetPreferences();
  const documentVisible = useDocumentVisible();

  if (hidden) {
    return <PetControls hidden muted={muted} onToggleHidden={toggleHidden} onToggleMuted={toggleMuted} />;
  }

  return (
    <aside id="sarmate-pet" className={`pet-card pet-card--${state.current}${className ? ` ${className}` : ''}`} aria-label="Study companion">
      <PetControls hidden={false} muted={muted} onToggleHidden={toggleHidden} onToggleMuted={toggleMuted} bodyId="sarmate-pet-body" />
      <div id="sarmate-pet-body" className="pet-body">
        <PetSpeechBubble message={muted ? null : message} locale={locale} visible={state.temporary} />
        <PetSprite state={state.current} animation={animation} reducedMotion={reducedMotion} paused={!documentVisible} manifestSrc={manifestSrc} onClick={() => dispatch({ type: 'open' })} />
        <span className="pet-state-label" lang={locale === 'my' ? 'my' : 'en'}><span aria-hidden="true">✦</span> {stateLabel(state.current, locale)}</span>
        <span className="pet-name">Mate · study pal</span>
      </div>
    </aside>
  );
}
