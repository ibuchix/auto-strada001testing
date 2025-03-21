
/**
 * Changes made:
 * - 2024-06-18: Enhanced with visual feedback using custom components
 * - 2024-06-18: Improved toast notifications with BidNotification component
 * - 2024-12-08: Added reconnection support for WebSocket connection failures
 * - 2024-12-09: Refactored into smaller files for better code organization
 * - 2024-12-13: Added graceful degradation when real-time connection fails
 * - 2024-12-13: Improved error handling and user feedback for connection issues
 */

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { BidNotification } from '@/components/auction/BidNotification';
import { useRealtime } from '@/components/RealtimeProvider';
import { useChannelSubscription } from './realtime/useChannelSubscription';
import { toast } from 'sonner';

export const useRealtimeBids = () => {
  const { toast: uiToast } = useToast();
  const { reconnect, isConnected } = useRealtime();
  const [hasShownConnectionError, setHasShownConnectionError] = useState(false);
  
  // Enhanced toast wrapper that uses our custom BidNotification component
  const enhancedToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string, 
    description?: string,
    duration = 5000
  ) => {
    uiToast({
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
  
  // Setup channel subscriptions using the extracted hook with connection status awareness
  useChannelSubscription(enhancedToast, isConnected);
  
  // Show a warning when realtime is disconnected (but only once)
  useEffect(() => {
    if (!isConnected && !hasShownConnectionError) {
      toast.error('Realtime connection unavailable', {
        description: 'You may not receive bid updates in real-time',
        duration: 5000,
        action: {
          label: 'Reconnect',
          onClick: () => {
            toast.loading('Attempting to reconnect...');
            reconnect();
          }
        }
      });
      setHasShownConnectionError(true);
    } else if (isConnected && hasShownConnectionError) {
      toast.success('Realtime connection restored', {
        duration: 3000
      });
      setHasShownConnectionError(false);
    }
  }, [isConnected, hasShownConnectionError, reconnect]);
  
  return { reconnect, isConnected };
};
