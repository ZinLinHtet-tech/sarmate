export type VisibilityDocument = {
  visibilityState: string;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
};

export function createVisibilitySubscription(source?: VisibilityDocument | null) {
  const getSnapshot = (): 'visible' | 'hidden' => source?.visibilityState === 'hidden' ? 'hidden' : 'visible';
  const subscribe = (listener: () => void): (() => void) => {
    source?.addEventListener('visibilitychange', listener);
    return () => source?.removeEventListener('visibilitychange', listener);
  };
  return { subscribe, getSnapshot };
}

export function browserVisibilityDocument(): VisibilityDocument | null {
  if (typeof document === 'undefined') return null;
  return document as unknown as VisibilityDocument;
}
