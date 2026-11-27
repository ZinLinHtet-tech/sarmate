'use client';

import { Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';

export type PetControlsProps = {
  hidden: boolean;
  muted: boolean;
  onToggleHidden: () => void;
  onToggleMuted: () => void;
  bodyId?: string;
};

export function PetControls({ hidden, muted, onToggleHidden, onToggleMuted, bodyId = 'sarmate-pet-body' }: PetControlsProps) {
  if (hidden) {
    return (
      <div className="pet-hidden-bar">
        <span id={bodyId} hidden />
        <button type="button" className="pet-control pet-control--show" onClick={onToggleHidden} aria-label="Show study companion" aria-controls={bodyId} aria-expanded={false} title="Show study companion"><Eye size={16}/> Show Mate</button>
        <button type="button" className="pet-control" onClick={onToggleMuted} aria-pressed={muted} aria-label={muted ? 'Unmute companion speech' : 'Mute companion speech'} title={muted ? 'Unmute speech' : 'Mute speech'}>
          {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
        </button>
      </div>
    );
  }

  return (
    <div className="pet-controls">
      <button type="button" className="pet-control" onClick={onToggleMuted} aria-pressed={muted} aria-label={muted ? 'Unmute companion speech' : 'Mute companion speech'} title={muted ? 'Unmute speech' : 'Mute speech'}>
        {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
      </button>
      <button type="button" className="pet-control" onClick={onToggleHidden} aria-label="Hide study companion" aria-controls={bodyId} aria-expanded={true} title="Hide study companion"><EyeOff size={14}/></button>
    </div>
  );
}
