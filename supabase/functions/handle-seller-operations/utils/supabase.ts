
/**
 * Supabase client creation utility
 * Created: 2025-06-01
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../../_shared/database.types.ts';

/**
 * Create a Supabase client with proper typing
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}
