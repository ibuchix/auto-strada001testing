
/**
 * Changes made:
 * - Fixed TransactionType import and usage
 * - Updated to use proper transaction error handling
 * - Fixed executeTransaction function call to match expected parameters
 * - Fixed type conversion for BidStatusIndicator
 */
import { useState } from "react";
import { useAuctionTransaction } from "@/hooks/useAuctionTransaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeBid } from "@/utils/bidUtils";
import { toast } from "sonner";
import { TransactionType } from "@/services/supabase/transactions/types";
import { BidStatusIndicator } from "./BidStatusIndicator";

// Define the BidResponse type here since it was missing from bidUtils
export interface BidResponse {
  success: boolean;
  error?: string;
  message?: string;
  bidId?: string;
  amount?: number;
}

interface BidFormProps {
  carId: string;
  dealerId: string;
  minBid: number;
  currentBid?: number;
  onBidSuccess?: (bid: { amount: number; bidId: string }) => void;
}

export const BidForm = ({
  carId,
  dealerId,
  minBid,
  currentBid,
  onBidSuccess
}: BidFormProps) => {
  const [bidAmount, setBidAmount] = useState<number>(
    currentBid ? currentBid + 500 : minBid
  );
  const [useProxyBidding, setUseProxyBidding] = useState(false);
  const [maxProxyAmount, setMaxProxyAmount] = useState<number>(
    currentBid ? currentBid + 2000 : minBid + 2000
  );
  
  const { executeTransaction, isLoading, transactionStatus } = useAuctionTransaction();

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bidAmount < minBid) {
      toast.error("Bid amount must be at least the minimum bid");
      return;
    }
    
    if (useProxyBidding && maxProxyAmount <= bidAmount) {
      toast.error("Maximum proxy amount must be higher than your bid");
      return;
    }
    
    try {
      // Fix for error 1: Pass correct parameters to executeTransaction
      const result = await executeTransaction(
        "Place Bid",
        async () => {
          const bidResult = await placeBid({
            carId,
            dealerId,
            amount: bidAmount,
            isProxy: useProxyBidding,
            maxProxyAmount: useProxyBidding ? maxProxyAmount : undefined
          });
          
          if (!bidResult.success) {
            throw new Error(bidResult.error || "Failed to place bid");
          }
          
          if (onBidSuccess && bidResult.bid_id) {
            onBidSuccess({
              amount: bidResult.amount || bidAmount,
              bidId: bidResult.bid_id
            });
          }
          
          return bidResult;
        },
        { 
          description: "Placing bid on auction",
          metadata: { bidAmount, useProxyBidding }
        }
      );
      
      if (result?.success) {
        setBidAmount(result.amount || 0);
      }
      
    } catch (error) {
      console.error("Bid error:", error);
    }
  };

  // Fix for error 2: Convert transactionStatus to BidStatus type
  const getBidStatus = (): 'pending' | 'active' | null => {
    if (!transactionStatus) return null;
    
    switch(transactionStatus) {
      case 'pending': return 'pending';
      case 'success': return 'active';
      default: return null;
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-md">
      <BidStatusIndicator status={getBidStatus()} />
      
      <form onSubmit={handleBidSubmit} className="space-y-4">
        <div>
          <label htmlFor="bidAmount" className="block text-sm font-medium mb-1">
            Your Bid (PLN)
          </label>
          <Input
            id="bidAmount"
            type="number"
            min={minBid}
            step={100}
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            disabled={isLoading}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum bid: {minBid.toLocaleString()} PLN
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            id="proxyBidding"
            type="checkbox"
            checked={useProxyBidding}
            onChange={(e) => setUseProxyBidding(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="proxyBidding" className="ml-2 block text-sm text-gray-700">
            Use proxy bidding
          </label>
        </div>
        
        {useProxyBidding && (
          <div>
            <label htmlFor="maxProxyAmount" className="block text-sm font-medium mb-1">
              Maximum Proxy Amount (PLN)
            </label>
            <Input
              id="maxProxyAmount"
              type="number"
              min={bidAmount + 100}
              step={100}
              value={maxProxyAmount}
              onChange={(e) => setMaxProxyAmount(Number(e.target.value))}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              The system will bid automatically for you up to this amount
            </p>
          </div>
        )}
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#DC143C] hover:bg-[#b01031]"
        >
          {isLoading ? "Placing Bid..." : "Place Bid"}
        </Button>
      </form>
    </div>
  );
};
