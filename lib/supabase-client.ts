import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const requestTimeoutMs = 15000;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const sourceSignal = init.signal;

  const abortFromSource = () => controller.abort();
  if (sourceSignal?.aborted) controller.abort();
  else sourceSignal?.addEventListener('abort', abortFromSource, { once: true });

  try {
    return await fetch(input, {
      ...init,
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout
  }
});
