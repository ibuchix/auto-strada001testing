
/**
 * Hook for managing car status transitions
 * Created: 2025-05-21
 */

import { useState, useCallback } from 'react';
import { useCarOwnership } from './useCarOwnership';
import { toast } from 'sonner';

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
      const success = await changeStatus(carId, newStatus, isDraft);
      
      if (success) {
        if (onTransitionSuccess) {
          onTransitionSuccess(carId, newStatus);
        }
      }
      
      return success;
    } catch (error) {
      console.error("Error during status transition:", error);
      toast.error("Failed to change listing status");
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [changeStatus, onTransitionSuccess]);
  
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
