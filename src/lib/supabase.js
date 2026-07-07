import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createFallbackClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
    signOut: async () => ({ error: null })
  }
});

let client = null;

export const getSupabaseClient = () => {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      client = createFallbackClient();
    } else {
      client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
  }
  return client;
};

export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data?.user ?? null;
};

export const redirectTo = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
};

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event('auth:changed'));
};
