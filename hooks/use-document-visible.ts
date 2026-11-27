'use client';

import { useSyncExternalStore } from 'react';
import { browserVisibilityDocument, createVisibilitySubscription } from '../lib/pet/visibility.ts';

const subscription = createVisibilitySubscription(browserVisibilityDocument());
const serverVisibility = (): 'visible' => 'visible';

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscription.subscribe, subscription.getSnapshot, serverVisibility) === 'visible';
}
