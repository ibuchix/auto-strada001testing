
/**
 * Changes made:
 * - 2024-03-30: Enhanced real-time subscription with error handling
 * - 2024-03-30: Added reconnection logic with exponential backoff
 * - 2024-03-30: Improved bid conflict resolution
 * - 2024-03-30: Added comprehensive status notifications
 * - 2024-03-31: Fixed missing useToast import
 * - 2024-04-01: Fixed import to use correct useToast hook
 * - 2024-04-02: Refactored into smaller files for better maintainability
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';

// Import refactored utilities
import { setupBidsChannel } from './realtime/channelSetup';
import { 
  handleNewBid, 
  handleBidStatusUpdate, 
  handleSellerBidUpdate, 
  handleCarStatusUpdate 
} from './realtime/eventHandlers';
import { handleReconnect } from './realtime/reconnectionHandler';

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
    
    try {
      const channel = setupBidsChannel({
        userId: session.user.id,
        userRole: session.user.role,
        onNewBid: (payload) => handleNewBid(payload, toast),
        onBidStatusUpdate: (payload) => handleBidStatusUpdate(payload, toast),
        onSellerBidUpdate: (payload) => handleSellerBidUpdate(payload, toast),
        onCarStatusUpdate: (payload) => handleCarStatusUpdate(payload, toast),
        toast
      });
      
      channel.subscribe((status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setIsReconnecting(false);
          reconnectAttemptsRef.current = 0;
          console.log('Successfully subscribed to real-time bid updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error, will attempt to reconnect');
          setIsConnected(false);
          initiateReconnect();
        } else if (status === 'TIMED_OUT') {
          console.error('Channel timed out, will attempt to reconnect');
          setIsConnected(false);
          initiateReconnect();
        }
      });
        
      return channel;
    } catch (error) {
      console.error('Error setting up realtime channel:', error);
      return null;
    }
  }, [session?.user?.id, session?.user?.role, toast]);
  
  // Function to handle reconnection with exponential backoff
  const initiateReconnect = useCallback(() => {
    handleReconnect({
      channelRef,
      reconnectAttemptsRef,
      isReconnecting,
      setIsReconnecting,
      setupChannel,
      maxReconnectAttempts,
      toast
    });
  }, [isReconnecting, setupChannel, toast, maxReconnectAttempts]);
  
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
    reconnect: initiateReconnect
  };
};
