
/**
 * Changes made:
 * - 2024-04-02: Created reconnection utility with exponential backoff
 */

import { MutableRefObject } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface ReconnectionHandlerProps {
  channelRef: MutableRefObject<RealtimeChannel | null>;
  reconnectAttemptsRef: MutableRefObject<number>;
  isReconnecting: boolean;
  setIsReconnecting: (value: boolean) => void;
  setupChannel: () => RealtimeChannel | null;
  maxReconnectAttempts: number;
  toast: ReturnType<typeof useToast>['toast'];
}

export const handleReconnect = ({
  channelRef,
  reconnectAttemptsRef,
  isReconnecting,
  setIsReconnecting,
  setupChannel,
  maxReconnectAttempts,
  toast
}: ReconnectionHandlerProps) => {
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
};
