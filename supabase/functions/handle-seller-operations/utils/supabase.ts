
/**
 * Supabase client creation utility
 * Updated: 2025-06-01 - Fixed import path to use local database types
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from './database.types.ts';

/**
 * Create a Supabase client with proper typing
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}
