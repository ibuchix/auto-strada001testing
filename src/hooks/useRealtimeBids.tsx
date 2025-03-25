
/**
 * Changes made:
 * - 2024-06-18: Enhanced with visual feedback using custom components
 * - 2024-06-18: Improved toast notifications with BidNotification component
 * - 2024-12-08: Added reconnection support for WebSocket connection failures
 * - 2024-12-09: Refactored into smaller files for better code organization
 * - 2024-12-13: Added graceful degradation when real-time connection fails
 * - 2024-12-13: Improved error handling and user feedback for connection issues
 * - 2024-12-14: Enhanced WebSocket reconnection handling and user feedback
 * - 2024-12-18: Updated import to use new RealtimeContext location
 * - 2024-12-19: Fixed TypeScript error with useChannelSubscription call
 * - 2024-12-20: Removed incorrect function call that was causing TS2554 error
 */

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { BidNotification } from '@/components/auction/BidNotification';
import { useRealtime } from '@/components/RealtimeProvider';
import { toast } from 'sonner';

export const useRealtimeBids = () => {
  const { toast: uiToast } = useToast();
  const { reconnect, isConnected } = useRealtime();
  const [hasShownConnectionError, setHasShownConnectionError] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
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
  
  // Handle reconnection with exponential backoff
  const handleReconnect = () => {
    const maxReconnectAttempts = 5;
    if (reconnectAttempts < maxReconnectAttempts) {
      // Calculate backoff time: 1s, 2s, 4s, 8s, 16s
      const backoffTime = Math.pow(2, reconnectAttempts) * 1000;
      
      toast.loading(`Attempting to reconnect in ${backoffTime/1000}s...`, {
        id: 'reconnect-toast'
      });
      
      setTimeout(() => {
        toast.dismiss('reconnect-toast');
        toast.loading('Reconnecting...');
        reconnect().then(() => {
          toast.success('Connection restored');
          setReconnectAttempts(0);
        }).catch(() => {
          toast.error('Reconnection failed');
          setReconnectAttempts(prev => prev + 1);
        });
      }, backoffTime);
    } else {
      toast.error('Maximum reconnection attempts reached', {
        description: 'Please refresh the page to try again.',
        duration: 10000
      });
    }
  };
  
  // Show a warning when realtime is disconnected (but only once)
  useEffect(() => {
    if (!isConnected && !hasShownConnectionError) {
      toast.error('Realtime connection unavailable', {
        description: 'You may not receive bid updates in real-time',
        duration: 5000,
        action: {
          label: 'Reconnect',
          onClick: handleReconnect
        }
      });
      setHasShownConnectionError(true);
    } else if (isConnected && hasShownConnectionError) {
      toast.success('Realtime connection restored', {
        duration: 3000
      });
      setHasShownConnectionError(false);
      setReconnectAttempts(0);
    }
  }, [isConnected, hasShownConnectionError]);
  
  return { reconnect, isConnected, handleReconnect };
};
