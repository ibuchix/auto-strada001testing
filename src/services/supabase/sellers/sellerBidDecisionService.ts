
/**
 * Backend service for seller bid decision actions (accept/decline) after auction.
 * Created: 2025-06-15
 */

import { supabase } from "@/integrations/supabase/client";

// Types for decision
export type SellerBidDecision = {
  id: string;
  car_id: string;
  auction_result_id: string | null;
  seller_id: string;
  decision: "accepted" | "declined";
  decided_at: string;
  highest_bid: number | null;
  highest_bid_dealer_id: string | null;
  created_at: string;
  updated_at: string;
};

// Record a seller's decision (accept/decline)
// Returns: { data, error }
async function recordDecision({
  car_id,
  auction_result_id,
  seller_id,
  decision,
  highest_bid,
  highest_bid_dealer_id,
}: {
  car_id: string;
  auction_result_id?: string | null;
  seller_id: string;
  decision: "accepted" | "declined";
  highest_bid?: number | null;
  highest_bid_dealer_id?: string | null;
}) {
  const { data, error } = await supabase
    .from("seller_bid_decisions")
    .insert([
      {
        car_id,
        auction_result_id: auction_result_id || null,
        seller_id,
        decision,
        highest_bid: highest_bid ?? null,
        highest_bid_dealer_id: highest_bid_dealer_id ?? null,
      },
    ])
    .select()
    .single();

  return { data: data as SellerBidDecision | null, error };
}

// Fetch all bid decisions for the currently signed-in seller
async function fetchMyBidDecisions() {
  const { data, error } = await supabase
    .from("seller_bid_decisions")
    .select("*")
    .order("decided_at", { ascending: false });

  return { data: data as SellerBidDecision[], error };
}

// Fetch a decision for a specific car or auction
async function fetchDecisionForCar(car_id: string) {
  const { data, error } = await supabase
    .from("seller_bid_decisions")
    .select("*")
    .eq("car_id", car_id)
    .maybeSingle();

  return { data: data as SellerBidDecision | null, error };
}

// Service object
export const sellerBidDecisionService = {
  recordDecision,
  fetchMyBidDecisions,
  fetchDecisionForCar,
};
