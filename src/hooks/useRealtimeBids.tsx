/**
 * Changes made:
 * - 2024-03-30: Enhanced real-time subscription with error handling
 * - 2024-03-30: Added reconnection logic with exponential backoff
 * - 2024-03-30: Improved bid conflict resolution
 * - 2024-03-30: Added comprehensive status notifications
 * - 2024-03-31: Fixed missing useToast import
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeBids = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Create a memoized function to setup the channel
  const setupChannel = useCallback(() => {
    if (!session?.user) return null;
    
    console.log('Setting up real-time channel for bids');
    
    try {
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
              description: `A new bid of ${payload.new.amount.toLocaleString()} PLN has been placed on your vehicle.`,
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
            
            // Handle different bid status scenarios
            if (payload.new.status === 'accepted') {
              toast({
                title: 'Bid Accepted!',
                description: `Your bid of ${payload.new.amount.toLocaleString()} PLN has been accepted.`,
                variant: 'default',
              });
            } else if (payload.new.status === 'outbid') {
              toast({
                title: 'You\'ve Been Outbid',
                description: `Someone placed a higher bid than your ${payload.new.amount.toLocaleString()} PLN bid.`,
                variant: 'destructive',
              });
            } else if (payload.new.status === 'rejected') {
              toast({
                title: 'Bid Rejected',
                description: `Your bid of ${payload.new.amount.toLocaleString()} PLN was rejected.`,
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Bid Status Updated',
                description: `Your bid status has been updated to: ${payload.new.status}`,
                variant: payload.new.status === 'accepted' ? 'default' : 'destructive',
              });
            }
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
            // Only notify for status changes
            if (payload.old.status !== payload.new.status) {
              console.log('Bid on seller car updated:', payload);
              
              const bidAmount = payload.new.amount.toLocaleString();
              let message = '';
              
              switch(payload.new.status) {
                case 'accepted':
                  message = `You've accepted a bid of ${bidAmount} PLN`;
                  break;
                case 'rejected':
                  message = `You've rejected a bid of ${bidAmount} PLN`;
                  break;
                case 'outbid':
                  message = `A bid of ${bidAmount} PLN was outbid by another dealer`;
                  break;
                default:
                  message = `A bid of ${bidAmount} PLN changed status to: ${payload.new.status}`;
              }
              
              toast({
                title: 'Bid Status Changed',
                description: message,
              });
            }
          }
        )
        // Listen for car status updates (auction started, ended, etc.)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cars',
            filter: session.user.role === 'seller' 
              ? `seller_id=eq.${session.user.id}` 
              : `id=in.(SELECT car_id FROM bids WHERE dealer_id='${session.user.id}')`,
          },
          (payload) => {
            // Only notify for meaningful changes
            const oldStatus = payload.old.auction_status;
            const newStatus = payload.new.auction_status;
            
            if (oldStatus !== newStatus) {
              console.log('Car auction status changed:', payload);
              
              let title = '';
              let description = '';
              
              // Generate appropriate message based on status change
              if (newStatus === 'active' && oldStatus !== 'active') {
                title = 'Auction Started';
                description = `Auction for ${payload.new.make} ${payload.new.model} has started`;
              } else if (newStatus === 'ended' && oldStatus === 'active') {
                title = 'Auction Ended';
                description = `Auction for ${payload.new.make} ${payload.new.model} has ended`;
              } else if (newStatus === 'sold') {
                title = 'Vehicle Sold';
                description = `${payload.new.make} ${payload.new.model} has been sold for ${payload.new.current_bid?.toLocaleString()} PLN`;
              }
              
              if (title) {
                toast({ title, description });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setIsReconnecting(false);
            reconnectAttemptsRef.current = 0;
            console.log('Successfully subscribed to real-time bid updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error, will attempt to reconnect');
            setIsConnected(false);
            handleReconnect();
          } else if (status === 'TIMED_OUT') {
            console.error('Channel timed out, will attempt to reconnect');
            setIsConnected(false);
            handleReconnect();
          }
        });
        
      return channel;
    } catch (error) {
      console.error('Error setting up real-time channel:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates. Will retry automatically.',
        variant: 'destructive',
      });
      return null;
    }
  }, [session?.user?.id, session?.user?.role]);
  
  // Function to handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      toast({
        title: 'Connection Failed',
        description: 'Could not reconnect to real-time updates. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }
    
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const backoffTime = Math.pow(2, reconnectAttemptsRef.current) * 1000;
    reconnectAttemptsRef.current += 1;
    
    console.log(`Attempting to reconnect in ${backoffTime/1000}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      
      channelRef.current = setupChannel();
      setIsReconnecting(false);
    }, backoffTime);
  }, [setupChannel, isReconnecting]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!session?.user) return;
    
    // Only set up channel if not already connected
    if (!isConnected && !isReconnecting && !channelRef.current) {
      channelRef.current = setupChannel();
    }
    
    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.user, isConnected, isReconnecting, setupChannel]);

  return {
    isConnected,
    isReconnecting,
    reconnect: handleReconnect
  };
};
