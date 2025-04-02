
/**
 * Shared Supabase client for edge functions
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export function getSupabaseClient() {
  // Initialize Supabase client with service role (for elevated permissions in functions)
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    {
      auth: {
        persistSession: false
      }
    }
  );
}
