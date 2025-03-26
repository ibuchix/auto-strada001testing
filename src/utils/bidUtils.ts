
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransactionType } from "@/services/supabase/transactionService";

export interface BidParams {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

export interface BidResponse {
  success: boolean;
  bidId?: string;
  error?: string;
  amount?: number;
}

export const placeBid = async (params: BidParams): Promise<BidResponse> => {
  try {
    const { carId, dealerId, amount, isProxy, maxProxyAmount } = params;

    // Call the place_bid function in Supabase
    const { data, error } = await supabase.rpc("place_bid", {
      p_car_id: carId,
      p_dealer_id: dealerId,
      p_amount: amount,
      p_is_proxy: isProxy || false,
      p_max_proxy_amount: maxProxyAmount,
    });

    if (error) {
      console.error("Error placing bid:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      bidId: data.bid_id,
      amount: data.amount,
    };
  } catch (error: any) {
    console.error("Exception placing bid:", error);
    toast.error("Failed to place bid");
    return {
      success: false,
      error: error.message || "An unknown error occurred",
    };
  }
};

export const getBidStatus = async (carId: string, dealerId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc("get_bid_status", {
      p_car_id: carId,
      p_dealer_id: dealerId,
    });

    if (error) {
      console.error("Error getting bid status:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error("Exception getting bid status:", error);
    return { success: false, error: error.message || "An unknown error occurred" };
  }
};
