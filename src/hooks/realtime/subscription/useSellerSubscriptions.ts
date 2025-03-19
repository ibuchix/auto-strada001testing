
/**
 * Changes made:
 * - 2024-12-11: Created dedicated hook for seller-specific subscriptions
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBaseSubscription } from './useBaseSubscription';

/**
 * Hook for seller-specific realtime subscriptions
 */
export const useSellerSubscriptions = (userId: string | undefined, isActive: boolean) => {
  const { setupChannel, invalidateQueries, isActive: baseIsActive } = useBaseSubscription(userId, isActive);
  
  useEffect(() => {
    if (!userId || !isActive) return;
    
    // Subscribe to verification status changes
    const verificationChannel = setupChannel(
      'seller-verification-changes',
      'sellers',
      `user_id=eq.${userId}`,
      'UPDATE',
      (payload) => {
        console.log('Real-time seller verification update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['seller_profile', userId]);
        
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
    );
    
    // Subscribe to seller metrics updates
    const metricsChannel = setupChannel(
      'seller-metrics-changes',
      'seller_performance_metrics',
      `seller_id=eq.${userId}`,
      '*',
      (payload) => {
        console.log('Real-time seller metrics update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['seller_performance', userId]);
        
        // No need for notifications here as metrics updates are background events
      }
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(verificationChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [userId, isActive, setupChannel, invalidateQueries]);
};
