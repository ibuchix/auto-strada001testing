
/**
 * Changes made:
 * - 2024-06-18: Enhanced with visual feedback using custom components
 * - 2024-06-18: Improved toast notifications with BidNotification component
 * - 2024-12-08: Added reconnection support for WebSocket connection failures
 * - 2024-12-09: Refactored into smaller files for better code organization
 */

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { BidNotification } from '@/components/auction/BidNotification';
import { useRealtime } from '@/components/RealtimeProvider';
import { useChannelSubscription } from './realtime/useChannelSubscription';

export const useRealtimeBids = () => {
  const { toast } = useToast();
  const { reconnect, isConnected } = useRealtime();
  
  // Enhanced toast wrapper that uses our custom BidNotification component
  const enhancedToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string, 
    description?: string,
    duration = 5000
  ) => {
    toast({
      title: '', // Empty as we're using custom component
      description: (
        <BidNotification 
          type={type} 
          title={title} 
          description={description} 
        />
      ),
      duration,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };
  
  // Setup channel subscriptions using the extracted hook
  useChannelSubscription(enhancedToast, isConnected);
  
  return { reconnect, isConnected };
};
