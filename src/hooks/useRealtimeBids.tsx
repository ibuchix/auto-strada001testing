import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const useRealtimeBids = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) return;

    // Create a channel for real-time updates
    const channel = supabase
      .channel('bids-updates')
      // Listen for new bids on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${session.user.id}')`,
        },
        (payload) => {
          console.log('New bid received:', payload);
          toast({
            title: 'New Bid Received!',
            description: `A new bid of $${payload.new.amount.toLocaleString()} has been placed.`,
          });
        }
      )
      // Listen for bid status updates for dealers
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Bid status updated:', payload);
          toast({
            title: 'Bid Status Updated',
            description: `Your bid status has been updated to: ${payload.new.status}`,
            variant: payload.new.status === 'accepted' ? 'default' : 'destructive',
          });
        }
      )
      // Listen for bid status updates on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${session.user.id}')`,
        },
        (payload) => {
          console.log('Bid on seller car updated:', payload);
          if (payload.old.status !== payload.new.status) {
            toast({
              title: 'Bid Status Changed',
              description: `A bid on your car has changed status to: ${payload.new.status}`,
            });
          }
        }
      )
      .subscribe();

    // Log successful subscription
    console.log('Subscribed to real-time bid updates');

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);
};