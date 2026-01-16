/**
 * custom react hooks for API interactions
 * provides loading, error, and success state management
 */

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

/**
 * useApi Hook - Manage API call state
 * @example
 * const { data, loading, error, execute } = useApi(apiCall);
 * const handleClick = () => execute();
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null, success: false });
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null, success: true });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err, success: false });
        onError?.(err);
        throw err;
      }
    },
    [apiFunction, onSuccess, onError]
  );

  return {
    ...state,
    execute,
    reset: () => setState({ data: null, loading: false, error: null, success: false }),
  };
}

/**
 * useFetch Hook simple fetch wrapper
 * similar to useApi but for simple GET requests
 */
export function useFetch<T>(url: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const doFetch = useCallback(async (): Promise<T | undefined> => {
    if (!url) return;
    setState({ data: null, loading: true, error: null, success: false });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: T = await response.json();
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err, success: false });
      throw err;
    }
  }, [url]);

  return { ...state, refetch: doFetch };
}

/**
 * useLoading Hook simple loading state management
 */
export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        return await fn();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, setLoading, withLoading };
}

export default { useApi, useFetch, useLoading };
