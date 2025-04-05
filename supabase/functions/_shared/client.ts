
/**
 * Shared Supabase client for edge functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "./database.types.ts";

export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};
