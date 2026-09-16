import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

// When env vars are missing (e.g. local checkout before setup), export a
// throwing stub instead of crashing at import time so the app can render a
// clear "configure Supabase" screen.
export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
          );
        },
      },
    ) as ReturnType<typeof createClient>);
