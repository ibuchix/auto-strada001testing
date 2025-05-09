
/**
 * Supabase utilities for handle-seller-operations
 * Created: 2025-04-19 - Extracted from utils.ts
 * Updated: 2025-04-23 - Fixed to use local database.types.ts import for edge function deployment
 */

import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from './database.types.ts';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
}
