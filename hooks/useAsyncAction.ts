import { useCallback, useState } from 'react';

export function useAsyncAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    try {
      return await action(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { run, loading, error };
}
