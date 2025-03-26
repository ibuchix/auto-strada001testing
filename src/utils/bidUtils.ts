/**
 * Utility functions related to bid and auction behavior
 * Changes made:
 * - 2025-12-01: Fixed TransactionType import and usage
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Function to handle placing a bid
// Export the function to use in different contexts
export const handleBid = async (
  carId: string, 
  amount: number,
  onSuccess?: () => void
) => {
  const supabase = createClientComponentClient();
  let errorMessage = 'Failed to place bid';
  
  try {
    // Import with the correct path to use TransactionType as a value
    const { TransactionType } = await import('@/services/supabase/transactions/types');
    
    // Use the transaction service
    const { data, error } = await supabase
      .from('bids')
      .insert([{ car_id: carId, amount: amount }])
      .select()
      .single();
    
    if (error) {
      errorMessage = error.message || 'Failed to place bid due to database error';
      throw new Error(errorMessage);
    }
    
    if (onSuccess) {
      onSuccess();
    }
    
    return {
      success: true,
      message: 'Bid placed successfully'
    };
  } catch (error) {
    console.error('Error placing bid:', error);
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Function to determine if an auction has ended
export const isAuctionOver = (endTime: string | null): boolean => {
  if (!endTime) return false;
  return new Date(endTime) <= new Date();
};

// Function to format time remaining
export const formatTimeRemaining = (endTime: string | null): string => {
  if (!endTime) return "Auction Ended";

  const timeLeft = new Date(endTime).getTime() - new Date().getTime();

  if (timeLeft <= 0) {
    return "Auction Ended";
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  let formattedTime = "";

  if (days > 0) {
    formattedTime += `${days}d `;
  }

  formattedTime += `${hours}h ${minutes}m ${seconds}s`;

  return formattedTime;
};
