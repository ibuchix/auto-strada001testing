
// Edge function utilities for proxy bid processing
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string;
          current_bid: number | null;
          minimum_bid_increment: number;
          auction_end_time: string | null;
          auction_status: string | null;
        };
      };
      proxy_bids: {
        Row: {
          id: string;
          car_id: string;
          dealer_id: string;
          max_bid_amount: number;
          last_processed_amount: number | null;
        };
      };
      bids: {
        Row: {
          dealer_id: string;
          status: string | null;
        };
      };
    };
  };
}

