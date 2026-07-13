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

const client = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout
  }
});

type QueryError = { message: string } | null;
type QueryResult<T> = { data: T | null; error: QueryError; count?: number | null };

type FlexibleQuery<T = any[]> = Promise<QueryResult<T>> & {
  select: (...args: any[]) => FlexibleQuery<T>;
  insert: (...args: any[]) => FlexibleQuery<any[]>;
  update: (...args: any[]) => FlexibleQuery<any[]>;
  upsert: (...args: any[]) => FlexibleQuery<any[]>;
  delete: (...args: any[]) => FlexibleQuery<any[]>;
  order: (...args: any[]) => FlexibleQuery<T>;
  limit: (...args: any[]) => FlexibleQuery<T>;
  range: (...args: any[]) => FlexibleQuery<T>;
  eq: (...args: any[]) => FlexibleQuery<T>;
  neq: (...args: any[]) => FlexibleQuery<T>;
  gt: (...args: any[]) => FlexibleQuery<T>;
  gte: (...args: any[]) => FlexibleQuery<T>;
  lt: (...args: any[]) => FlexibleQuery<T>;
  lte: (...args: any[]) => FlexibleQuery<T>;
  like: (...args: any[]) => FlexibleQuery<T>;
  ilike: (...args: any[]) => FlexibleQuery<T>;
  is: (...args: any[]) => FlexibleQuery<T>;
  in: (...args: any[]) => FlexibleQuery<T>;
  contains: (...args: any[]) => FlexibleQuery<T>;
  containedBy: (...args: any[]) => FlexibleQuery<T>;
  match: (...args: any[]) => FlexibleQuery<T>;
  not: (...args: any[]) => FlexibleQuery<T>;
  or: (...args: any[]) => FlexibleQuery<T>;
  filter: (...args: any[]) => FlexibleQuery<T>;
  single: () => FlexibleQuery<any>;
  maybeSingle: () => FlexibleQuery<any>;
};

type FlexibleSupabaseClient = Omit<typeof client, 'from'> & {
  from: (...args: Parameters<typeof client.from>) => FlexibleQuery;
};

export const supabase = client as FlexibleSupabaseClient;
