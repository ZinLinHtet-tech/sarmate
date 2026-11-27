import type { PetStateName } from './pet/types.ts';

export type FrameName = 'idle' | 'read' | 'think' | 'carry' | 'search' | 'happy' | 'sad' | 'sleep';

export type PetManifest = {
  format: string;
  tile: number;
  scale: number;
  sheet: string | null;
  palette: Record<string, string>;
  moodFrame: Record<PetStateName, FrameName>;
  frames: Record<FrameName, { rows: string }>;
};

export const petManifest: PetManifest = {
  format: 'sarmate-pet/1',
  tile: 12,
  scale: 3,
  sheet: null,
  palette: { o: '#182c29', g: '#23664f', l: '#dcec9c', w: '#f7f9f7', p: '#f2b8a2', y: '#e6c15a' },
  moodFrame: {
    hidden: 'idle', greeting: 'happy', idle: 'idle', reading: 'read', focused: 'read',
    thinking: 'think', uploading: 'carry', celebrating: 'happy', encouraging: 'idle',
    hinting: 'think', explaining: 'read', searching: 'search', error: 'sad', sleeping: 'sleep',
  },
  frames: {
    idle: { rows: '.o........o./.oo......oo./.ogg....ggo./.oggggggggo./.oglggglggo./.ogggpgggo../.oggggggggo./..ogwwwwgo../..ogwwwwgo../..oggggggo../...o....o.../..oo....oo..' },
    read: { rows: '.o........o./.oo......oo./.ogg....ggo./.oggggggggo./.oggggggggo./.ogggpgggo../.oggggggggo./..oglllggo../..oglllggo../..oggggggo../...o....o.../..oo....oo..' },
    think: { rows: '.o.......yo./.oo......oo./.ogg....ggo./.oggggggggo./.ogglgggggo./.ogggpgggo../.oggggggggo./..ogwwwwgo../..ogwwwwgo../..oggggggo../...o....o.../..oo....oo..' },
    carry: { rows: '.o........o./.oo......oo./.ogg....ggo./.oggggggggo./.oglggglggo./.ogggpgggo.o/.oggggggggoo/..ogwwwwgoow/..ogwwwwgoow/..oggggggo../...o....o.../..oo....oo..' },
    search: { rows: '.o........o./.oo......oo./.ogg....ggo./.oggggggggo./.oglygglggo./.ogggpgggo../.oggggggggo./..ogwwwwgo.y/..ogwwwwgo.y/..oggggggo../...o....o.../..oo....oo..' },
    happy: { rows: '.o..y....yo./.oo......oo./.ogg....ggo./.oggggggggo./.ogygggyggo./.ogggpgggo../.oggwwwgggo./..ogwwwwgo../..ogwwwwgo../..oggggggo../...o....o.../..oo....oo..' },
    sad: { rows: '.o........o./.oo......oo./.ogg....ggo./.oggggggggo./.oggggggggo./.oggglggggo./.oggwoowggo./..ogwwwwgo../..ogwwwwgo../..oggggggo../...o....o.../..oo....oo..' },
    sleep: { rows: '.o.....y..o./.oo......oo./.ogg....ggo./.oggggggggo./.oggggggggo./.ogggpgggo../.oggggggggo./..ogwwwwgo../..ogwwwwgo../..oggggggo../...o....o.../..oo....oo..' },
  },
};

export function frameRows(frame: FrameName): string[] {
  const source = petManifest.frames[frame] || petManifest.frames.idle;
  return source.rows.split('/');
}

export function frameForState(state: PetStateName): FrameName {
  return petManifest.moodFrame[state] || 'idle';
}

export function validateManifest(manifest: PetManifest): string[] {
  const problems: string[] = [];
  if (manifest.format !== 'sarmate-pet/1') problems.push('Unsupported manifest format.');
  if (manifest.sheet !== null) problems.push('Only the built-in fallback renderer is supported.');
  const names = Object.keys(manifest.frames) as FrameName[];
  for (const name of names) {
    const rows = manifest.frames[name].rows.split('/');
    if (rows.length !== manifest.tile) problems.push(`${name}: expected ${manifest.tile} rows.`);
    for (const row of rows) {
      if (row.length !== manifest.tile) problems.push(`${name}: row width must be ${manifest.tile}.`);
      for (const cell of row) {
        if (cell !== '.' && !manifest.palette[cell]) problems.push(`${name}: unknown palette key ${cell}.`);
      }
    }
  }
  for (const state of Object.keys(manifest.moodFrame) as PetStateName[]) {
    if (!names.includes(manifest.moodFrame[state])) problems.push(`${state}: missing frame mapping.`);
  }
  return problems;
}
