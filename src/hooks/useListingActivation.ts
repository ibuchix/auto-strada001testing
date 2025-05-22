
/**
 * Listing Activation Hook
 * Created: 2025-05-22
 * Purpose: Handle car listing activation with consistent error handling
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCarStatusTransitions } from '@/hooks/useCarStatusTransitions';

interface UseListingActivationProps {
  onActivationSuccess?: () => void;
  onActivationError?: (error: Error) => void;
}

export const useListingActivation = ({
  onActivationSuccess,
  onActivationError
}: UseListingActivationProps = {}) => {
  const [isActivating, setIsActivating] = useState(false);
  const { transitionStatus } = useCarStatusTransitions({
    onTransitionSuccess: () => {
      if (onActivationSuccess) onActivationSuccess();
    }
  });
  
  const activateListing = async (id: string, valuationData?: any) => {
    if (isActivating) return;
    
    setIsActivating(true);
    try {
      console.log('Activating listing with ID:', id);
      
      // Get current user session to confirm auth status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("You must be logged in to activate a listing");
      }
      
      console.log(`Auth status confirmed for user: ${sessionData.session.user.id}`);
      
      // Validate valuation data
      if (!valuationData?.basePrice) {
        throw new Error("Cannot activate listing without valuation data");
      }
      
      // Use the transition_car_status function
      const result = await transitionStatus(
        id,
        'available',  // Set status to available
        false         // Set isDraft to false
      );
      
      if (!result) {
        throw new Error("Failed to activate listing through transition");
      }
      
      toast.success('Listing activated successfully', {
        description: 'Your listing is now live and visible to dealers'
      });
      
      // Force refresh the listings
      if (onActivationSuccess) onActivationSuccess();
    } catch (error: any) {
      console.error('Error activating listing:', error);
      
      // Show detailed error message
      toast.error(error.message || "Failed to activate listing");
      
      if (onActivationError && error instanceof Error) {
        onActivationError(error);
      }
    } finally {
      setIsActivating(false);
    }
  };
  
  return {
    isActivating,
    activateListing
  };
};
