
/**
 * Changes made:
 * - Updated placeBid function call
 * - Fixed type references for BidResponse
 * - Fixed TransactionType parameter passing
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { placeBid } from '@/utils/bidUtils';
import { useRealtimeBids } from '@/hooks/useRealtimeBids';
import { useAuth } from '@/components/AuthProvider';
import { TransactionStatusIndicator } from '@/components/transaction/TransactionStatusIndicator';
import { useAuctionTransaction } from '@/hooks/useAuctionTransaction';
import { TransactionType } from '@/services/supabase/transactions/types';
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().positive('Bid must be positive'),
  isProxy: z.boolean().default(false),
  maxProxyAmount: z.coerce.number().positive('Proxy bid must be positive').optional(),
});

type BidFormProps = {
  carId: string;
  currentBid: number;
  minBidIncrement: number;
  onBidPlaced?: () => void;
};

export const BidForm = ({ 
  carId, 
  currentBid, 
  minBidIncrement,
  onBidPlaced 
}: BidFormProps) => {
  const { executeTransaction, isLoading: isTransactionLoading, transactionStatus } = useAuctionTransaction();
  const { session } = useAuth();
  const { isConnected, reconnect } = useRealtimeBids();
  
  const minBid = currentBid + minBidIncrement;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: minBid,
      isProxy: false,
      maxProxyAmount: minBid,
    },
  });
  
  const isProxyBid = form.watch('isProxy');
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      return;
    }
    
    executeTransaction(
      "Place Bid",
      TransactionType.AUCTION,
      async () => {
        const result = await placeBid({
          carId,
          dealerId: session.user.id,
          amount: values.amount,
          isProxy: values.isProxy,
          maxProxyAmount: values.isProxy ? values.maxProxyAmount : undefined,
        });
        
        if (result.success) {
          form.reset({
            amount: values.amount + minBidIncrement,
            isProxy: false,
            maxProxyAmount: values.amount + minBidIncrement,
          });
          
          if (onBidPlaced) {
            onBidPlaced();
          }
        }
        
        return result;
      },
      {
        description: `Bid of ${values.amount} PLN ${values.isProxy ? '(Proxy)' : ''}`
      }
    );
  };
  
  const isSubmitting = isTransactionLoading;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bid</CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} />
              <p className="font-medium">Realtime connection lost</p>
            </div>
            <p className="text-sm mb-2">
              You won't receive live updates about new bids or auction changes.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-amber-800 border-amber-300 hover:bg-amber-100"
              onClick={reconnect}
            >
              Reconnect
            </Button>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid Amount (PLN)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={minBid}
                      step={minBidIncrement}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Minimum bid: {minBid.toLocaleString()} PLN
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isProxy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable proxy bidding
                    </FormLabel>
                    <p className="text-xs text-gray-500">
                      System will automatically bid for you up to your maximum
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {isProxyBid && (
              <FormField
                control={form.control}
                name="maxProxyAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Proxy Bid (PLN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={form.getValues('amount')}
                        step={minBidIncrement}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Must be greater than or equal to your bid amount
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !isConnected}
              >
                {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
              </Button>
              
              {transactionStatus && (
                <div className="flex justify-center">
                  <TransactionStatusIndicator 
                    status={transactionStatus} 
                    pendingText="Processing bid..."
                    successText="Bid placed successfully"
                    errorText="Bid failed"
                  />
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
