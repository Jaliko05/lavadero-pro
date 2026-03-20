import { useState, useCallback } from 'react';

/**
 * Hook for API calls with loading and error state management.
 * @param {Function} apiFn - API function to wrap
 * @returns {{ execute, data, loading, error }}
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, data, loading, error };
}
