
/**
 * BidForm Component
 * Created: 2025-06-16 
 * 
 * Form for placing bids on vehicle auctions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { TransactionStatus, TransactionType } from "@/services/supabase/transactions/types";

interface BidFormProps {
  carId: string;
  currentBid: number;
  onBidPlaced?: (amount: number) => void;
}

export const BidForm = ({ carId, currentBid, onBidPlaced }: BidFormProps) => {
  const [bidAmount, setBidAmount] = useState<number>(currentBid + 100);
  const [status, setStatus] = useState<TransactionStatus | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  
  // Minimum increment values
  const getMinIncrement = (currentBid: number) => {
    if (currentBid < 5000) return 100;
    if (currentBid < 20000) return 250;
    if (currentBid < 50000) return 500;
    return 1000;
  };
  
  const minBid = currentBid + getMinIncrement(currentBid);
  
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.valueAsNumber || 0);
    setError(null);
  };
  
  const validateBid = () => {
    if (bidAmount < minBid) {
      setError(`Bid must be at least ${minBid} PLN`);
      return false;
    }
    
    return true;
  };
  
  const incrementBid = () => {
    setBidAmount(prevBid => {
      const increment = getMinIncrement(prevBid);
      return prevBid + increment;
    });
    setError(null);
  };
  
  const decrementBid = () => {
    setBidAmount(prevBid => {
      const newAmount = prevBid - getMinIncrement(currentBid);
      return newAmount >= minBid ? newAmount : minBid;
    });
    setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBid()) {
      return;
    }
    
    try {
      setStatus(TransactionStatus.PENDING);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success handling
      setStatus(TransactionStatus.SUCCESS);
      toast.success(`Bid of ${bidAmount} PLN placed successfully`);
      
      if (onBidPlaced) {
        onBidPlaced(bidAmount);
      }
      
      // Reset after success
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
      
    } catch (error) {
      setStatus(TransactionStatus.ERROR);
      setError("Failed to place bid. Please try again.");
      toast.error("Bid Failed", {
        description: "There was an error placing your bid. Please try again."
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="bidAmount">Your Bid (PLN)</Label>
          <span className="text-sm text-gray-500">
            Minimum: {minBid} PLN
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={decrementBid}
            disabled={status === TransactionStatus.PENDING}
          >
            -
          </Button>
          
          <Input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={handleBidAmountChange}
            min={minBid}
            step={getMinIncrement(currentBid)}
            disabled={status === TransactionStatus.PENDING}
            className="text-center"
          />
          
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={incrementBid}
            disabled={status === TransactionStatus.PENDING}
          >
            +
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-1">
            {error}
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-[#DC143C] hover:bg-[#DC143C]/80 text-white"
        disabled={Boolean(error) || status === TransactionStatus.PENDING}
      >
        {status === TransactionStatus.PENDING && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {status === TransactionStatus.SUCCESS && (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {status === TransactionStatus.ERROR && (
          <AlertCircle className="mr-2 h-4 w-4" />
        )}
        Place Bid
      </Button>
    </form>
  );
};
