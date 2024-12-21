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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${session.user.id}')`,
        },
        (payload) => {
          toast({
            title: 'New Bid Received!',
            description: `A new bid of $${payload.new.amount} has been placed.`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${session.user.id}`,
        },
        (payload) => {
          toast({
            title: 'Bid Status Updated',
            description: `Your bid status has been updated to: ${payload.new.status}`,
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);
};