
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TRANSACTION_STATUS, TransactionType } from "@/services/supabase/transactionService";

export const placeBid = async (
  carId: string,
  amount: number,
  dealerId: string,
  executeTransaction: any
) => {
  return executeTransaction(
    "Place Bid",
    async () => {
      const { data, error } = await supabase.rpc("place_bid", {
        car_id: carId,
        dealer_id: dealerId,
        bid_amount: amount,
      });

      if (error) throw error;

      // Safely check data structure
      const result = data as any;
      
      if (result && (result.success === false || result.error)) {
        throw new Error(result.message || "Bid could not be placed");
      }

      return result;
    }
  );
};

export const getLatestBid = async (carId: string) => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("car_id", carId)
      .order("amount", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    
    // Safely handle bid data
    return {
      bid_id: data?.id,
      amount: data?.amount,
      timestamp: data?.created_at,
      dealer_id: data?.dealer_id
    };
  } catch (error) {
    console.error("Error fetching latest bid:", error);
    return null;
  }
};

export const getUserBids = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select(
        `
        id,
        amount,
        created_at,
        status,
        cars (
          id,
          title,
          make,
          model,
          year,
          auction_end_time,
          auction_status,
          current_bid
        )
      `
      )
      .eq("dealer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user bids:", error);
    return [];
  }
};
