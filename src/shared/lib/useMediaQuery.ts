import { useSyncExternalStore } from 'react';

/** Client-only: SSR/hydration fallback is false. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
