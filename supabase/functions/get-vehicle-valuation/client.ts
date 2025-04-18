
/**
 * Supabase client creation for vehicle valuation
 * This file is intentionally kept separate but no longer used in the index.ts
 * to consolidate all imports in the main edge function file.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};
