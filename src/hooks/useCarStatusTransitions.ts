
/**
 * Hook for managing car status transitions
 * Created: 2025-05-21
 * Updated: 2025-06-03 - Enhanced with better error handling and logging
 */

import { useState, useCallback } from 'react';
import { useCarOwnership } from './useCarOwnership';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseCarStatusTransitionsProps {
  onTransitionSuccess?: (carId: string, newStatus: string) => void;
  onTransitionError?: (error: Error) => void;
}

export const useCarStatusTransitions = ({
  onTransitionSuccess,
  onTransitionError
}: UseCarStatusTransitionsProps = {}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { changeStatus } = useCarOwnership({
    onSuccess: (action) => {
      console.log(`Car status transition successful: ${action}`);
    },
    onError: (error) => {
      if (onTransitionError) {
        onTransitionError(error);
      }
    }
  });
  
  const transitionStatus = useCallback(async (
    carId: string, 
    newStatus: string,
    isDraft?: boolean
  ) => {
    setIsTransitioning(true);
    try {
      console.log(`[StatusTransition] Transitioning car ${carId} to status "${newStatus}" with isDraft=${isDraft}`);
      
      // First attempt: Use the security definer function from supabase
      try {
        const { data, error } = await supabase.rpc('transition_car_status', {
          p_car_id: carId,
          p_new_status: newStatus,
          p_is_draft: isDraft
        });
        
        if (error) {
          console.error("[StatusTransition] Security definer transition failed:", error);
          throw error;
        }
        
        console.log("[StatusTransition] Security definer transition succeeded:", data);
        
        if (onTransitionSuccess) {
          onTransitionSuccess(carId, newStatus);
        }
        
        return true;
      } catch (directError) {
        console.warn("[StatusTransition] Direct transition failed, trying fallback method:", directError);
        
        // Fallback: Try with legacy changeStatus method
        const success = await changeStatus(carId, newStatus, isDraft);
        
        if (success) {
          if (onTransitionSuccess) {
            onTransitionSuccess(carId, newStatus);
          }
          return true;
        } else {
          throw new Error("Fallback transition method also failed");
        }
      }
    } catch (error) {
      console.error("[StatusTransition] Error during status transition:", error);
      toast.error("Failed to change listing status", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      
      if (onTransitionError && error instanceof Error) {
        onTransitionError(error);
      }
      
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [changeStatus, onTransitionSuccess, onTransitionError]);
  
  const publishListing = useCallback(async (carId: string) => {
    return transitionStatus(carId, 'available', false);
  }, [transitionStatus]);
  
  const withdrawListing = useCallback(async (carId: string) => {
    return transitionStatus(carId, 'withdrawn', false);
  }, [transitionStatus]);
  
  const saveDraft = useCallback(async (carId: string) => {
    return transitionStatus(carId, 'draft', true);
  }, [transitionStatus]);
  
  return {
    isTransitioning,
    transitionStatus,
    publishListing,
    withdrawListing,
    saveDraft
  };
};
