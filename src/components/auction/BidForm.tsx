
/**
 * Changes made:
 * - 2024-03-30: Created BidForm component with real-time capabilities
 * - 2024-03-30: Integrated with bid utilities for conflict resolution
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    setIsSubmitting(true);
    
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bid</CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded">
            <p className="text-sm">
              Real-time connection lost. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-yellow-800 underline"
                onClick={reconnect}
              >
                Reconnect
              </Button>
            </p>
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !isConnected}
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
