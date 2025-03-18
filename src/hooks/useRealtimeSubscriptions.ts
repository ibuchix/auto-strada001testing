
/**
 * Changes made:
 * - 2024-09-13: Created comprehensive real-time subscription system for Supabase channels
 */

import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to manage all real-time subscriptions for a seller
 */
export const useRealtimeSubscriptions = (session: Session | null) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!session?.user) return;
    
    const userId = session.user.id;
    
    // Subscribe to listing changes (status updates, approvals, etc.)
    const listingsChannel = supabase
      .channel('seller-listings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'cars',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time listing update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['seller_listings', userId] });
          
          // Determine what changed and show appropriate notification
          if (payload.eventType === 'INSERT') {
            toast.success('New listing created');
          } else if (payload.eventType === 'UPDATE') {
            // Check what specific status changed
            const oldRecord = payload.old as any;
            const newRecord = payload.new as any;
            
            if (oldRecord.is_draft && !newRecord.is_draft) {
              toast.success('Listing activated successfully');
            } else if (oldRecord.status !== newRecord.status) {
              // Handle listing approval status changes
              if (newRecord.status === 'approved') {
                toast.success('Your listing has been approved');
              } else if (newRecord.status === 'rejected') {
                toast.error('Your listing was not approved');
              } else {
                toast.info(`Listing status changed to: ${newRecord.status}`);
              }
            } else if (oldRecord.auction_status !== newRecord.auction_status) {
              if (newRecord.auction_status === 'sold') {
                toast.success('Your vehicle has been sold! 🎉');
              } else if (newRecord.auction_status === 'active') {
                toast.info('Your auction is now active');
              } else if (newRecord.auction_status === 'ended') {
                toast.info('Your auction has ended');
              }
            }
          } else if (payload.eventType === 'DELETE') {
            toast.info('Listing removed');
          }
        }
      )
      .subscribe();

    // Subscribe to auction schedule changes
    const auctionScheduleChannel = supabase
      .channel('seller-auction-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_schedules',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          console.log('Real-time auction schedule update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['seller_auctions', userId] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('Auction scheduled for your vehicle');
          } else if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as any;
            
            if (newRecord.status === 'running') {
              toast.info('Your auction has started');
            } else if (newRecord.status === 'completed') {
              toast.info('Your auction has been completed');
            } else if (newRecord.status === 'cancelled') {
              toast.info('Your auction has been cancelled');
            }
          }
        }
      )
      .subscribe();
      
    // Subscribe to bid updates on seller's cars
    const bidsChannel = supabase
      .channel('seller-bids-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          console.log('Real-time bid update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['car_bids'] });
          
          // New bid notification
          const newBid = payload.new as any;
          toast.success('New bid received', {
            description: `A bid of ${newBid.amount} has been placed on your vehicle`
          });
        }
      )
      .subscribe();
      
    // Subscribe to verification status changes
    const verificationChannel = supabase
      .channel('seller-verification-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sellers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time seller verification update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['seller_profile', userId] });
          
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          if (oldRecord.verification_status !== newRecord.verification_status) {
            if (newRecord.verification_status === 'approved') {
              toast.success('Your seller account has been verified!');
            } else if (newRecord.verification_status === 'rejected') {
              toast.error('Your seller verification was rejected');
            }
          }
        }
      )
      .subscribe();
      
    // Subscribe to listing verification changes
    const listingVerificationChannel = supabase
      .channel('listing-verification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_verifications',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          console.log('Real-time listing verification update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['listing_verifications'] });
          
          if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as any;
            
            if (newRecord.verification_status === 'approved') {
              toast.success('Your listing has been verified!');
            } else if (newRecord.verification_status === 'rejected') {
              toast.error('Your listing verification was rejected', {
                description: newRecord.rejection_reason ? `Reason: ${newRecord.rejection_reason}` : undefined
              });
            }
          }
        }
      )
      .subscribe();
      
    // Subscribe to auction results
    const auctionResultsChannel = supabase
      .channel('seller-auction-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_results',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          console.log('Real-time auction result update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['auction_results', userId] });
          
          const newRecord = payload.new as any;
          
          if (newRecord.sale_status === 'sold') {
            toast.success('Your auction has resulted in a sale!', {
              description: newRecord.final_price ? `Final price: ${newRecord.final_price}` : undefined
            });
          } else {
            toast.info('Your auction has ended without a sale');
          }
        }
      )
      .subscribe();
      
    // Subscribe to seller metrics updates
    const metricsChannel = supabase
      .channel('seller-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seller_performance_metrics',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time seller metrics update received:', payload);
          
          // Invalidate the relevant queries
          queryClient.invalidateQueries({ queryKey: ['seller_performance', userId] });
          
          // No need for notifications here as metrics updates are background events
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(listingsChannel);
      supabase.removeChannel(auctionScheduleChannel);
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(verificationChannel);
      supabase.removeChannel(listingVerificationChannel);
      supabase.removeChannel(auctionResultsChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [session, queryClient]);
};
