
/**
 * Utility functions for vehicle valuation
 */

import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const calculateValuationChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const checksumContent = apiId + apiSecret + vin;
  return md5(checksumContent);
};

export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};
