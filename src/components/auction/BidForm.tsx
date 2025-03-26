
/**
 * Changes made:
 * - 2024-08-04: Fixed TransactionStatus import
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { TransactionStateIndicator } from "@/components/transaction/TransactionStateIndicator";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { placeBid } from "@/services/supabase/bidService";
import { currencyFormat } from "@/utils/formatters";

interface BidFormProps {
  carId: string;
  currentBid: number;
  minBidIncrement: number;
  reserveMet: boolean;
  reservePrice?: number;
  onBidPlaced?: () => void;
}

export const BidForm = ({
  carId,
  currentBid,
  minBidIncrement,
  reserveMet,
  reservePrice,
  onBidPlaced
}: BidFormProps) => {
  // Form state
  const [bidAmount, setBidAmount] = useState<number>(currentBid + minBidIncrement);
  const [isProxyBid, setIsProxyBid] = useState<boolean>(false);
  const [maxProxyAmount, setMaxProxyAmount] = useState<number>(currentBid + minBidIncrement * 4);
  const [bidStrategy, setBidStrategy] = useState<'standard' | 'aggressive' | 'conservative'>('standard');
  
  // Transaction state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update bid amount when current bid changes
  useEffect(() => {
    setBidAmount(currentBid + minBidIncrement);
    setMaxProxyAmount(currentBid + minBidIncrement * 4);
  }, [currentBid, minBidIncrement]);
  
  // Calculate suggested bid amounts based on strategy
  const getSuggestedAmount = () => {
    switch (bidStrategy) {
      case 'conservative':
        return currentBid + minBidIncrement;
      case 'standard':
        return currentBid + minBidIncrement * 2;
      case 'aggressive':
        return currentBid + minBidIncrement * 4;
      default:
        return currentBid + minBidIncrement;
    }
  };
  
  // Update bid amount when strategy changes
  useEffect(() => {
    setBidAmount(getSuggestedAmount());
  }, [bidStrategy]);
  
  // Function to handle bid submission
  const handleSubmitBid = async () => {
    // Validate bid amount
    if (bidAmount <= currentBid) {
      toast.error('Bid must be higher than current bid', {
        description: `Please enter a bid amount higher than ${currencyFormat(currentBid)}`
      });
      return;
    }
    
    if (bidAmount % minBidIncrement !== 0) {
      toast.error('Invalid bid increment', {
        description: `Bid must be in increments of ${currencyFormat(minBidIncrement)}`
      });
      return;
    }
    
    if (isProxyBid && maxProxyAmount <= bidAmount) {
      toast.error('Invalid max proxy amount', {
        description: 'Maximum proxy amount must be higher than your initial bid'
      });
      return;
    }
    
    // Start submission process
    setIsSubmitting(true);
    setTransactionStatus(TransactionStatus.PENDING);
    setError(null);
    
    try {
      const result = await placeBid({
        carId,
        amount: bidAmount,
        isProxy: isProxyBid,
        maxProxyAmount: isProxyBid ? maxProxyAmount : undefined
      });
      
      if (result.success) {
        setTransactionStatus(TransactionStatus.SUCCESS);
        toast.success('Bid placed successfully', {
          description: isProxyBid 
            ? `Your bid of ${currencyFormat(bidAmount)} with maximum of ${currencyFormat(maxProxyAmount)} was placed` 
            : `Your bid of ${currencyFormat(bidAmount)} was placed`
        });
        
        // Call onBidPlaced callback if provided
        if (onBidPlaced) {
          onBidPlaced();
        }
      } else {
        setTransactionStatus(TransactionStatus.ERROR);
        setError(result.error || 'Failed to place bid');
        toast.error('Failed to place bid', {
          description: result.error || 'Please try again'
        });
      }
    } catch (err: any) {
      setTransactionStatus(TransactionStatus.ERROR);
      setError(err.message || 'Failed to place bid');
      toast.error('Error placing bid', {
        description: err.message || 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Place Your Bid</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!reserveMet && reservePrice && (
            <div className="text-sm p-2 bg-yellow-50 text-yellow-700 rounded-md">
              <p>Reserve price not yet met. Current bids have not reached the seller's minimum price.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="bidStrategy">Bidding Strategy</Label>
            <RadioGroup 
              id="bidStrategy" 
              value={bidStrategy} 
              onValueChange={(value) => setBidStrategy(value as any)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conservative" id="conservative" />
                <Label htmlFor="conservative" className="cursor-pointer">Conservative</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="cursor-pointer">Standard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aggressive" id="aggressive" />
                <Label htmlFor="aggressive" className="cursor-pointer">Aggressive</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid Amount</Label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={currentBid + minBidIncrement}
                step={minBidIncrement}
                disabled={isSubmitting}
                className="pl-8"
              />
              <span className="absolute left-3 top-2.5 text-gray-500">₤</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum bid: {currencyFormat(currentBid + minBidIncrement)}
            </p>
          </div>
          
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="proxyBid" 
              checked={isProxyBid} 
              onCheckedChange={(checked) => setIsProxyBid(checked as boolean)} 
              disabled={isSubmitting}
            />
            <div className="grid gap-1.5 leading-none">
              <Label 
                htmlFor="proxyBid" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use Proxy Bidding
              </Label>
              <p className="text-xs text-muted-foreground">
                Set a maximum amount and the system will bid automatically for you up to that amount.
              </p>
            </div>
          </div>
          
          {isProxyBid && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="maxProxyAmount">Maximum Bid Amount</Label>
              <div className="relative">
                <Input
                  id="maxProxyAmount"
                  type="number"
                  value={maxProxyAmount}
                  onChange={(e) => setMaxProxyAmount(Number(e.target.value))}
                  min={bidAmount + minBidIncrement}
                  step={minBidIncrement}
                  disabled={isSubmitting}
                  className="pl-8"
                />
                <span className="absolute left-3 top-2.5 text-gray-500">₤</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the maximum amount you're willing to pay. Your initial bid will still be {currencyFormat(bidAmount)}.
              </p>
              
              <Slider
                value={[maxProxyAmount]}
                min={bidAmount + minBidIncrement}
                max={bidAmount * 2}
                step={minBidIncrement}
                onValueChange={([value]) => setMaxProxyAmount(value)}
                disabled={isSubmitting}
              />
            </div>
          )}
          
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmitBid}
            disabled={isSubmitting}
          >
            {isProxyBid 
              ? `Bid ${currencyFormat(bidAmount)} with max ${currencyFormat(maxProxyAmount)}`
              : `Bid ${currencyFormat(bidAmount)}`
            }
          </Button>
          
          {transactionStatus && (
            <div className="flex justify-center mt-2">
              <TransactionStateIndicator 
                status={transactionStatus} 
                pendingText="Processing your bid..." 
                successText="Bid placed successfully!"
                errorText="Failed to place bid"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
