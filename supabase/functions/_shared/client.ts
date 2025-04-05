
/**
 * Shared utility for creating a Supabase client
 * 
 * Updated: Using consistent Supabase client version across all functions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Create a Supabase client for edge functions
 * @returns Supabase client
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get a Supabase client instance
 * Shorthand for createSupabaseClient
 */
export function getSupabaseClient() {
  return createSupabaseClient();
}
