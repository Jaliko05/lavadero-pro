import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for periodic data fetching with cleanup.
 * @param {Function} fetchFn - Async function to call
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling is active
 */
export function usePolling(fetchFn, intervalMs = 15000, enabled = true) {
  const savedCallback = useRef(fetchFn);

  useEffect(() => {
    savedCallback.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    savedCallback.current();

    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
