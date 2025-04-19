
/**
 * Supabase client utilities
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logError } from "./logging.ts";

export function createSupabaseClient() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    logError(error, { context: 'createSupabaseClient' });
    throw error;
  }
}

