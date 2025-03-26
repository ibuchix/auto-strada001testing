
/**
 * Hook for managing realtime bid updates
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeBids = (carId?: string) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Function to check connection and reconnect if needed
  const reconnect = useCallback(() => {
    // Remove any existing subscriptions
    supabase.removeAllChannels();
    
    // Create a new subscription
    if (carId) {
      const channel = supabase
        .channel(`car-bids-${carId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=eq.${carId}`
        }, (payload) => {
          setIsConnected(true);
          setLastUpdate(new Date());
        })
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    }
    
    setIsConnected(true);
  }, [carId]);

  // Set up subscription on mount or when carId changes
  useEffect(() => {
    reconnect();
    
    // Check connection periodically
    const interval = setInterval(() => {
      const now = new Date();
      const lastUpdateTime = lastUpdate ? lastUpdate.getTime() : 0;
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime;
      
      // If we haven't had an update in 5 minutes, check connection
      if (timeSinceLastUpdate > 5 * 60 * 1000) {
        reconnect();
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
      supabase.removeAllChannels();
    };
  }, [carId, reconnect, lastUpdate]);

  return {
    isConnected,
    reconnect,
    lastUpdate
  };
};
