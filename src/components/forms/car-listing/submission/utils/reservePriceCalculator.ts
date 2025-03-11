
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for reserve price calculations
 * - 2024-06-19: Updated to use Supabase RPC function if available, with local fallback
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates reserve price based on the base price and percentage tier
 * @param priceX The base vehicle price
 * @returns The calculated reserve price
 */
export const calculateReservePrice = async (priceX: number): Promise<number> => {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('calculate_reserve_price', {
      p_base_price: priceX
    });

    if (error) {
      console.error('Error using database function for reserve price:', error);
      // Fall back to local calculation
      return calculateReservePriceLocal(priceX);
    }

    if (data === null) {
      console.warn('Database function returned null for reserve price calculation');
      // Fall back to local calculation
      return calculateReservePriceLocal(priceX);
    }

    return data;
  } catch (error) {
    console.error('Exception in reserve price calculation:', error);
    // Fall back to local calculation
    return calculateReservePriceLocal(priceX);
  }
};

/**
 * Local fallback implementation for reserve price calculation
 * This should match the logic in the database function
 */
const calculateReservePriceLocal = (priceX: number): number => {
  let percentageY: number;

  // Determine appropriate percentage based on price tier
  if (priceX <= 15000) {
    percentageY = 0.65;
  } else if (priceX <= 20000) {
    percentageY = 0.46;
  } else if (priceX <= 30000) {
    percentageY = 0.37;
  } else if (priceX <= 50000) {
    percentageY = 0.27;
  } else if (priceX <= 60000) {
    percentageY = 0.27;
  } else if (priceX <= 70000) {
    percentageY = 0.22;
  } else if (priceX <= 80000) {
    percentageY = 0.23;
  } else if (priceX <= 100000) {
    percentageY = 0.24;
  } else if (priceX <= 130000) {
    percentageY = 0.20;
  } else if (priceX <= 160000) {
    percentageY = 0.185;
  } else if (priceX <= 200000) {
    percentageY = 0.22;
  } else if (priceX <= 250000) {
    percentageY = 0.17;
  } else if (priceX <= 300000) {
    percentageY = 0.18;
  } else if (priceX <= 400000) {
    percentageY = 0.18;
  } else if (priceX <= 500000) {
    percentageY = 0.16;
  } else {
    percentageY = 0.145;
  }

  // Calculate reserve price: PriceX - (PriceX * PercentageY)
  return Math.round(priceX - (priceX * percentageY));
};
